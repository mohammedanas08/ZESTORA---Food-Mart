-- Zestora core schema (PostgreSQL / Supabase). Owned by Flyway; Hibernate only validates.

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL UNIQUE,
    phone         VARCHAR(30),
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(30)  NOT NULL,
    avatar_url    VARCHAR(500),
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64)  NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ  NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

CREATE TABLE restaurants (
    id              BIGSERIAL PRIMARY KEY,
    owner_id        BIGINT REFERENCES users(id),
    name            VARCHAR(150) NOT NULL,
    slug            VARCHAR(160) NOT NULL UNIQUE,
    description     VARCHAR(500),
    cuisines        VARCHAR(300),
    image_url       VARCHAR(500),
    rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
    review_count    INT          NOT NULL DEFAULT 0,
    delivery_min    INT          NOT NULL DEFAULT 25,
    delivery_max    INT          NOT NULL DEFAULT 35,
    min_order       NUMERIC(10,2) NOT NULL DEFAULT 0,
    cost_for_two    NUMERIC(10,2),
    veg_only        BOOLEAN      NOT NULL DEFAULT FALSE,
    is_open         BOOLEAN      NOT NULL DEFAULT TRUE,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    commission_rate NUMERIC(4,3) NOT NULL DEFAULT 0.200,
    city            VARCHAR(80)  NOT NULL DEFAULT 'Bhatkal',
    lat             DOUBLE PRECISION,
    lng             DOUBLE PRECISION,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);

-- One catalogue for food AND grocery: restaurant_id is NULL for QuickMart grocery products.
CREATE TABLE products (
    id            BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE CASCADE,
    name          VARCHAR(160) NOT NULL,
    description   VARCHAR(500),
    category      VARCHAR(80),
    price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url     VARCHAR(500),
    veg           BOOLEAN NOT NULL DEFAULT TRUE,
    available     BOOLEAN NOT NULL DEFAULT TRUE,
    grocery       BOOLEAN NOT NULL DEFAULT FALSE,
    stock         INT,
    prep_minutes  INT NOT NULL DEFAULT 15,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (stock IS NULL OR stock >= 0)
);
CREATE INDEX idx_products_restaurant ON products(restaurant_id);
CREATE INDEX idx_products_grocery ON products(grocery);

CREATE TABLE product_variants (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    price      NUMERIC(10,2) NOT NULL CHECK (price >= 0)
);
CREATE INDEX idx_variants_product ON product_variants(product_id);

CREATE TABLE product_addons (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    price      NUMERIC(10,2) NOT NULL CHECK (price >= 0)
);
CREATE INDEX idx_addons_product ON product_addons(product_id);

CREATE TABLE coupons (
    id           BIGSERIAL PRIMARY KEY,
    code         VARCHAR(40) NOT NULL UNIQUE,
    description  VARCHAR(200),
    type         VARCHAR(20) NOT NULL,
    value        NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_discount NUMERIC(10,2),
    min_order    NUMERIC(10,2) NOT NULL DEFAULT 0,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from   TIMESTAMPTZ,
    valid_until  TIMESTAMPTZ,
    usage_limit  INT,
    used_count   INT NOT NULL DEFAULT 0
);

CREATE TABLE delivery_partners (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL UNIQUE REFERENCES users(id),
    vehicle_type   VARCHAR(60),
    vehicle_number VARCHAR(30),
    online         BOOLEAN NOT NULL DEFAULT FALSE,
    rating         NUMERIC(3,2) NOT NULL DEFAULT 5,
    total_trips    INT NOT NULL DEFAULT 0,
    wallet_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
    lat            DOUBLE PRECISION,
    lng            DOUBLE PRECISION,
    location_at    TIMESTAMPTZ
);

