package com.pcd.gateway.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/gateway")
public class GatewayDebugController {

    @Autowired
    private RouteLocator routeLocator;

    @GetMapping("/routes")
    public Flux<Map<String, Object>> getRoutes() {
        return routeLocator.getRoutes()
                .map(route -> {
                    Map<String, Object> routeInfo = new HashMap<>();
                    routeInfo.put("id", route.getId());
                    routeInfo.put("predicates", route.getPredicate().toString());
                    routeInfo.put("filters", route.getFilters().toString());
                    routeInfo.put("uri", route.getUri().toString());
                    routeInfo.put("order", route.getOrder());
                    return routeInfo;
                });
    }
}