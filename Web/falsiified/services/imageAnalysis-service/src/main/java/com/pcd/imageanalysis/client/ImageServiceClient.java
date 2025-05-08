package com.pcd.imageanalysis.client;

import com.pcd.imageanalysis.model.Image;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

@Component
public class ImageServiceClient {
    private static final Logger log = LoggerFactory.getLogger(ImageServiceClient.class);

    private final RestTemplate restTemplate;
    private final String imageServiceBaseUrl;

    @Autowired
    public ImageServiceClient(RestTemplate restTemplate,
                              @Value("${services.image-management.url:http://imagemanagement-service}") String imageServiceBaseUrl) {
        this.restTemplate = restTemplate;
        this.imageServiceBaseUrl = imageServiceBaseUrl;
        log.info("ImageServiceClient initialized. Image Management URL: {}", this.imageServiceBaseUrl);
    }

    public Optional<Image> getImageMetadata(String imageId) {
        String url = imageServiceBaseUrl + "/api/v1/images/{id}";
        log.debug("Fetching metadata from URL: {} for ID: {}", url, imageId);
        try {
            ResponseEntity<Image> response = restTemplate.getForEntity(
                    url,
                    Image.class,
                    imageId
            );
            return Optional.ofNullable(response.getBody());
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("Image with ID {} not found at {}", imageId, url);
            return Optional.empty();
        } catch (Exception e) {
            log.error("Generic error retrieving image metadata for ID: {} from URL: {}. Exception Type: {}, Message: {}",
                    imageId, url, e.getClass().getName(), e.getMessage());
            log.debug("Stack trace for generic error:", e);
            if (e instanceof HttpClientErrorException) {
                HttpClientErrorException hce = (HttpClientErrorException) e;
                log.error("HTTP Error Body: {}", hce.getResponseBodyAsString());
            }
            return Optional.empty();
        }
    }

    public Optional<InputStream> downloadImage(String imageId, String userId, String userRole, String reason) {
        String url = imageServiceBaseUrl + "/api/v1/images/{id}/download?userId={userId}&userRole={userRole}&reason={reason}";
        log.warn("Calling deprecated downloadImage method for image ID: {}. Consider using downloadImageToFile.", imageId);
        try {
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<InputStreamResource> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    InputStreamResource.class,
                    imageId, userId, userRole, reason
            );

            if (response.getBody() != null) {
                return Optional.of(response.getBody().getInputStream());
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error downloading image with ID: {}", imageId, e);
            return Optional.empty();
        }
    }


    public boolean downloadImageToFile(String imageId, String userId, String userRole, String reason, Path targetPath) {
        URI uri = UriComponentsBuilder.fromHttpUrl(imageServiceBaseUrl)
                .path("/api/v1/images/{id}/download")
                .queryParam("userId", userId)
                .queryParam("userRole", userRole)
                .queryParam("reason", reason)
                .buildAndExpand(imageId)
                .toUri();

        log.debug("Streaming image download from URL: {} for ID: {} to Path: {}", uri, imageId, targetPath);

        try {
            Boolean success = restTemplate.execute(uri, HttpMethod.GET, null, clientHttpResponse -> {
                if (!clientHttpResponse.getStatusCode().is2xxSuccessful()) {
                    log.error("Image download failed with status: {} - {}", clientHttpResponse.getStatusCode(), clientHttpResponse.getStatusText());
                    return false;
                }
                try (OutputStream fileOutputStream = Files.newOutputStream(targetPath)) {
                    StreamUtils.copy(clientHttpResponse.getBody(), fileOutputStream);
                    log.info("Successfully downloaded image ID: {} to {}", imageId, targetPath);
                    return true;
                } catch (IOException e) {
                    log.error("Failed to write downloaded image ID: {} to file: {}", imageId, targetPath, e);
                    return false;
                }
            });
            return Boolean.TRUE.equals(success);
        } catch (HttpClientErrorException e) {
            log.error("HTTP error during image download request for ID: {} from URL: {}. Status: {}, Body: {}", imageId, uri, e.getStatusCode(), e.getResponseBodyAsString(), e);
            return false;
        } catch (Exception e) {
            log.error("Generic error during image download request for ID: {} from URL: {}", imageId, uri, e);
            return false;
        }
    }

    public boolean updateImageAnalysisStatus(String imageId, String status, String userId, String userRole) {
        String url = imageServiceBaseUrl + "/api/v1/images/{id}/analysis-status?status={status}&userId={userId}&userRole={userRole}";
        log.debug("Updating status via URL: {} for ID: {} to Status: {}", url, imageId, status);
        try {
            HttpHeaders headers = new HttpHeaders();
            ResponseEntity<Void> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    new HttpEntity<>(headers),
                    Void.class,
                    imageId, status, userId, userRole
            );
            boolean success = response.getStatusCode().is2xxSuccessful();
            log.info("Update analysis status for image ID: {} to {} successful: {}", imageId, status, success);
            return success;
        } catch (HttpClientErrorException e) {
            log.error("HTTP error updating analysis status for image ID: {} to {} via URL: {}. Status: {}, Body: {}", imageId, status, url, e.getStatusCode(), e.getResponseBodyAsString(), e);
            return false;
        } catch (Exception e) {
            log.error("Generic error updating analysis status for image ID: {} to {} via URL: {}", imageId, status, url, e);
            return false;
        }
    }
}