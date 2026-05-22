package com.se4458.hotelservice.service;

import com.se4458.hotelservice.dto.request.AddRoomRequest;
import com.se4458.hotelservice.dto.request.CreateHotelRequest;
import com.se4458.hotelservice.dto.response.HotelResponse;
import com.se4458.hotelservice.dto.response.PageResponse;
import com.se4458.hotelservice.dto.response.RoomResponse;
import com.se4458.hotelservice.model.Hotel;
import com.se4458.hotelservice.model.Room;
import com.se4458.hotelservice.model.enums.RoomStatus;
import com.se4458.hotelservice.repository.HotelRepository;
import com.se4458.hotelservice.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HotelService {

    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;

    @Transactional
    public HotelResponse createHotel(CreateHotelRequest req) {
        Hotel hotel = Hotel.builder()
            .name(req.getName()).destination(req.getDestination())
            .address(req.getAddress()).latitude(req.getLatitude())
            .longitude(req.getLongitude()).starRating(req.getStarRating())
            .amenities(req.getAmenities()).description(req.getDescription())
            .imageUrl(req.getImageUrl()).adminEmail(req.getAdminEmail())
            .build();
        return toResponse(hotelRepository.save(hotel));
    }

    @Transactional
    @CacheEvict(value = "hotels", key = "#hotelId")
    public HotelResponse updateHotel(Long hotelId, CreateHotelRequest req) {
        Hotel hotel = hotelRepository.findById(hotelId)
            .orElseThrow(() -> new RuntimeException("Hotel not found: " + hotelId));
        hotel.setName(req.getName());
        hotel.setDestination(req.getDestination());
        hotel.setAddress(req.getAddress());
        hotel.setLatitude(req.getLatitude());
        hotel.setLongitude(req.getLongitude());
        hotel.setStarRating(req.getStarRating());
        hotel.setAmenities(req.getAmenities());
        hotel.setDescription(req.getDescription());
        hotel.setImageUrl(req.getImageUrl());
        hotel.setAdminEmail(req.getAdminEmail());
        return toResponse(hotelRepository.save(hotel));
    }

    @Cacheable(value = "hotels", key = "#hotelId")
    public HotelResponse getHotelById(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
            .orElseThrow(() -> new RuntimeException("Hotel not found: " + hotelId));
        return toResponse(hotel);
    }

    @Transactional
    public RoomResponse addRoom(Long hotelId, AddRoomRequest req) {
        Hotel hotel = hotelRepository.findById(hotelId)
            .orElseThrow(() -> new RuntimeException("Hotel not found: " + hotelId));
        Room room = Room.builder()
            .hotel(hotel).roomType(req.getRoomType()).roomNumber(req.getRoomNumber())
            .capacity(req.getCapacity()).pricePerNight(req.getPricePerNight())
            .status(RoomStatus.VACANT).availableFrom(req.getAvailableFrom())
            .availableTo(req.getAvailableTo()).build();
        return toRoomResponse(roomRepository.save(room), false);
    }

    public PageResponse<HotelResponse> getAllHotels(int page, int size) {
        Page<Hotel> p = hotelRepository.findAll(PageRequest.of(page, size));
        return PageResponse.<HotelResponse>builder()
            .data(p.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
            .page(p.getNumber()).size(p.getSize())
            .totalElements(p.getTotalElements()).totalPages(p.getTotalPages()).build();
    }

    public List<HotelResponse> getAllHotelsFlatList() {
        return hotelRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public long countRooms(Long hotelId) {
        return roomRepository.countByHotelId(hotelId);
    }

    public long countVacantRooms(Long hotelId) {
        return roomRepository.countByHotelIdAndStatus(hotelId, RoomStatus.VACANT);
    }

    public HotelResponse toResponse(Hotel h) {
        return HotelResponse.builder()
            .id(h.getId()).name(h.getName()).destination(h.getDestination())
            .address(h.getAddress()).latitude(h.getLatitude()).longitude(h.getLongitude())
            .starRating(h.getStarRating()).amenities(h.getAmenities())
            .description(h.getDescription()).imageUrl(h.getImageUrl())
            .adminEmail(h.getAdminEmail()).createdAt(h.getCreatedAt()).build();
    }

    public RoomResponse toRoomResponse(Room r, boolean applyDiscount) {
        BigDecimal price = r.getPricePerNight();
        BigDecimal discounted = applyDiscount ? price.multiply(new BigDecimal("0.85")) : price;
        return RoomResponse.builder()
            .id(r.getId()).hotelId(r.getHotel().getId()).roomType(r.getRoomType())
            .roomNumber(r.getRoomNumber()).capacity(r.getCapacity())
            .pricePerNight(price).discountedPrice(discounted)
            .status(r.getStatus()).availableFrom(r.getAvailableFrom())
            .availableTo(r.getAvailableTo()).build();
    }
}
