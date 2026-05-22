package com.se4458.hotelservice.controller;

import com.se4458.hotelservice.dto.response.HotelResponse;
import com.se4458.hotelservice.dto.response.PageResponse;
import com.se4458.hotelservice.dto.response.SearchResultResponse;
import com.se4458.hotelservice.service.HotelService;
import com.se4458.hotelservice.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/hotels")
@RequiredArgsConstructor
@Tag(name = "Hotels", description = "Hotel search and detail endpoints")
public class HotelController {

    private final HotelService hotelService;
    private final SearchService searchService;

    @GetMapping("/search")
    @Operation(summary = "Search available hotels by destination and dates")
    public ResponseEntity<PageResponse<SearchResultResponse>> search(
            @RequestParam String destination,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue = "1") int guests,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        boolean isAuth = authentication != null && authentication.isAuthenticated();
        return ResponseEntity.ok(searchService.search(destination, checkIn, checkOut, guests, page, size, isAuth));
    }

    @GetMapping("/{hotelId}")
    @Operation(summary = "Get hotel detail (cached)")
    public ResponseEntity<HotelResponse> getHotel(@PathVariable Long hotelId) {
        return ResponseEntity.ok(hotelService.getHotelById(hotelId));
    }
}
