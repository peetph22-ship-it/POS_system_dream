-- Up Migration

CREATE TABLE shifts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opened_by bigint NOT NULL REFERENCES users (id),
  closed_by bigint REFERENCES users (id),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opening_cash numeric(12, 2) NOT NULL DEFAULT 0 CHECK (opening_cash >= 0),
  -- Filled when the shift closes: expected comes from payments and cash movements, counted from the drawer.
  expected_cash numeric(12, 2),
  counted_cash numeric(12, 2) CHECK (counted_cash IS NULL OR counted_cash >= 0),
  note text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  CONSTRAINT shifts_closed_fields CHECK (
    (status = 'open' AND closed_at IS NULL)
    OR (status = 'closed' AND closed_at IS NOT NULL AND closed_by IS NOT NULL)
  )
);

-- Cash put into or taken out of the drawer outside of sales (change float, petty cash).
CREATE TABLE cash_movements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shift_id bigint NOT NULL REFERENCES shifts (id),
  movement_type text NOT NULL CHECK (movement_type IN ('pay_in', 'pay_out')),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  reason text NOT NULL,
  created_by bigint NOT NULL REFERENCES users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_no text NOT NULL UNIQUE,
  order_type text NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  table_id integer REFERENCES dining_tables (id),
  shift_id bigint REFERENCES shifts (id),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'billed', 'paid', 'cancelled')),
  guest_count smallint CHECK (guest_count IS NULL OR guest_count > 0),
  customer_name text,
  note text,
  -- Totals are recalculated by the API whenever items, discounts or settings change,
  -- and frozen once the order is paid. Rates are copied so later setting changes don't alter old bills.
  vat_mode text NOT NULL CHECK (vat_mode IN ('inclusive', 'exclusive', 'none')),
  vat_rate numeric(5, 2) NOT NULL,
  service_charge_rate numeric(5, 2) NOT NULL,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  discount_total numeric(12, 2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  service_charge numeric(12, 2) NOT NULL DEFAULT 0 CHECK (service_charge >= 0),
  vat_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (vat_amount >= 0),
  rounding numeric(12, 2) NOT NULL DEFAULT 0,
  grand_total numeric(12, 2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  opened_by bigint NOT NULL REFERENCES users (id),
  closed_by bigint REFERENCES users (id),
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  CONSTRAINT orders_dine_in_needs_table CHECK (order_type <> 'dine_in' OR table_id IS NOT NULL),
  CONSTRAINT orders_cancel_needs_reason CHECK (status <> 'cancelled' OR cancel_reason IS NOT NULL)
);

-- Finds the open bills of a table quickly; table occupancy is derived from this.
CREATE INDEX orders_open_by_table_idx ON orders (table_id) WHERE status IN ('open', 'billed');
CREATE INDEX orders_created_at_idx ON orders (created_at);
CREATE INDEX orders_shift_idx ON orders (shift_id);

CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Name and price are snapshots so editing the menu never changes past orders.
CREATE TABLE order_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  menu_item_id integer REFERENCES menu_items (id),
  station_id integer REFERENCES stations (id),
  name text NOT NULL,
  unit_price numeric(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  modifiers_total numeric(12, 2) NOT NULL DEFAULT 0,
  line_total numeric(12, 2) NOT NULL CHECK (line_total >= 0),
  note text,
  -- pending: in cart, not sent; sent → preparing → ready → served follows the kitchen display.
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'preparing', 'ready', 'served', 'voided')),
  sent_at timestamptz,
  void_reason text,
  voided_by bigint REFERENCES users (id),
  created_by bigint NOT NULL REFERENCES users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_items_void_fields CHECK (status <> 'voided' OR (void_reason IS NOT NULL AND voided_by IS NOT NULL))
);

CREATE INDEX order_items_order_idx ON order_items (order_id);
-- Kitchen display query: active tickets per station.
CREATE INDEX order_items_kds_idx ON order_items (station_id, sent_at) WHERE status IN ('sent', 'preparing', 'ready');

CREATE TRIGGER order_items_set_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE order_item_modifiers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_item_id bigint NOT NULL REFERENCES order_items (id) ON DELETE CASCADE,
  modifier_id integer REFERENCES modifiers (id),
  name text NOT NULL,
  price_delta numeric(12, 2) NOT NULL DEFAULT 0
);

CREATE INDEX order_item_modifiers_item_idx ON order_item_modifiers (order_item_id);

-- Preset discounts staff can pick from.
CREATE TABLE discounts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  value numeric(12, 2) NOT NULL CHECK (value > 0),
  requires_approval boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT discounts_percent_range CHECK (discount_type <> 'percent' OR value <= 100)
);

-- Discounts applied to a bill (order_item_id NULL) or a single line.
CREATE TABLE order_discounts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  order_item_id bigint REFERENCES order_items (id) ON DELETE CASCADE,
  discount_id integer REFERENCES discounts (id),
  name text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  value numeric(12, 2) NOT NULL CHECK (value > 0),
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  applied_by bigint NOT NULL REFERENCES users (id),
  approved_by bigint REFERENCES users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX order_discounts_order_idx ON order_discounts (order_id);

-- One order can be settled with several payments (e.g. part cash, part PromptPay).
CREATE TABLE payments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders (id),
  shift_id bigint REFERENCES shifts (id),
  method text NOT NULL CHECK (method IN ('cash', 'promptpay', 'transfer', 'card', 'other')),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  -- Cash only: what the customer handed over and the change returned.
  tendered_amount numeric(12, 2),
  change_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (change_amount >= 0),
  reference text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
  received_by bigint NOT NULL REFERENCES users (id),
  refunded_by bigint REFERENCES users (id),
  refund_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  refunded_at timestamptz,
  CONSTRAINT payments_tendered_covers_amount CHECK (tendered_amount IS NULL OR tendered_amount = amount + change_amount),
  CONSTRAINT payments_refund_fields CHECK (
    status <> 'refunded' OR (refunded_by IS NOT NULL AND refunded_at IS NOT NULL AND refund_reason IS NOT NULL)
  )
);

CREATE INDEX payments_order_idx ON payments (order_id);
CREATE INDEX payments_shift_idx ON payments (shift_id);

-- Issued receipts / abbreviated tax invoices. The snapshot keeps exactly what was printed,
-- so a reprint matches the original even after menu or store settings change.
CREATE TABLE receipts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders (id),
  receipt_no text NOT NULL UNIQUE,
  receipt_type text NOT NULL CHECK (receipt_type IN ('receipt', 'abbreviated_tax_invoice', 'full_tax_invoice')),
  snapshot jsonb NOT NULL,
  issued_by bigint NOT NULL REFERENCES users (id),
  issued_at timestamptz NOT NULL DEFAULT now(),
  voided_by bigint REFERENCES users (id),
  voided_at timestamptz,
  void_reason text,
  CONSTRAINT receipts_void_fields CHECK (
    (voided_at IS NULL AND voided_by IS NULL) OR (voided_at IS NOT NULL AND voided_by IS NOT NULL AND void_reason IS NOT NULL)
  )
);

-- At most one valid receipt per order; a voided receipt can be replaced by a new one.
CREATE UNIQUE INDEX receipts_one_active_per_order_idx ON receipts (order_id) WHERE voided_at IS NULL;

-- Down Migration

DROP TABLE receipts;
DROP TABLE payments;
DROP TABLE order_discounts;
DROP TABLE discounts;
DROP TABLE order_item_modifiers;
DROP TABLE order_items;
DROP TABLE orders;
DROP TABLE cash_movements;
DROP TABLE shifts;
