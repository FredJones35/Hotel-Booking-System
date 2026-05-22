package com.se4458.hotelservice.repository;

import com.se4458.hotelservice.model.Hotel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HotelRepository extends JpaRepository<Hotel, Long> {

    @Query("SELECT h FROM Hotel h WHERE LOWER(h.destination) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(h.address) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Hotel> searchByDestination(@Param("q") String query, Pageable pageable);
}
