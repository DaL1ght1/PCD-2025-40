package com.pcd.report.controller;

import com.pcd.report.model.ReportTemplate;
import com.pcd.report.repository.ReportTemplateRepository;
import com.pcd.report.service.TemplateServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateServiceImpl templateService;
    private final ReportTemplateRepository reportTemplateRepository;
    @Value("${templates.directory:src/main/resources/templates/}")
    private String TEMPLATES_DIR;


    @GetMapping("")
    public ResponseEntity<List<ReportTemplate>> getAllTemplates() {
        return ResponseEntity.ok(templateService.getAllTemplates());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReportTemplate> getTemplateById(@PathVariable String id) {
        return ResponseEntity.ok(templateService.getTemplateById(id));
    }

    @GetMapping("/default")
    public ResponseEntity<ReportTemplate> getDefaultTemplate() {
        return ResponseEntity.ok(templateService.getDefaultTemplate());
    }

    @PostMapping
    public ResponseEntity<ReportTemplate> createTemplate(@RequestBody ReportTemplate template) {
        // Setting htmlTemplate to ensure a file is created
        if (template.getContent() != null && (template.getHtmlTemplate() == null || template.getHtmlTemplate().isEmpty())) {
            template.setHtmlTemplate(template.getContent());
        }
        return new ResponseEntity<>(templateService.createTemplate(template), HttpStatus.CREATED);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReportTemplate> uploadTemplateFile(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam(name = "isDefault", defaultValue = "false") boolean isDefault,
            @RequestParam("file") MultipartFile file) {
        try {
            // Validate the uploaded file
            if (file == null || file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(null);
            }

            // Create a new template with the file content
            ReportTemplate template = new ReportTemplate();
            template.setName(name);
            template.setDescription(description);
            template.setDefault(isDefault);

            // Store the file content directly in the MongoDB document
            String fileContent = new String(file.getBytes(), StandardCharsets.UTF_8);
            template.setHtmlTemplate(fileContent);
            template.setContent(fileContent);

            // Get the original filename
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                originalFilename = "uploaded_file.html";
            }
            template.setFilePath(originalFilename);

            // Define the local storage path
            String localStoragePath = TEMPLATES_DIR;
            File directory = new File(localStoragePath);
            if (!directory.exists() && !directory.mkdirs()) {
                throw new IOException("Failed to create directory: " + localStoragePath);
            }

            // Generate a unique filename to avoid overwriting existing files
            String uniqueFilename = UUID.randomUUID().toString() + "_temp.html";
            File localFile = new File(directory, uniqueFilename);

            // Save file to local storage with retry mechanism
            try {
                file.transferTo(localFile);
            } catch (IOException e) {
                // Log the error and retry once
                e.printStackTrace();
                try {
                    Thread.sleep(100); // Brief delay to avoid race condition
                    file.transferTo(localFile);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new IOException("Interrupted during file transfer retry", ie);
                }
            }

            // Update the template with the local file path
            template.setLocalFilePath(localFile.getAbsolutePath());

            // Handle isDefault logic
            if (isDefault) {
                Optional<ReportTemplate> currentDefault = reportTemplateRepository.findByIsDefaultTrue();
                currentDefault.ifPresent(t -> {
                    t.setDefault(false);
                    reportTemplateRepository.save(t);
                });
            }

            // Save the template to MongoDB
            ReportTemplate savedTemplate = templateService.createTemplate(template);

            return new ResponseEntity<>(savedTemplate, HttpStatus.CREATED);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReportTemplate> updateTemplate(
            @PathVariable String id,
            @RequestBody ReportTemplate template) {
        // Make sure htmlTemplate is updated to trigger file creation
        ReportTemplate existingTemplate = templateService.getTemplateById(id);
        if (template.getContent() != null && (template.getHtmlTemplate() == null || template.getHtmlTemplate().isEmpty())) {
            template.setHtmlTemplate(template.getContent());
        }
        return ResponseEntity.ok(templateService.updateTemplate(id, template));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable String id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/content")
    public ResponseEntity<String> getTemplateContent(@PathVariable String id) {
        try {
            ReportTemplate template = templateService.getTemplateById(id); // Use your existing service method
            if (template != null && template.getHtmlTemplate() != null) {
                return ResponseEntity.ok()
                        .contentType(MediaType.TEXT_HTML) // Set content type to HTML
                        .body(template.getHtmlTemplate()); // Return the HTML content
            } else {
                // Template not found or no HTML content available
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Template content not found");
            }
        } catch (Exception e) { // Catch any potential exceptions during service call (e.g., templateService might throw)
            // Log the error for debugging
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving template content", e);
        }
    }
}