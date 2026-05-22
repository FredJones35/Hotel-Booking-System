package com.se4458.hotelservice.controller;

import com.se4458.hotelservice.dto.request.CreateBookingRequest;
import com.se4458.hotelservice.dto.response.BookingResponse;
import com.se4458.hotelservice.dto.response.PageResponse;
import com.se4458.hotelservice.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Booking management")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @Operation(summary = "Create a booking (USER role)")
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody CreateBookingRequest req,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<String> groups = jwt.getClaimAsStringList("cognito:groups");
        boolean applyDiscount = groups != null && (groups.contains("USER") || groups.contains("ADMIN"));
        return ResponseEntity.ok(bookingService.createBooking(req, userId, applyDiscount));
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Get booking detail")
    public ResponseEntity<BookingResponse> getBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.getBooking(bookingId));
    }

    @GetMapping("/my")
    @Operation(summary = "List current user's bookings")
    public ResponseEntity<PageResponse<BookingResponse>> myBookings(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(bookingService.getUserBookings(jwt.getSubject(), page, size));
    }
}
