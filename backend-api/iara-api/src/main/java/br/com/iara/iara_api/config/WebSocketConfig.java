package br.com.iara.iara_api.config;

import br.com.iara.iara_api.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.messaging.simp.config.ChannelRegistration;

import java.util.List;

/**
 * STOMP sobre WebSocket (Fase 3B). Endpoint: /ws.
 *
 * Tópicos:
 *  /topic/tenant/{tenantId}/alertas       — broadcast tenant-wide
 *  /user/queue/alertas                    — direct user
 *
 * O cliente envia o JWT no header `Authorization: Bearer ...` do frame CONNECT.
 * O {@code AuthChannelInterceptor} valida e popula o Principal da sessão.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Simple in-memory broker — para Phase 3 é suficiente. Em produção,
        // trocar por relay para RabbitMQ STOMP plugin sem alteração de cliente.
        registry.enableSimpleBroker("/topic", "/queue", "/user");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new AuthChannelInterceptor(jwtUtil));
    }

    /**
     * Lê o token JWT do frame CONNECT, valida, e injeta um Principal na sessão.
     * Sem isso, mensagens user-destination (/user/queue/...) não roteiam.
     */
    @RequiredArgsConstructor
    @Slf4j
    static class AuthChannelInterceptor implements ChannelInterceptor {
        private final JwtUtil jwtUtil;

        @Override
        public Message<?> preSend(Message<?> message, MessageChannel channel) {
            StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
            if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
                return message;
            }
            List<String> authHeader = accessor.getNativeHeader("Authorization");
            if (authHeader == null || authHeader.isEmpty()) {
                log.debug("[WS] CONNECT sem Authorization — rejeitando");
                return null;
            }
            String token = authHeader.get(0);
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            try {
                String email = jwtUtil.extractEmail(token);
                String role = jwtUtil.extractRole(token);
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        email, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                accessor.setUser(auth);
                log.debug("[WS] CONNECT autenticado: {} ({})", email, role);
            } catch (Exception e) {
                log.warn("[WS] CONNECT com token inválido: {}", e.getMessage());
                return null;
            }
            return message;
        }
    }
}
