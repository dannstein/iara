package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.RefreshToken;
import br.com.iara.iara_api.domain.TokenBlacklist;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.auth.TokenResponse;
import br.com.iara.iara_api.repository.RefreshTokenRepository;
import br.com.iara.iara_api.repository.TokenBlacklistRepository;
import br.com.iara.iara_api.security.JwtProperties;
import br.com.iara.iara_api.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final String JTI_KEY_PREFIX = "auth:jti:";

    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final StringRedisTemplate redis;
    private final JwtUtil jwtUtil;
    private final JwtProperties jwtProperties;

    @Transactional
    public TokenResponse issueTokenPair(Usuario usuario) {
        String accessToken = jwtUtil.generateAccessToken(
                usuario.getEmail(), usuario.getRole().getRoleNome());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setUsuario(usuario);
        refreshToken.setFamilyId(UUID.randomUUID());
        refreshToken.setExpiresAt(
                OffsetDateTime.now().plus(jwtProperties.getRefreshExpirationMs(), ChronoUnit.MILLIS));
        refreshTokenRepository.save(refreshToken);

        long accessExpiresAt = jwtUtil.extractExpiration(accessToken).toInstant().toEpochMilli();
        return TokenResponse.of(accessToken, refreshToken.getToken(), accessExpiresAt,
                usuario.getId(), usuario.getTenant().getId(),
                usuario.getEmail(), usuario.getRole().getRoleNome());
    }

    @Transactional
    public TokenResponse rotateTokens(String refreshTokenValue) {
        RefreshToken existing = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new BadCredentialsException("Refresh token inválido"));

        if (existing.isRevoked()) {
            // Token reuse detected — possible theft: revoke all sessions for this user
            refreshTokenRepository.revokeAllByUserId(existing.getUsuario().getId());
            throw new BadCredentialsException("Sessão comprometida detectada. Faça login novamente.");
        }

        if (existing.getExpiresAt().isBefore(OffsetDateTime.now())) {
            existing.setRevoked(true);
            throw new BadCredentialsException("Refresh token expirado");
        }

        existing.setRevoked(true);

        Usuario usuario = existing.getUsuario();
        String newAccessToken = jwtUtil.generateAccessToken(
                usuario.getEmail(), usuario.getRole().getRoleNome());

        RefreshToken newToken = new RefreshToken();
        newToken.setToken(UUID.randomUUID().toString());
        newToken.setUsuario(usuario);
        newToken.setFamilyId(existing.getFamilyId());
        newToken.setExpiresAt(
                OffsetDateTime.now().plus(jwtProperties.getRefreshExpirationMs(), ChronoUnit.MILLIS));
        refreshTokenRepository.save(newToken);

        long accessExpiresAt = jwtUtil.extractExpiration(newAccessToken).toInstant().toEpochMilli();
        return TokenResponse.of(newAccessToken, newToken.getToken(), accessExpiresAt,
                usuario.getId(), usuario.getTenant().getId(),
                usuario.getEmail(), usuario.getRole().getRoleNome());
    }

    @Transactional
    public void revokeRefreshToken(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue).ifPresent(rt -> rt.setRevoked(true));
    }

    public void blacklistJti(String jti, OffsetDateTime expiry, Usuario usuario) {
        long ttlSeconds = OffsetDateTime.now().until(expiry, ChronoUnit.SECONDS);
        if (ttlSeconds > 0) {
            redis.opsForValue().set(JTI_KEY_PREFIX + jti, "1", Duration.ofSeconds(ttlSeconds));
        }
        if (!tokenBlacklistRepository.existsByJti(jti)) {
            tokenBlacklistRepository.save(new TokenBlacklist(jti, usuario, expiry));
        }
    }

    public boolean isJtiBlacklisted(String jti) {
        // Primary: Redis (fast path)
        if (Boolean.TRUE.equals(redis.hasKey(JTI_KEY_PREFIX + jti))) {
            return true;
        }
        // Secondary: DB (resilience after Redis restart)
        return tokenBlacklistRepository.existsByJti(jti);
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        OffsetDateTime now = OffsetDateTime.now();
        refreshTokenRepository.deleteExpiredBefore(now);
        tokenBlacklistRepository.deleteExpired(now);
    }
}