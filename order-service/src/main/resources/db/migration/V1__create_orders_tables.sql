CREATE TABLE IF NOT EXISTS orders (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT          NOT NULL,
    user_email   VARCHAR(255)    NOT NULL,
    total_amount DECIMAL(10, 2)  NOT NULL,
    status       VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_orders_user_email (user_email),
    INDEX idx_orders_status     (status),
    INDEX idx_orders_user_status (user_email, status)
);

CREATE TABLE IF NOT EXISTS order_items (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT          NOT NULL,
    product_id          BIGINT          NOT NULL,
    product_name        VARCHAR(255)    NOT NULL,
    quantity            INT             NOT NULL,
    price_at_purchase   DECIMAL(10, 2)  NOT NULL,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_items_order_id   (order_id),
    INDEX idx_order_items_product_id (product_id),

    CONSTRAINT chk_quantity_positive        CHECK (quantity > 0),
    CONSTRAINT chk_price_at_purchase_positive CHECK (price_at_purchase > 0)
);

CREATE TABLE IF NOT EXISTS carts (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT          NOT NULL UNIQUE,
    user_email       VARCHAR(255)    NOT NULL,
    total_cart_price DECIMAL(10, 2)  NOT NULL DEFAULT 0.00,

    INDEX idx_carts_user_id    (user_id),
    INDEX idx_carts_user_email (user_email)
);

CREATE TABLE IF NOT EXISTS cart_items (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id     BIGINT          NOT NULL,
    product_id  BIGINT          NOT NULL,
    product_name VARCHAR(255)   NOT NULL,
    quantity    INT             NOT NULL,
    unit_price  DECIMAL(10, 2)  NOT NULL,

    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    UNIQUE KEY uq_cart_product (cart_id, product_id),
    INDEX idx_cart_items_cart_id    (cart_id),
    INDEX idx_cart_items_product_id (product_id),

    CONSTRAINT chk_cart_quantity_positive CHECK (quantity > 0)
);