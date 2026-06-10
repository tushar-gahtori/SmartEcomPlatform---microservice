CREATE TABLE IF NOT EXISTS products (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255)        NOT NULL,
    description VARCHAR(1000),
    category    VARCHAR(100)        NOT NULL,
    image_url   VARCHAR(500),
    price       DECIMAL(10, 2)      NOT NULL,
    stock       INT                 NOT NULL DEFAULT 0,
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_products_category (category),
    INDEX idx_products_name     (name),

    CONSTRAINT chk_price_positive CHECK (price > 0),
    CONSTRAINT chk_stock_non_negative CHECK (stock >= 0)
);

-- Seed data — 5 sample products so you can test immediately on startup
INSERT INTO products (name, description, category, price, stock) VALUES
    ('MacBook Pro 14"',  'Apple M3 chip, 16GB RAM, 512GB SSD',  'Electronics',  1999.99, 25),
    ('Sony WH-1000XM5', 'Industry leading noise cancellation',   'Electronics',   349.99, 50),
    ('Standing Desk',   'Electric height adjustable, 140x70cm',  'Furniture',     599.99, 15),
    ('Mechanical Keyboard', 'TKL, Cherry MX Red switches',       'Electronics',   129.99, 75),
    ('Monitor Arm',     'Dual arm, VESA compatible',             'Furniture',      89.99, 40);