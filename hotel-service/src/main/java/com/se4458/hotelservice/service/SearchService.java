package com.se4458.hotelservice.service;

import com.se4458.hotelservice.dto.response.PageResponse;
import com.se4458.hotelservice.dto.response.RoomResponse;
import com.se4458.hotelservice.dto.response.SearchResultResponse;
import com.se4458.hotelservice.model.Hotel;
import com.se4458.hotelservice.model.Room;
import com.se4458.hotelservice.repository.HotelRepository;
import com.se4458.hotelservice.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final HotelService hotelService;

    public PageResponse<SearchResultResponse> search(
            String destination, LocalDate checkIn, LocalDate checkOut,
            int guests, int page, int size, boolean isAuthenticated) {

        Page<Hotel> hotels = hotelRepository.searchByDestination(destination, PageRequest.of(page, size));

        List<SearchResultResponse> results = hotels.getContent().stream()
            .map(hotel -> buildResult(hotel, checkIn, checkOut, guests, isAuthenticated))
            .filter(r -> !r.getAvailableRooms().isEmpty())
            .collect(Collectors.toList());

        return PageResponse.<SearchResultResponse>builder()
            .data(results).page(hotels.getNumber()).size(hotels.getSize())
            .totalElements(hotels.getTotalElements()).totalPages(hotels.getTotalPages())
            .build();
    }

    private SearchResultResponse buildResult(Hotel hotel, LocalDate checkIn, LocalDate checkOut,
                                              int guests, boolean isAuthenticated) {
        List<Room> available = roomRepository.findAvailableRooms(hotel.getId(), checkIn, checkOut, guests);
        List<RoomResponse> roomResponses = available.stream()
            .map(r -> hotelService.toRoomResponse(r, isAuthenticated))
            .collect(Collectors.toList());

        BigDecimal minPrice = roomResponses.stream()
            .map(RoomResponse::getPricePerNight).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal minDiscounted = roomResponses.stream()
            .map(RoomResponse::getDiscountedPrice).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);

        return SearchResultResponse.builder()
            .hotelId(hotel.getId()).hotelName(hotel.getName())
            .destination(hotel.getDestination()).address(hotel.getAddress())
            .latitude(hotel.getLatitude()).longitude(hotel.getLongitude())
            .starRating(hotel.getStarRating()).amenities(hotel.getAmenities())
            .description(hotel.getDescription()).imageUrl(hotel.getImageUrl())
            .availableRooms(roomResponses).minPrice(minPrice)
            .minDiscountedPrice(minDiscounted).discountApplied(isAuthenticated)
            .build();
    }
}
