-- Up Migration

-- Keeps updated_at current on every UPDATE for tables that attach this trigger.
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE roles (
  id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL
);

INSERT INTO roles (code, name) VALUES
  ('owner', 'เจ้าของร้าน'),
  ('manager', 'ผู้จัดการ'),
  ('cashier', 'แคชเชียร์'),
  ('waiter', 'พนักงานเสิร์ฟ'),
  ('kitchen', 'ครัว / บาร์');

CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role_id smallint NOT NULL REFERENCES roles (id),
  display_name text NOT NULL,
  -- Back-office sign-in for owner/manager; staff at the POS use a PIN only.
  username text UNIQUE,
  password_hash text,
  pin_hash text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_has_credential CHECK (password_hash IS NOT NULL OR pin_hash IS NOT NULL),
  CONSTRAINT users_password_needs_username CHECK (password_hash IS NULL OR username IS NOT NULL)
);

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Single-row table holding the shop profile and tax rules used on every bill.
CREATE TABLE store_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'POS Dream',
  branch_name text,
  address text,
  phone text,
  tax_id text CHECK (tax_id IS NULL OR tax_id ~ '^[0-9]{13}$'),
  -- inclusive: menu prices include VAT; exclusive: VAT is added on top; none: not VAT registered.
  vat_mode text NOT NULL DEFAULT 'none' CHECK (vat_mode IN ('inclusive', 'exclusive', 'none')),
  vat_rate numeric(5, 2) NOT NULL DEFAULT 7.00 CHECK (vat_rate >= 0 AND vat_rate <= 100),
  service_charge_rate numeric(5, 2) NOT NULL DEFAULT 0.00 CHECK (service_charge_rate >= 0 AND service_charge_rate <= 100),
  currency char(3) NOT NULL DEFAULT 'THB',
  promptpay_id text,
  receipt_header text,
  receipt_footer text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO store_settings (id) VALUES (1);

CREATE TRIGGER store_settings_set_updated_at BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Running document numbers (orders, receipts). Revenue Department rules require
-- receipt numbers to be sequential without gaps, so they are allocated in the
-- same transaction as the document with UPDATE ... RETURNING.
CREATE TABLE document_sequences (
  code text NOT NULL,
  period text NOT NULL,
  last_value integer NOT NULL DEFAULT 0 CHECK (last_value >= 0),
  PRIMARY KEY (code, period)
);

CREATE TABLE audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint REFERENCES users (id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id bigint,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at);

-- Down Migration

DROP TABLE audit_logs;
DROP TABLE document_sequences;
DROP TABLE store_settings;
DROP TABLE users;
DROP TABLE roles;
DROP FUNCTION set_updated_at();
