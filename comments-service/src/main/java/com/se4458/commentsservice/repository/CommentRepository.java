package com.se4458.commentsservice.repository;

import com.se4458.commentsservice.document.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {
    Page<Comment> findByHotelId(String hotelId, Pageable pageable);
    List<Comment> findByHotelId(String hotelId);
}