CREATE TABLE orders (
    id                  BIGSERIAL PRIMARY KEY,
    order_number        VARCHAR(30) NOT NULL UNIQUE,
    customer_id         BIGINT NOT NULL REFERENCES users(id),
    restaurant_id       BIGINT REFERENCES restaurants(id),
    grocery             BOOLEAN NOT NULL DEFAULT FALSE,
    status              VARCHAR(30) NOT NULL,
    payment_status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method      VARCHAR(20) NOT NULL DEFAULT 'UPI',
    subtotal            NUMERIC(10,2) NOT NULL,
    packaging_fee       NUMERIC(10,2) NOT NULL,
    delivery_fee        NUMERIC(10,2) NOT NULL,
    platform_fee        NUMERIC(10,2) NOT NULL,
    tax                 NUMERIC(10,2) NOT NULL,
    discount            NUMERIC(10,2) NOT NULL DEFAULT 0,
    tip                 NUMERIC(10,2) NOT NULL DEFAULT 0,
    total               NUMERIC(10,2) NOT NULL,
    coupon_code         VARCHAR(40),
    addr_street         VARCHAR(250),
    addr_area           VARCHAR(120),
    addr_city           VARCHAR(80),
    addr_pincode        VARCHAR(10),
    addr_instructions   VARCHAR(250),
    addr_lat            DOUBLE PRECISION,
    addr_lng            DOUBLE PRECISION,
    customer_phone      VARCHAR(30),
    delivery_partner_id BIGINT REFERENCES users(id),
    rejection_reason    VARCHAR(250),
    delivery_otp        VARCHAR(6),
    version             BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_customer   ON orders(customer_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_rider      ON orders(delivery_partner_id);
CREATE INDEX idx_orders_status     ON orders(status);

CREATE TABLE order_items (
    id           BIGSERIAL PRIMARY KEY,
    order_id     BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   BIGINT NOT NULL REFERENCES products(id),
    name         VARCHAR(160) NOT NULL,
    variant_name VARCHAR(100),
    addons       VARCHAR(400),
    unit_price   NUMERIC(10,2) NOT NULL,
    quantity     INT NOT NULL CHECK (quantity > 0),
    line_total   NUMERIC(10,2) NOT NULL,
    notes        VARCHAR(250)
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TABLE order_status_history (
    id         BIGSERIAL PRIMARY KEY,
    order_id   BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status     VARCHAR(30) NOT NULL,
    actor_id   BIGINT,
    actor_role VARCHAR(30),
    note       VARCHAR(250),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_history_order ON order_status_history(order_id);

CREATE TABLE payments (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT NOT NULL REFERENCES orders(id),
    provider            VARCHAR(20) NOT NULL,
    provider_order_id   VARCHAR(80),
    provider_payment_id VARCHAR(80),
    amount              NUMERIC(10,2) NOT NULL,
    status              VARCHAR(20) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE UNIQUE INDEX uq_payments_provider_order ON payments(provider_order_id) WHERE provider_order_id IS NOT NULL;

-- Webhook idempotency: the same provider event must never be processed twice.
CREATE TABLE payment_events (
    event_id    VARCHAR(120) PRIMARY KEY,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
    id               BIGSERIAL PRIMARY KEY,
    order_id         BIGINT NOT NULL UNIQUE REFERENCES orders(id),
    customer_id      BIGINT NOT NULL REFERENCES users(id),
    restaurant_id    BIGINT REFERENCES restaurants(id),
    food_rating      INT NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
    packaging_rating INT CHECK (packaging_rating BETWEEN 1 AND 5),
    delivery_rating  INT CHECK (delivery_rating BETWEEN 1 AND 5),
    comment          VARCHAR(1000),
    reply            VARCHAR(1000),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE support_tickets (
    id         BIGSERIAL PRIMARY KEY,
    ticket_no  VARCHAR(20) NOT NULL UNIQUE,
    user_id    BIGINT NOT NULL REFERENCES users(id),
    order_id   BIGINT REFERENCES orders(id),
    category   VARCHAR(40) NOT NULL,
    subject    VARCHAR(200) NOT NULL,
    status     VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ticket_messages (
    id         BIGSERIAL PRIMARY KEY,
    ticket_id  BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id  BIGINT REFERENCES users(id),
    message    VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id         BIGSERIAL PRIMARY KEY,
    actor_id   BIGINT,
    actor_role VARCHAR(30),
    action     VARCHAR(80) NOT NULL,
    entity     VARCHAR(40),
    entity_id  VARCHAR(40),
    details    VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
