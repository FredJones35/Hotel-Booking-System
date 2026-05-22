package com.se4458.notificationservice.listener;

import com.se4458.notificationservice.dto.ReservationMessage;
import com.se4458.notificationservice.service.EmailService;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.sqs.queue-url", matchIfMissing = false)
public class ReservationQueueListener {

    private final EmailService emailService;

    @SqsListener("${app.sqs.queue-url:hotel-new-reservations}")
    public void handleNewReservation(ReservationMessage message) {
        log.info("Received reservation: bookingId={}, hotel={}", message.getBookingId(), message.getHotelId());
        emailService.sendEmail(
            message.getHotelAdminEmail(),
            "New Reservation Confirmed — Booking #" + message.getBookingId(),
            String.format(
                "A new booking has been confirmed.\n\n" +
                "Booking ID: %d\nHotel ID: %s\nCheck-in: %s\nCheck-out: %s\n\n" +
                "Please prepare the room accordingly.",
                message.getBookingId(), message.getHotelId(),
                message.getCheckIn(), message.getCheckOut())
        );
    }
}
