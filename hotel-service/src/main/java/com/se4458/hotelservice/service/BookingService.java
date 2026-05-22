package com.se4458.hotelservice.service;

import com.se4458.hotelservice.config.SqsConfig;
import com.se4458.hotelservice.dto.request.CreateBookingRequest;
import com.se4458.hotelservice.dto.response.BookingResponse;
import com.se4458.hotelservice.dto.response.PageResponse;
import com.se4458.hotelservice.model.Booking;
import com.se4458.hotelservice.model.Hotel;
import com.se4458.hotelservice.model.Room;
import com.se4458.hotelservice.model.enums.BookingStatus;
import com.se4458.hotelservice.model.enums.RoomStatus;
import com.se4458.hotelservice.repository.BookingRepository;
import com.se4458.hotelservice.repository.HotelRepository;
import com.se4458.hotelservice.repository.RoomRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final HotelRepository hotelRepository;
    private final SqsTemplate sqsTemplate;
    private final SqsConfig sqsConfig;

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest req, String userId, boolean applyDiscount) {
        Room room = roomRepository.findByIdWithLock(req.getRoomId())
            .orElseThrow(() -> new RuntimeException("Room not found: " + req.getRoomId()));

        if (room.getStatus() == RoomStatus.OCCUPIED) {
            throw new RuntimeException("Room is not available for booking");
        }

        Hotel hotel = hotelRepository.findById(req.getHotelId())
            .orElseThrow(() -> new RuntimeException("Hotel not found: " + req.getHotelId()));

        long nights = ChronoUnit.DAYS.between(req.getCheckIn(), req.getCheckOut());
        if (nights <= 0) throw new RuntimeException("Check-out must be after check-in");

        BigDecimal pricePerNight = applyDiscount
            ? room.getPricePerNight().multiply(new BigDecimal("0.85"))
            : room.getPricePerNight();
        BigDecimal totalPrice = pricePerNight.multiply(BigDecimal.valueOf(nights));

        room.setStatus(RoomStatus.OCCUPIED);
        roomRepository.save(room);

        Booking booking = Booking.builder()
            .hotel(hotel).room(room).userId(userId)
            .checkIn(req.getCheckIn()).checkOut(req.getCheckOut())
            .guestCount(req.getGuestCount()).totalPrice(totalPrice)
            .status(BookingStatus.CONFIRMED).build();
        booking = bookingRepository.save(booking);

        sendSqsMessage(booking, hotel);
        return toResponse(booking);
    }

    private void sendSqsMessage(Booking booking, Hotel hotel) {
        if (sqsConfig.getQueueUrl() == null || sqsConfig.getQueueUrl().isBlank()) return;
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("bookingId", booking.getId());
            payload.put("hotelId", booking.getHotel().getId());
            payload.put("userId", booking.getUserId());
            payload.put("checkIn", booking.getCheckIn().toString());
            payload.put("checkOut", booking.getCheckOut().toString());
            payload.put("hotelAdminEmail", hotel.getAdminEmail() != null ? hotel.getAdminEmail() : "");
            sqsTemplate.send(sqsConfig.getQueueUrl(), payload);
        } catch (Exception e) {
            log.warn("Failed to send SQS message for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    public BookingResponse getBooking(Long bookingId) {
        return toResponse(bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId)));
    }

    public PageResponse<BookingResponse> getUserBookings(String userId, int page, int size) {
        Page<Booking> p = bookingRepository.findByUserId(userId, PageRequest.of(page, size));
        return PageResponse.<BookingResponse>builder()
            .data(p.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
            .page(p.getNumber()).size(p.getSize())
            .totalElements(p.getTotalElements()).totalPages(p.getTotalPages()).build();
    }

    private BookingResponse toResponse(Booking b) {
        return BookingResponse.builder()
            .id(b.getId()).hotelId(b.getHotel().getId())
            .hotelName(b.getHotel().getName()).roomId(b.getRoom().getId())
            .userId(b.getUserId()).checkIn(b.getCheckIn()).checkOut(b.getCheckOut())
            .guestCount(b.getGuestCount()).totalPrice(b.getTotalPrice())
            .status(b.getStatus()).createdAt(b.getCreatedAt()).build();
    }
}
