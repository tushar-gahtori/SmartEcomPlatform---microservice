package com.example.notificationservice.repository;

import com.example.notificationservice.entity.NotificationLog;
import com.example.notificationservice.entity.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

    Optional<NotificationLog> findByEventId(String eventId);

    List<NotificationLog> findByStatus(NotificationStatus status);

    List<NotificationLog> findByOrderId(Long orderId);
}