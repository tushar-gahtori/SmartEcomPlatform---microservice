CREATE TABLE IF NOT EXISTS notification_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id        VARCHAR(255)    NOT NULL UNIQUE,  -- UUID from OrderPlacedEvent
    order_id        BIGINT          NOT NULL,
    recipient_email VARCHAR(255)    NOT NULL,
    subject         VARCHAR(500)    NOT NULL,
    status          VARCHAR(50)     NOT NULL,          -- SENT / FAILED / SKIPPED
    failure_reason  VARCHAR(1000),                     -- NULL on success
    kafka_partition INT             NOT NULL DEFAULT 0,
    kafka_offset    BIGINT          NOT NULL DEFAULT 0,
    processed_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_notification_event_id       (event_id),
    INDEX idx_notification_order_id       (order_id),
    INDEX idx_notification_status         (status),
    INDEX idx_notification_recipient      (recipient_email)
);