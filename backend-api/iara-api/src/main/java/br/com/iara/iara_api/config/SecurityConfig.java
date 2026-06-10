package br.com.iara.iara_api.config;

import br.com.iara.iara_api.security.AuthEntryPoint;
import br.com.iara.iara_api.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Role;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AuthEntryPoint authEntryPoint;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint(authEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        // /especialidades liberado sem autenticacao: o fluxo de cadastro de
                        // voluntario (signup-voluntario.tsx) precisa listar especialidades antes
                        // de o usuario possuir um token JWT. Endpoint somente leitura (GET).
                        .requestMatchers(
                                "/auth/mobile/login",
                                "/auth/mobile/register",
                                "/auth/web/login",
                                "/auth/web/register",
                                "/auth/refresh",
                                "/auth/logout",
                                "/health",
                                "/usuarios/cadastro/**",
                                "/ws/**"
                        ).permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET,
                                "/especialidades",
                                "/especialidades/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Hierarquia de perfis (ENDPOINTS.md): ADMIN > GESTOR > MONITOR > COORDENADOR > TECNICO/DOADOR.
     * Permite que @PreAuthorize use o perfil mínimo exigido — perfis superiores herdam o acesso.
     */
    @Bean
    static RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.withDefaultRolePrefix()
                .role("ADMIN").implies("GESTOR")
                .role("GESTOR").implies("MONITOR")
                .role("MONITOR").implies("COORDENADOR")
                .role("COORDENADOR").implies("TECNICO", "DOADOR")
                .build();
    }

    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    static MethodSecurityExpressionHandler methodSecurityExpressionHandler(RoleHierarchy roleHierarchy) {
        DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
        handler.setRoleHierarchy(roleHierarchy);
        return handler;
    }
}