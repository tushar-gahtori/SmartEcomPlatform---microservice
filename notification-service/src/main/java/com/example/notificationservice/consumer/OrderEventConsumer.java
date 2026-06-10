package com.example.notificationservice.consumer;

import com.example.common.constants.KafkaTopics;
import com.example.common.event.OrderPlacedEvent;
import com.example.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(
            topics = KafkaTopics.ORDER_PLACED,
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleOrderPlaced(ConsumerRecord<String, OrderPlacedEvent> record,
                                  Acknowledgment acknowledgment) {

        OrderPlacedEvent event = record.value();

        log.info("Received OrderPlacedEvent — orderId={}, eventId={}, " +
                        "partition={}, offset={}",
                event.getOrderId(), event.getEventId(),
                record.partition(), record.offset());

        try {
            notificationService.processOrderPlacedEvent(
                    event,
                    record.partition(),
                    record.offset()
            );

            acknowledgment.acknowledge();

        } catch (Exception ex) {

            log.error("Unrecoverable error processing event — acknowledging to avoid " +
                            "infinite retry. eventId={}, error={}",
                    event.getEventId(), ex.getMessage());
            acknowledgment.acknowledge();
        }
    }
}