-- Up Migration

-- Where an order item is prepared; drives KDS screens and ticket printers.
CREATE TABLE stations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  station_type text NOT NULL DEFAULT 'kitchen' CHECK (station_type IN ('kitchen', 'bar', 'other')),
  printer_address text,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE categories (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE menu_items (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id integer NOT NULL REFERENCES categories (id),
  station_id integer REFERENCES stations (id),
  sku text UNIQUE,
  name text NOT NULL,
  description text,
  price numeric(12, 2) NOT NULL CHECK (price >= 0),
  image_url text,
  -- is_available is toggled during service ("sold out"); is_active hides the item permanently.
  is_available boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX menu_items_category_idx ON menu_items (category_id, sort_order);

CREATE TRIGGER menu_items_set_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Option sets such as sweetness level, size, or extra toppings.
CREATE TABLE modifier_groups (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  min_select smallint NOT NULL DEFAULT 0 CHECK (min_select >= 0),
  max_select smallint CHECK (max_select IS NULL OR max_select >= 1),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT modifier_groups_select_range CHECK (max_select IS NULL OR max_select >= min_select)
);

CREATE TABLE modifiers (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id integer NOT NULL REFERENCES modifier_groups (id) ON DELETE CASCADE,
  name text NOT NULL,
  price_delta numeric(12, 2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (group_id, name)
);

CREATE TABLE menu_item_modifier_groups (
  menu_item_id integer NOT NULL REFERENCES menu_items (id) ON DELETE CASCADE,
  group_id integer NOT NULL REFERENCES modifier_groups (id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (menu_item_id, group_id)
);

CREATE TABLE zones (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE dining_tables (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  zone_id integer REFERENCES zones (id),
  name text NOT NULL UNIQUE,
  seats smallint NOT NULL DEFAULT 4 CHECK (seats > 0),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

-- Down Migration

DROP TABLE dining_tables;
DROP TABLE zones;
DROP TABLE menu_item_modifier_groups;
DROP TABLE modifiers;
DROP TABLE modifier_groups;
DROP TABLE menu_items;
DROP TABLE categories;
DROP TABLE stations;
