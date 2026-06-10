package com.example.common.constants;

public final class KafkaTopics {

    private KafkaTopics() {}

    public static final String ORDER_PLACED       = "order.placed";
    public static final String ORDER_CANCELLED    = "order.cancelled";
    public static final String PAYMENT_SUCCESS    = "payment.success";
    public static final String PAYMENT_FAILED     = "payment.failed";
    public static final String STOCK_DEDUCTED     = "stock.deducted";
    public static final String STOCK_ROLLBACK     = "stock.rollback";
}