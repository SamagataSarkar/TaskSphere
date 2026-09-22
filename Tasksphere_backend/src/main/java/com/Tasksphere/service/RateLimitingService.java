package com.Tasksphere.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String identifier) {
        return cache.computeIfAbsent(identifier, this::newBucket);
    }

    private Bucket newBucket(String identifier) {
        // Modern Bucket4j 8.x+ Builder Syntax
        Bandwidth limit = Bandwidth.builder()
                .capacity(20)
                .refillIntervally(20, Duration.ofMinutes(15))
                .build();

        return Bucket.builder().addLimit(limit).build();
    }
}