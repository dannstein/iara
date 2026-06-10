package br.com.iara.iara_api.dto.auth;

import java.util.UUID;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long accessExpiresAt,
        UUID userId,
        UUID tenantId,
        String email,
        String role
) {
    public static TokenResponse of(String accessToken, String refreshToken,
                                   long accessExpiresAt, UUID userId, UUID tenantId,
                                   String email, String role) {
        return new TokenResponse(accessToken, refreshToken, "Bearer", accessExpiresAt,
                userId, tenantId, email, role);
    }
}