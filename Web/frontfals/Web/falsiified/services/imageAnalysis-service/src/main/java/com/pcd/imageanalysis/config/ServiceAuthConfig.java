package com.pcd.imageanalysis.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestTemplate;

@Configuration
public class ServiceAuthConfig {

    @Value("${service.auth.token:}")
    private String serviceAuthToken;

    @Bean
    public RestTemplate authenticatedRestTemplate() {
        RestTemplate restTemplate = new RestTemplate();

        // Add an interceptor to add the Authorization header to all requests
        restTemplate.getInterceptors().add((request, body, execution) -> {
            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION) && !serviceAuthToken.isEmpty()) {
                request.getHeaders().add(HttpHeaders.AUTHORIZATION, "Bearer " + serviceAuthToken);
            }
            return execution.execute(request, body);
        });

        return restTemplate;
    }
}
