package com.se4458.hotelservice.controller;

import com.se4458.hotelservice.dto.request.AddRoomRequest;
import com.se4458.hotelservice.dto.request.CreateHotelRequest;
import com.se4458.hotelservice.dto.response.HotelResponse;
import com.se4458.hotelservice.dto.response.PageResponse;
import com.se4458.hotelservice.dto.response.RoomResponse;
import com.se4458.hotelservice.service.HotelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Hotel administration (ADMIN role required)")
public class AdminController {

    private final HotelService hotelService;

    @PostMapping("/hotels")
    @Operation(summary = "Create a new hotel")
    public ResponseEntity<HotelResponse> createHotel(@Valid @RequestBody CreateHotelRequest req) {
        return ResponseEntity.ok(hotelService.createHotel(req));
    }

    @PutMapping("/hotels/{hotelId}")
    @Operation(summary = "Update hotel details")
    public ResponseEntity<HotelResponse> updateHotel(
            @PathVariable Long hotelId,
            @Valid @RequestBody CreateHotelRequest req) {
        return ResponseEntity.ok(hotelService.updateHotel(hotelId, req));
    }

    @PostMapping("/hotels/{hotelId}/rooms")
    @Operation(summary = "Add a room to a hotel")
    public ResponseEntity<RoomResponse> addRoom(
            @PathVariable Long hotelId,
            @Valid @RequestBody AddRoomRequest req) {
        return ResponseEntity.ok(hotelService.addRoom(hotelId, req));
    }

    @GetMapping("/hotels")
    @Operation(summary = "List all hotels (paginated)")
    public ResponseEntity<PageResponse<HotelResponse>> getAllHotels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(hotelService.getAllHotels(page, size));
    }
}
