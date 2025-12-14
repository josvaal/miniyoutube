package com.josval.miniyoutube.common;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Service;

@Service
public class RateLimiterService {

  private static class Counter {
    AtomicInteger count = new AtomicInteger(0);
    long windowResetAt;
  }

  private final Map<String, Counter> counters = new ConcurrentHashMap<>();

  public void checkRate(String key, int limit, long windowMs) {
    long now = Instant.now().toEpochMilli();
    Counter counter = counters.computeIfAbsent(key, k -> {
      Counter c = new Counter();
      c.windowResetAt = now + windowMs;
      return c;
    });

    synchronized (counter) {
      if (now > counter.windowResetAt) {
        counter.count.set(0);
        counter.windowResetAt = now + windowMs;
      }

      int current = counter.count.incrementAndGet();
      if (current > limit) {
        throw new RateLimitExceededException("Demasiadas peticiones, intenta más tarde");
      }
    }
  }
}
