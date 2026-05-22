package com.se4458.commentsservice.service;

import com.se4458.commentsservice.document.Comment;
import com.se4458.commentsservice.dto.*;
import com.se4458.commentsservice.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;

    public CommentResponse createComment(CreateCommentRequest req, String userId) {
        Comment comment = Comment.builder()
            .hotelId(req.getHotelId()).userId(userId).userName(req.getUserName())
            .overallRating(req.getOverallRating()).categoryRatings(req.getCategoryRatings())
            .comment(req.getComment()).stayDuration(req.getStayDuration())
            .createdAt(LocalDateTime.now()).build();
        return toResponse(commentRepository.save(comment));
    }

    public PageResponse<CommentResponse> getCommentsByHotel(String hotelId, int page, int size) {
        Page<Comment> p = commentRepository.findByHotelId(hotelId,
            PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return PageResponse.<CommentResponse>builder()
            .data(p.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
            .page(p.getNumber()).size(p.getSize())
            .totalElements(p.getTotalElements()).totalPages(p.getTotalPages()).build();
    }

    public CommentStatsResponse getStats(String hotelId) {
        List<Comment> comments = commentRepository.findByHotelId(hotelId);
        if (comments.isEmpty()) {
            return CommentStatsResponse.builder()
                .hotelId(hotelId).commentCount(0).overallAverage(0.0)
                .categoryAverages(Map.of()).build();
        }

        double overallAvg = comments.stream().mapToDouble(Comment::getOverallRating).average().orElse(0.0);
        Map<String, Double> catAvg = new HashMap<>();

        Set<String> keys = new HashSet<>();
        comments.forEach(c -> { if (c.getCategoryRatings() != null) keys.addAll(c.getCategoryRatings().keySet()); });

        keys.forEach(k -> {
            double avg = comments.stream()
                .filter(c -> c.getCategoryRatings() != null && c.getCategoryRatings().containsKey(k))
                .mapToDouble(c -> c.getCategoryRatings().get(k))
                .average().orElse(0.0);
            catAvg.put(k, Math.round(avg * 10.0) / 10.0);
        });

        return CommentStatsResponse.builder()
            .hotelId(hotelId).commentCount(comments.size())
            .overallAverage(Math.round(overallAvg * 10.0) / 10.0)
            .categoryAverages(catAvg).build();
    }

    private CommentResponse toResponse(Comment c) {
        return CommentResponse.builder()
            .id(c.getId()).hotelId(c.getHotelId()).userId(c.getUserId())
            .userName(c.getUserName()).overallRating(c.getOverallRating())
            .categoryRatings(c.getCategoryRatings()).comment(c.getComment())
            .stayDuration(c.getStayDuration()).createdAt(c.getCreatedAt()).build();
    }
}
