package com.pcd.imagemanagment.service;

import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.pcd.imagemanagment.model.CustodyEvent;
import com.pcd.imagemanagment.repository.mongo.ImageRepository;
import com.pcd.imagemanagment.model.Image;
import lombok.RequiredArgsConstructor;
// Corrected import
import java.security.MessageDigest;
// Added import
import java.security.NoSuchAlgorithmException;

import org.bson.types.ObjectId;
import org.slf4j.Logger; // Added for logging
import org.slf4j.LoggerFactory; // Added for logging
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional; // Added for optional handling
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageStorageService {

    // Added Logger
    private static final Logger log = LoggerFactory.getLogger(ImageStorageService.class);

    private final GridFsTemplate gridFsTemplate;
    private final GridFSBucket gridFSBucket;
    private final ImageRepository imageRepository;
    private final MetadataExtractionService metadataService; // Assumes this service exists

    public String storeImage(MultipartFile file, String caseId, String uploaderId, String uploaderRole, String ipAddress) throws IOException, NoSuchAlgorithmException {

        Image imageDoc = new Image();
        imageDoc.setFilename(file.getOriginalFilename());
        imageDoc.setContentType(file.getContentType());
        imageDoc.setFileSize(file.getSize());
        imageDoc.setCaseId(caseId);
        imageDoc.setUploadedBy(uploaderId);
        imageDoc.setUploaderRole(uploaderRole);
        imageDoc.setUploadDate(LocalDateTime.now());
        imageDoc.setAnalysisStatus("PENDING"); // Example status

        // Calculate hash first, so it's always present if possible
        try {
            // Use a separate stream for hash calculation to avoid stream consumption issues
            try (InputStream hashStream = file.getInputStream()) {
                imageDoc.setSha256Hash(calculateSHA256(hashStream));
            }
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 Algorithm not found!", e);
            // Decide how to handle this - rethrow, set hash to null, etc.
            throw e; // Rethrowing for now
        } catch (IOException e) {
            log.error("Error reading file for hashing: {}", file.getOriginalFilename(), e);
            throw e; // Rethrowing for now
        }


        // Extract dimensions and metadata
        try (InputStream metadataStream = file.getInputStream()) {
            // Extract image dimensions using ImageIO
            BufferedImage buffImg = ImageIO.read(metadataStream); // Reads the stream
            if (buffImg != null) {
                imageDoc.setWidth(buffImg.getWidth());
                imageDoc.setHeight(buffImg.getHeight());
                // Reset stream if needed by metadata extractor and if supported
                // If ImageIO.read consumes the stream fully and the metadata extractor needs it,
                // you might need to read the file bytes into memory or get a new stream.
                // For simplicity here, we assume we might need a new stream for metadata extraction.
            } else {
                log.warn("Could not read image dimensions for file: {}", file.getOriginalFilename());
            }
        } catch (IOException e) {
            log.error("Error reading image for dimensions: {}", file.getOriginalFilename(), e);
            // Decide if this is critical - perhaps continue without dimensions
        }

        // Extract metadata - needs its own stream
        try (InputStream metaStream = file.getInputStream()) {
            imageDoc.setMetadata(metadataService.extractMetadata(metaStream, file.getOriginalFilename())); // Pass stream
        } catch (Exception e) {
            // Use proper logging instead of System.err
            log.error("Error processing image metadata for file {}: {}", file.getOriginalFilename(), e.getMessage(), e);
            // Continue upload even if metadata extraction fails
        }

        // Store image in GridFS - needs its own stream
        ObjectId fileId;
        try (InputStream gridfsStream = file.getInputStream()) {
            fileId = gridFsTemplate.store(
                    gridfsStream,
                    file.getOriginalFilename(),
                    file.getContentType(),
                    // Add relevant metadata to GridFS file document if needed
                    Map.of(
                            "_contentType", file.getContentType(), // Standard field
                            "originalFilename", file.getOriginalFilename(),
                            "caseId", caseId,
                            "uploaderId", uploaderId,
                            "uploadTimestamp", Instant.now().toString()
                            // Add other fields if useful for querying GridFS directly
                    )
            );
        } catch (IOException e) {
            log.error("Error storing file in GridFS: {}", file.getOriginalFilename(), e);
            throw e; // This is likely a critical error
        }


        imageDoc.setGridFsFileId(fileId.toString());

        // Record initial custody event
        CustodyEvent uploadEvent = new CustodyEvent(
                "UPLOAD",
                uploaderId,
                uploaderRole,
                Instant.now(),
                "Initial upload via API", // More descriptive detail
                ipAddress
        );
        imageDoc.getCustodyTrail().add(uploadEvent);

        // Save metadata document to MongoDB
        Image savedImage = imageRepository.save(imageDoc);
        log.info("Successfully stored image ID: {}, GridFS ID: {}", savedImage.getId(), savedImage.getGridFsFileId());

        return savedImage.getId();
    }

    public List<Image> getImagesByIds(List<String> ids) {
        try {
            return ids.stream()
                    .map(imageRepository::findById)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // Log the error and return an empty list or throw a custom exception
            System.err.println("Error fetching images by IDs: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public static class ImageDownload {
        public final InputStream inputStream;
        public final String filename;
        public final String contentType;
        public final long length;

        public ImageDownload(InputStream inputStream, String filename, String contentType, long length) {
            this.inputStream = inputStream;
            this.filename = filename;
            this.contentType = contentType;
            this.length = length;
        }
    }


    // Changed return type for more flexibility in controller
    public Optional<ImageDownload> retrieveImage(String imageId, String userId, String userRole, String accessReason, String ipAddress) {
        // Fetch the image document
        Optional<Image> imageDocOpt = imageRepository.findById(imageId);
        if (imageDocOpt.isEmpty()) {
            log.warn("Attempted to access non-existent image ID: {}", imageId);
            return Optional.empty(); // Return empty optional
        }
        Image imageDoc = imageDocOpt.get();

        // Retrieve file from GridFS *before* logging access, in case GridFS retrieval fails
        GridFSFile file = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(new ObjectId(imageDoc.getGridFsFileId()))));
        if (file == null) {
            // Data inconsistency: Metadata exists, but file is gone from GridFS
            log.error("CRITICAL: GridFS file not found for image ID: {}, GridFS ID: {}", imageId, imageDoc.getGridFsFileId());
            // Don't log access if file isn't actually retrievable
            throw new IllegalStateException("File not found in GridFS for image ID: " + imageId + ", GridFS ID: " + imageDoc.getGridFsFileId());
        }

        // Now that we know the file exists, log the access event
        CustodyEvent accessEvent = new CustodyEvent(
                "ACCESS",
                userId,
                userRole,
                Instant.now(),
                "Access reason: " + accessReason,
                ipAddress
        );
        imageDoc.getCustodyTrail().add(accessEvent);
        imageRepository.save(imageDoc); // Save updated custody trail


        // Get the download stream
        GridFsResource resource = gridFsTemplate.getResource(file); // Simpler way to get resource
        try {
            InputStream stream = resource.getInputStream();
            log.info("Retrieved image ID: {} by User ID: {}", imageId, userId);
            return Optional.of(new ImageDownload(
                    stream,
                    file.getFilename(),
                    Optional.ofNullable(file.getMetadata())
                            .map(doc -> doc.getString("_contentType"))
                            .orElse("application/octet-stream"), // Default content type
                    file.getLength()
            ));
        } catch (IOException e) {
            log.error("Error opening download stream for GridFS file: {}", file.getObjectId(), e);
            // This is unexpected if getResource succeeded
            throw new IllegalStateException("Could not open download stream for file ID: " + file.getObjectId(), e);
        }
    }


    public boolean deleteImage(String imageId, String userId, String userRole, String reason, String ipAddress) {
        // Fetch the image document first to get the GridFS file ID
        Optional<Image> imageDocOpt = imageRepository.findById(imageId);
        if (imageDocOpt.isEmpty()) {
            log.warn("Attempted to delete non-existent image ID: {}", imageId);
            return false; // Indicate image was not found
        }
        Image imageDoc = imageDocOpt.get();
        String gridFsId = imageDoc.getGridFsFileId(); // Get ID before potential deletion

        // Delete file from GridFS
        try {
            gridFsTemplate.delete(new Query(Criteria.where("_id").is(new ObjectId(gridFsId))));
            log.info("Deleted GridFS file ID: {} for Image ID: {}", gridFsId, imageId);
        } catch (Exception e) {
            // Log the error but proceed to update metadata if GridFS deletion fails
            log.error("Failed to delete GridFS file ID: {} for Image ID: {}. Error: {}", gridFsId, imageId, e.getMessage(), e);
            // Depending on policy, you might stop here or just log the failure and continue.
        }

        // Record deletion in custody trail
        CustodyEvent deleteEvent = new CustodyEvent(
                "DELETE",
                userId,
                userRole,
                Instant.now(),
                "Deletion reason: " + reason,
                ipAddress
        );
        imageDoc.getCustodyTrail().add(deleteEvent);
        imageDoc.setAnalysisStatus("DELETED"); // Mark status as deleted

        // Save the updated metadata record (doesn't actually delete the record)
        imageRepository.save(imageDoc);
        log.info("Marked image metadata record ID: {} as DELETED by User ID: {}", imageId, userId);


         imageRepository.delete(imageDoc);
         log.info("Deleted image metadata record ID: {}", imageId);

        return true;
    }

    // Pass InputStream directly
    private String calculateSHA256(InputStream is) throws IOException, NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[8192]; // Use a larger buffer
        int bytesRead;
        while ((bytesRead = is.read(buffer)) != -1) { // Check for -1
            md.update(buffer, 0, bytesRead);
        }
        byte[] digest = md.digest();
        return bytesToHex(digest);
    }

    // Keep this helper method as is
    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2); // Preallocate size
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }


    public boolean updateImageAnalysisStatus(String imageId, String status, String userId, String userRole, String ipAddress) {
        // Fetch the image document
        Optional<Image> imageDocOpt = imageRepository.findById(imageId);
        if (imageDocOpt.isEmpty()) {
            log.warn("Attempted to update status for non-existent image ID: {}", imageId);
            return false; // Image not found
        }
        Image imageDoc = imageDocOpt.get();
        String oldStatus = imageDoc.getAnalysisStatus();
        imageDoc.setAnalysisStatus(status);

        // Record the status change in the custody trail
        CustodyEvent statusUpdateEvent = new CustodyEvent(
                "STATUS_UPDATE",
                userId,
                userRole,
                Instant.now(),
                "Analysis status changed from [" + oldStatus + "] to [" + status + "]",
                ipAddress
        );
        imageDoc.getCustodyTrail().add(statusUpdateEvent);

        // Save the updated image document
        imageRepository.save(imageDoc);
        log.info("Updated analysis status for image ID: {} from [{}] to [{}]. Initiated by User ID: {}",
                imageId, oldStatus, status, userId);

        return true; // Update successful
    }
}