package com.example.orderservice.service;

import com.example.common.constants.KafkaTopics;
import com.example.common.event.OrderPlacedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, OrderPlacedEvent> kafkaTemplate;

    public void sendOrderPlacedEvent(OrderPlacedEvent event) {

        String key = event.getOrderId().toString();

        CompletableFuture<SendResult<String, OrderPlacedEvent>> future =
                kafkaTemplate.send(KafkaTopics.ORDER_PLACED, key, event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to send OrderPlacedEvent for orderId={}: {}",
                        event.getOrderId(), ex.getMessage());
            } else {
                log.info("OrderPlacedEvent sent — orderId={}, partition={}, offset={}",
                        event.getOrderId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}