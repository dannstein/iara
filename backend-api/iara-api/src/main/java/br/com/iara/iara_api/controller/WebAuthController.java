package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.auth.LoginRequest;
import br.com.iara.iara_api.dto.auth.TokenResponse;
import br.com.iara.iara_api.dto.auth.WebRegisterRequest;
import br.com.iara.iara_api.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/web")
@RequiredArgsConstructor
public class WebAuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req,
                                               HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.loginWeb(req, resolveClientIp(httpRequest)));
    }

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody WebRegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerWeb(req));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}