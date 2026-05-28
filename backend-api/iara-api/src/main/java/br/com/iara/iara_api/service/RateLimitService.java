package br.com.iara.iara_api.service;

import br.com.iara.iara_api.exception.TooManyRequestsException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RateLimitService {

    private static final int MAX_ATTEMPTS = 10;
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final String KEY_PREFIX = "auth:rate:";

    private final StringRedisTemplate redis;

    public void checkAndIncrement(String ip) {
        String key = KEY_PREFIX + ip;
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1) {
            redis.expire(key, WINDOW);
        }
        if (count != null && count > MAX_ATTEMPTS) {
            throw new TooManyRequestsException();
        }
    }

    public void reset(String ip) {
        redis.delete(KEY_PREFIX + ip);
    }
}