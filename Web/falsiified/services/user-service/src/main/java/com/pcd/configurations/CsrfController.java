package com.pcd.configurations;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class CsrfController {

    @GetMapping("/csrf")
    public ResponseEntity<?> getCsrfToken(HttpServletRequest request) {
        CsrfToken csrf = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrf != null) {
            return ResponseEntity.ok().body(Map.of(
                    "token", csrf.getToken(),
                    "headerName", csrf.getHeaderName()
            ));
        } else {
            // Handle the case when CSRF token is null
            return ResponseEntity.ok().body(Map.of(
                    "message", "CSRF protection not enabled or token not available"
            ));
        }
    }
}