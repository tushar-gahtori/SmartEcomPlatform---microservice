package com.example.notificationservice.service;

import com.example.common.event.OrderPlacedEvent;
import com.example.notificationservice.entity.NotificationLog;
import com.example.notificationservice.entity.NotificationStatus;
import com.example.notificationservice.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final EmailService emailService;
    private final NotificationLogRepository logRepository;
    private final StringRedisTemplate redisTemplate;

    private static final String IDEMPOTENCY_PREFIX = "notification:processed:";

    private static final Duration IDEMPOTENCY_TTL = Duration.ofHours(24);

    @Transactional
    public void processOrderPlacedEvent(OrderPlacedEvent event,
                                        int partition, long offset) {
        String eventId   = event.getEventId();
        String redisKey  = IDEMPOTENCY_PREFIX + eventId;

        Boolean isFirstTime = redisTemplate.opsForValue()
                .setIfAbsent(redisKey, "processed", IDEMPOTENCY_TTL);

        if (Boolean.FALSE.equals(isFirstTime)) {
            log.warn("Duplicate event detected in Redis — skipping. eventId={}",
                    eventId);
            saveLog(event, NotificationStatus.SKIPPED,
                    "Duplicate — already in Redis cache", partition, offset);
            return;
        }

        if (logRepository.findByEventId(eventId).isPresent()) {
            log.warn("Duplicate event detected in DB — skipping. eventId={}", eventId);
            saveLog(event, NotificationStatus.SKIPPED,
                    "Duplicate — found in notification_logs table", partition, offset);
            return;
        }

        try {
            emailService.sendOrderConfirmationEmail(event);
            saveLog(event, NotificationStatus.SENT, null, partition, offset);
            log.info("Notification processed successfully — orderId={}, eventId={}",
                    event.getOrderId(), eventId);

        } catch (Exception ex) {
            log.error("Failed to send notification for orderId={}: {}",
                    event.getOrderId(), ex.getMessage(), ex);
            saveLog(event, NotificationStatus.FAILED, ex.getMessage(), partition, offset);
        }
    }

    @Transactional
    public void retryFailedNotifications() {
        List<NotificationLog> failedLogs = logRepository
                .findByStatus(NotificationStatus.FAILED);

        log.info("Retrying {} failed notifications", failedLogs.size());

        failedLogs.forEach(log -> {
            try {
                OrderPlacedEvent retryEvent = OrderPlacedEvent.builder()
                        .eventId(log.getEventId())
                        .orderId(log.getOrderId())
                        .userEmail(log.getRecipientEmail())
                        .userName(log.getRecipientEmail())
                        .build();

                emailService.sendOrderConfirmationEmail(retryEvent);
                log.setStatus(NotificationStatus.SENT);
                log.setFailureReason(null);
                logRepository.save(log);

            } catch (Exception ex) {
                log.setFailureReason("Retry failed: " + ex.getMessage());
                logRepository.save(log);
            }
        });
    }

    private void saveLog(OrderPlacedEvent event,
                         NotificationStatus status,
                         String failureReason,
                         int partition,
                         long offset) {
        NotificationLog log = NotificationLog.builder()
                .eventId(event.getEventId())
                .orderId(event.getOrderId())
                .recipientEmail(event.getUserEmail())
                .subject("Order Confirmed — #" + event.getOrderId())
                .status(status)
                .failureReason(failureReason)
                .kafkaPartition(partition)
                .kafkaOffset(offset)
                .build();
        logRepository.save(log);
    }
}