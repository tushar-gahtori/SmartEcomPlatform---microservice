package com.example.notificationservice.service;

import com.example.common.event.OrderPlacedEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendOrderConfirmationEmail(OrderPlacedEvent event) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(event.getUserEmail());
        helper.setSubject("Order Confirmed — #" + event.getOrderId());

        Context context = new Context();
        context.setVariable("orderId",     event.getOrderId());
        context.setVariable("userName",    event.getUserName());
        context.setVariable("totalAmount", event.getTotalAmount());
        context.setVariable("status",      event.getStatus());
        context.setVariable("occurredAt",  event.getOccurredAt());

        String htmlContent = templateEngine.process("order-confirmation", context);
        helper.setText(htmlContent, true);  // true = isHtml

        mailSender.send(message);
        log.info("Order confirmation email sent to: {}", event.getUserEmail());
    }

    @Async
    public void sendOrderCancellationEmail(String toEmail,
                                           Long orderId) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject("Order Cancelled — #" + orderId);
        helper.setText(
                "<h2>Your order #" + orderId + " has been cancelled.</h2>" +
                        "<p>If you did not request this, please contact support.</p>",
                true
        );

        mailSender.send(message);
        log.info("Cancellation email sent to: {} for orderId={}", toEmail, orderId);
    }
}