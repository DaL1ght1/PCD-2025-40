package com.pcd.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@SpringBootApplication
@EnableDiscoveryClient
public class GatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(GatewayApplication.class, args);
	}

	@Configuration
	@EnableWebFluxSecurity
	static class SecurityConfig {

		@Bean
		public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
			http
					.csrf(ServerHttpSecurity.CsrfSpec::disable)            // no CSRF
					.cors(cors -> cors.configurationSource(corsConfigurationSource()))
					.authorizeExchange(exchanges -> exchanges
							.anyExchange().permitAll()                          // allow everything through
					);
			return http.build();
		}

		@Bean
		public CorsConfigurationSource corsConfigurationSource() {
			CorsConfiguration config = new CorsConfiguration();
			config.setAllowedOriginPatterns(List.of("*"));
			config.setAllowedMethods(List.of("*"));
			config.setAllowedHeaders(List.of("*"));
			config.setAllowCredentials(true);
			config.setMaxAge(3600L);

			UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
			source.registerCorsConfiguration("/**", config);
			return source;
		}
	}
}
