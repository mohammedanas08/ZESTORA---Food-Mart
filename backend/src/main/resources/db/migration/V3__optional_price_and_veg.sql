-- Some real menus do not list a price (e.g. "seasonal" seafood) or do not make clear whether a dish is vegetarian.
-- NULL now means "unknown / ask the restaurant" instead of forcing an invented value.
-- The order service refuses to sell an item whose price is NULL, so an unknown price can never become a free item.
ALTER TABLE products ALTER COLUMN price DROP NOT NULL;
ALTER TABLE products ALTER COLUMN veg   DROP NOT NULL;
