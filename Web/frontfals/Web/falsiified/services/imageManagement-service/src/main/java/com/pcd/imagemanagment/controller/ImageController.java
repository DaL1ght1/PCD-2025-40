package com.pcd.imagemanagment.controller;

import com.pcd.imagemanagment.model.Image;
import com.pcd.imagemanagment.model.ImageAnnotation;
import com.pcd.imagemanagment.model.ImageAnnotationRequest;
import com.pcd.imagemanagment.repository.mongo.ImageAnnotationRepository;
import com.pcd.imagemanagment.repository.mongo.ImageRepository;
import com.pcd.imagemanagment.response.ImageDetails;
import com.pcd.imagemanagment.response.ImageUploadResponse;
import com.pcd.imagemanagment.service.ImageStorageService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;


import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageStorageService imageStorageService;
    private final ImageRepository imageRepository;
    private static final Logger log = LoggerFactory.getLogger(ImageController.class);
    private final ImageAnnotationRepository imageAnnotationRepository;
    private final GridFsTemplate gridFsTemplate;

    // --- Get Client IP (Helper) ---
    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = "";
        if (request != null) {
            remoteAddr = request.getHeader("X-FORWARDED-FOR");
            if (remoteAddr == null || remoteAddr.isEmpty()) {
                remoteAddr = request.getRemoteAddr();
            }
        }
        return remoteAddr;
    }

    @PostMapping(value ="/upload",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("caseId") String caseId,
            @RequestParam(value = "userId", defaultValue = "SYSTEM_UPLOAD") String userId,
            @RequestParam(value = "userRole", defaultValue = "UPLOADER") String userRole,
            HttpServletRequest request) {

        log.info("Received upload request from userId: {}, role: {}, IP: {}",
                userId, userRole, getClientIp(request));

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File cannot be empty");
        }

        try {
            String imageId = imageStorageService.storeImage(
                    file,
                    caseId,
                    userId,
                    userRole,
                    getClientIp(request)
            );
            log.info("API: Image uploaded successfully with ID: {}", imageId);

            // Create response object with the fields needed by the frontend
            ImageUploadResponse response = new ImageUploadResponse();
            response.setId(imageId);
            response.setOriginalFilename(file.getOriginalFilename());
            response.setContentType(file.getContentType());
            response.setSize(file.getSize());
            response.setUploadTimestamp(LocalDateTime.now().toString());
            response.setCaseId(caseId);


            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("API: Image upload failed for file: {}", file.getOriginalFilename(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Image upload failed", e);
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> downloadImage(
            @PathVariable String id,
            @RequestParam(value = "userId", defaultValue = "SYSTEM_DOWNLOAD") String userId,
            @RequestParam(value = "userRole", defaultValue = "VIEWER") String userRole,
            @RequestParam(value = "reason", defaultValue = "Viewing") String reason,
            HttpServletRequest request) {

        log.info("Received download request from userId: {}, role: {}, IP: {}",
                userId, userRole, getClientIp(request));

        try {
            var downloadDataOpt = imageStorageService.retrieveImage(
                    id,
                    userId,
                    userRole,
                    reason,
                    getClientIp(request)
            );

            if (downloadDataOpt.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found with ID: " + id);
            }

            var downloadData = downloadDataOpt.get();

            HttpHeaders headers = new HttpHeaders();
            // Ensure content type is properly set based on actual file type
            String contentType = downloadData.contentType;
            if (contentType == null || contentType.isEmpty()) {
                contentType = MediaType.IMAGE_JPEG_VALUE; // Default to JPEG if no content type available
            }
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(downloadData.length);

            // Better filename handling
            String filename = downloadData.filename;
            if (filename == null || filename.isEmpty()) {
                filename = "image-" + id + ".jpg";
            }
            headers.setContentDispositionFormData("attachment", filename);

            // Add cache control headers to prevent caching issues
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);

            log.info("API: Image ID: {} downloaded by User ID: {}, Content-Type: {}",
                    id, userId, contentType);

            return new ResponseEntity<>(new InputStreamResource(downloadData.inputStream), headers, HttpStatus.OK);

        } catch (IllegalStateException e) {
            log.error("API: Critical error downloading image ID: {}. {}", id, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve image file data", e);
        } catch (Exception e) {
            log.error("API: Error downloading image ID: {}: {}", id, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to download image", e);
        }
    }

    // --- Get Metadata Endpoint ---
    @GetMapping("/{id}")
    public ResponseEntity<Image> getImageMetadata(@PathVariable String id) {
        return imageRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image metadata not found for ID: " + id));
    }

    // --- List Images by Case ID (Example Query) ---
    @GetMapping("/case/{caseId}")
    public ResponseEntity<List<Image>> getImagesByCase(@PathVariable String caseId) {
        List<Image> images = imageRepository.findByCaseId(caseId);
        return ResponseEntity.ok(images);
    }

    // --- Delete Endpoint ---
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable String id,
            // These would typically come from SecurityContext / Authentication Principal
            @RequestParam(value = "userId", defaultValue = "SYSTEM_DELETE") String userId,
            @RequestParam(value = "userRole", defaultValue = "ADMIN") String userRole,
            @RequestParam(value = "reason") String reason, // Make reason mandatory
            HttpServletRequest request) {
        try {
            boolean deleted = imageStorageService.deleteImage(
                    id,
                    userId,
                    userRole,
                    reason,
                    getClientIp(request)
            );
            if (deleted) {
                log.info("API: Image ID: {} marked for deletion by User ID: {}", id, userId);
                return ResponseEntity.noContent().build(); // Standard 204 No Content for successful DELETE
            } else {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found for deletion with ID: " + id);
            }
        } catch (Exception e) {
            log.error("API: Failed to delete image ID: {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete image", e);
        }
    }



    @PutMapping("/{id}/analysis-status")
    public ResponseEntity<Void> updateAnalysisStatus(
            @PathVariable String id,
            @RequestParam("status") String status,
            // These should ideally identify the calling service or system user
            @RequestParam(value = "userId", defaultValue = "SYSTEM_UPDATE") String userId,
            @RequestParam(value = "userRole", defaultValue = "SERVICE") String userRole,
            HttpServletRequest request) {

        log.info("API: Received request to update analysis status for image ID: {} to status: {} by User ID: {}", id, status, userId);

        try {
            boolean updated = imageStorageService.updateImageAnalysisStatus(
                    id,
                    status,
                    userId,
                    userRole,
                    getClientIp(request) // Pass client IP for auditing
            );

            if (updated) {
                log.info("API: Successfully updated analysis status for image ID: {} to {}", id, status);
                return ResponseEntity.ok().build(); // 200 OK is suitable for successful update
            } else {
                // If service returns false, it means the image was not found
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found with ID: " + id);
            }
        } catch (IllegalArgumentException e) {
            log.warn("API: Invalid status update request for image ID: {}. Error: {}", id, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage()); // 400 for bad input status
        }
        catch (Exception e) {
            log.error("API: Failed to update analysis status for image ID: {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update analysis status", e);
        }
    }
    // ImageController.java (Updated)

    // Add endpoint for getting all images
    @GetMapping("/all")
    public ResponseEntity<List<Image>> getAllImages() {
        List<Image> images = imageRepository.findAll();
        return ResponseEntity.ok(images);
    }

    // Add endpoint for image analysis
    @PostMapping("/{id}/analyze")
    public ResponseEntity<Image> analyzeImage(
            @PathVariable String id,
            @RequestParam(value = "userId", defaultValue = "SYSTEM_ANALYZE") String userId,
            @RequestParam(value = "userRole", defaultValue = "ANALYST") String userRole,
            HttpServletRequest request) {
        try {
            Optional<Image> imageOpt = imageRepository.findById(id);
            if (imageOpt.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found with ID: " + id);
            }
            // Placeholder for analysis logic (e.g., call an analysis service)
            Image image = imageOpt.get();
            // Update analysis status or results
            image.setAnalysisStatus("ANALYZED");
            imageRepository.save(image);
            log.info("API: Image ID: {} analyzed by User ID: {}", id, userId);
            return ResponseEntity.ok(image);
        } catch (Exception e) {
            log.error("API: Failed to analyze image ID: {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to analyze image", e);
        }
    }

    // Add endpoint for adding annotations
    @PostMapping("/{id}/annotate")
    public ResponseEntity<ImageAnnotation> annotateImage(
            @PathVariable String id,
            @RequestBody ImageAnnotationRequest requestBody,
            @RequestParam(value = "userId", defaultValue = "SYSTEM_ANNOTATE") String userId,
            @RequestParam(value = "userRole", defaultValue = "ANNOTATOR") String userRole,
            HttpServletRequest request) {
        try {
            Optional<Image> imageOpt = imageRepository.findById(id);
            if (imageOpt.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found with ID: " + id);
            }
            // Create and save annotation (assuming ImageAnnotation is a new entity)
            ImageAnnotation annotation = new ImageAnnotation();
            annotation.setImageId(id);
            annotation.setContent(requestBody.getContent());
            annotation.setCoordinates(requestBody.getCoordinates());
            annotation.setCreatedBy(userId);
            annotation.setCreatedAt(new Date());
            annotation.setType(requestBody.getType());
            // Save to a new repository (e.g., ImageAnnotationRepository)
            ImageAnnotation savedAnnotation = imageAnnotationRepository.save(annotation);
            log.info("API: Annotation added to image ID: {} by User ID: {}", id, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedAnnotation);
        } catch (Exception e) {
            log.error("API: Failed to annotate image ID: {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to annotate image", e);
        }
    }

    // Add endpoint for getting annotations
    @GetMapping("/{id}/annotations")
    public ResponseEntity<List<ImageAnnotation>> getAnnotations(@PathVariable String id) {
        List<ImageAnnotation> annotations = imageAnnotationRepository.findByImageId(id);
        return ResponseEntity.ok(annotations);
    }

    // Add endpoint for tagging images
    @PostMapping("/{id}/tags")
    public ResponseEntity<Image> tagImage(
            @PathVariable String id,
            @RequestBody List<String> tags,
            @RequestParam(value = "userId", defaultValue = "SYSTEM_TAG") String userId,
            @RequestParam(value = "userRole", defaultValue = "TAGGER") String userRole,
            HttpServletRequest request) {
        try {
            Optional<Image> imageOpt = imageRepository.findById(id);
            if (imageOpt.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found with ID: " + id);
            }
            Image image = imageOpt.get();
            image.setTags(tags);
            imageRepository.save(image);
            log.info("API: Tags updated for image ID: {} by User ID: {}", id, userId);
            return ResponseEntity.ok(image);
        } catch (Exception e) {
            log.error("API: Failed to tag image ID: {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to tag image", e);
        }
    }

    // Add endpoint for searching images
    @GetMapping("/search")
    public ResponseEntity<List<Image>> searchImages(
            @RequestParam("query") String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        // Implement search logic (e.g., search by filename or tags)
        List<Image> images = imageRepository.findByFilenameContainingIgnoreCase(query);
        return ResponseEntity.ok(images);
    }

    // ImageController.java
    @GetMapping("/{id}/preview")
    public ResponseEntity<InputStreamResource> getImagePreview(
            @PathVariable String id,
            @RequestParam(value = "userId", defaultValue = "SYSTEM_PREVIEW") String userId,
            @RequestParam(value = "userRole", defaultValue = "VIEWER") String userRole,
            @RequestParam(value = "reason", defaultValue = "Preview") String reason,
            HttpServletRequest request) {
        try {
            Optional<ImageStorageService.ImageDownload> downloadDataOpt = imageStorageService.retrieveImage(
                    id, userId, userRole, reason, getClientIp(request));
            if (downloadDataOpt.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found with ID: " + id);
            }
            ImageStorageService.ImageDownload downloadData = downloadDataOpt.get();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(downloadData.contentType));
            headers.setContentLength(downloadData.length);

            log.info("API: Image preview ID: {} served to User ID: {}", id, userId);
            return new ResponseEntity<>(new InputStreamResource(downloadData.inputStream), headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("API: Failed to serve preview for image ID: {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serve image preview", e);
        }
    }

    @GetMapping("ids/{imageId}")
    public ResponseEntity<byte[]> getImageContent(@PathVariable String imageId) {
        log.info("API: Image ID: {}", imageId);
        Optional<Image> imageOpt = imageRepository.findById(imageId);
        if (!imageOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Image image = imageOpt.get();
        if (image.getGridFsFileId() == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
        try {
            GridFsResource resource = gridFsTemplate.getResource(String.valueOf(new ObjectId(image.getGridFsFileId())));
            byte[] imageData = resource.getInputStream().readAllBytes();
            log.info("API: Image content: {}", new String(imageData));
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(image.getContentType()))
                    .body(imageData);
        } catch (Exception e) {
            log.error("API: Failed to retrieve image content for image ID: {}", imageId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }
    @GetMapping("ids")
    public ResponseEntity<List<ImageDetails>> getImagesByIds(@RequestParam("ids") List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<Image> images = imageStorageService.getImagesByIds(ids);
        List<ImageDetails> imageDetails = images.stream()
                .map(image -> new ImageDetails(
                        image.getId(),
                        "http://localhost:8222/api/v1/images/" + image.getId() + "/download", // Construct URL
                        image.getFilename(),
                        image.getCaseId(),
                        image.getUploadDate() != null ? image.getUploadDate().toString() : null
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(imageDetails);
    }
}