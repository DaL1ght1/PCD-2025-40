package com.pcd.imagemanagment.service;


import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory;
import com.pcd.imagemanagment.model.GeoLocation;
import com.pcd.imagemanagment.model.ImageMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

// Remove if not using MultipartFile directly
// import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.InputStream;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;

@Service
public class MetadataExtractionService {

    private static final Logger log = LoggerFactory.getLogger(MetadataExtractionService.class);

    // Method now accepts InputStream
    public ImageMetadata extractMetadata(InputStream inputStream, String filename) {
        ImageMetadata customMetadata = new ImageMetadata();
        Map<String, String> additional = new HashMap<>();
        customMetadata.setAdditionalMetadata(additional); // Initialize map

        // Ensure the input stream supports mark/reset if needed multiple times,
        // or wrap it in a stream that does, like BufferedInputStream.
        // Note: ImageMetadataReader might consume the stream.
        if (!inputStream.markSupported()) {
            inputStream = new BufferedInputStream(inputStream);
        }

        try {
            Metadata metadata = ImageMetadataReader.readMetadata(inputStream);

            // Example: Extracting Capture Date from EXIF
            ExifSubIFDDirectory exifDir = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            if (exifDir != null) {
                Date captureDate = exifDir.getDate(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL, TimeZone.getDefault()); // Be mindful of TimeZone
                if (captureDate != null) {
                    // Convert Date to Instant (preferred)
                    customMetadata.setCaptureDate(captureDate.toInstant());
                } else {
                    // Fallback or alternative tags if needed
                }
                customMetadata.setDeviceMake(exifDir.getString(ExifSubIFDDirectory.TAG_MAKE));
                customMetadata.setDeviceModel(exifDir.getString(ExifSubIFDDirectory.TAG_MODEL));
                customMetadata.setSoftware(exifDir.getString(ExifSubIFDDirectory.TAG_SOFTWARE));
                // Extract other relevant EXIF tags (ISO, Aperture, Flash, etc.)
                try { customMetadata.setExposureTime(exifDir.getFloatObject(ExifSubIFDDirectory.TAG_EXPOSURE_TIME)); } catch (Exception e) { /* ignore or log */ }
                try { customMetadata.setAperture(exifDir.getFloatObject(ExifSubIFDDirectory.TAG_FNUMBER)); } catch (Exception e) { /* ignore or log */ }
                try { customMetadata.setIso(exifDir.getInteger(ExifSubIFDDirectory.TAG_ISO_EQUIVALENT)); } catch (Exception e) { /* ignore or log */ }
                // Flash needs interpretation based on value
                Integer flashValue = exifDir.getInteger(ExifSubIFDDirectory.TAG_FLASH);
                if (flashValue != null) {
                    customMetadata.setFlash((flashValue & 1) != 0); // Simple check if flash fired
                }
            }

            // Example: Extracting GPS Location
            GpsDirectory gpsDir = metadata.getFirstDirectoryOfType(GpsDirectory.class);
            if (gpsDir != null && gpsDir.getGeoLocation() != null) {
                com.drew.lang.GeoLocation drewGeo = gpsDir.getGeoLocation();
                GeoLocation loc = new GeoLocation();
                loc.setLatitude(drewGeo.getLatitude());
                loc.setLongitude(drewGeo.getLongitude());
                // Altitude might be in a different tag/directory
                customMetadata.setLocation(loc);
            }


            // Optionally: Dump all tags into the additionalMetadata map
            /*
            for (Directory directory : metadata.getDirectories()) {
                for (Tag tag : directory.getTags()) {
                    additional.put(directory.getName() + " - " + tag.getTagName(), tag.getDescription());
                }
            }
            */

        } catch (Exception e) {
            log.warn("Could not extract metadata from file {}: {}", filename, e.getMessage());
            // Don't re-throw, allow upload to continue without metadata
        }

        return customMetadata;
    }
}