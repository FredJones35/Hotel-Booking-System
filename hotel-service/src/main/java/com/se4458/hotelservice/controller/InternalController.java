package com.se4458.hotelservice.controller;

import com.se4458.hotelservice.dto.response.HotelResponse;
import com.se4458.hotelservice.service.HotelService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/internal")
@RequiredArgsConstructor
public class InternalController {

    private final HotelService hotelService;

    @GetMapping("/hotels")
    public List<HotelResponse> getAllHotels() {
        return hotelService.getAllHotelsFlatList();
    }

    @GetMapping("/hotels/{hotelId}/capacity")
    public Map<String, Long> getCapacity(@PathVariable Long hotelId) {
        long total = hotelService.countRooms(hotelId);
        long vacant = hotelService.countVacantRooms(hotelId);
        return Map.of("total", total, "vacant", vacant, "occupied", total - vacant);
    }
}
