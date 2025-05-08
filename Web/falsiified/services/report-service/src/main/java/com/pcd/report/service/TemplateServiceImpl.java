package com.pcd.report.service;

import com.pcd.report.exception.TemplateNotFoundException;
import com.pcd.report.model.ReportTemplate;
import com.pcd.report.repository.ReportTemplateRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class TemplateServiceImpl {

    private final ReportTemplateRepository templateRepository;
    private final ResourceLoader resourceLoader;
    private final TemplateEngine templateEngine;
    private static final String DEFAULT_TEMPLATE_PATH = "templates/default-template.html";
    @Value("${templates.directory:src/main/resources/templates/}")
    private String TEMPLATES_DIR;

    @Autowired
    public TemplateServiceImpl(
            ReportTemplateRepository templateRepository,
            @Qualifier("webApplicationContext") ResourceLoader resourceLoader,
            @Qualifier("customTemplateEngine") TemplateEngine templateEngine) {
        this.templateRepository = templateRepository;
        this.resourceLoader = resourceLoader;
        this.templateEngine = templateEngine;
    }

    public List<ReportTemplate> getAllTemplates() {
        return templateRepository.findAll();
    }

    public ReportTemplate getTemplateById(String id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new TemplateNotFoundException("Template not found with ID: " + id));
    }

    public ReportTemplate getDefaultTemplate() {
        Optional<ReportTemplate> defaultTemplate = templateRepository.findByIsDefaultTrue();

        if (defaultTemplate.isPresent()) {
            return defaultTemplate.get();
        }

        // If no default template exists in the database, create one from the built-in default template
        try {
            return createDefaultTemplateIfNotExists();
        } catch (Exception e) {
            log.error("Failed to create default template", e);
            return null;
        }
    }

    private ReportTemplate createDefaultTemplateIfNotExists() {
        // Check if default template already exists
        Optional<ReportTemplate> existingDefault = templateRepository.findByIsDefaultTrue();
        if (existingDefault.isPresent()) {
            return existingDefault.get();
        }

        try {
            // Create templates directory if it doesn't exist
            Path templatesDir = Paths.get(TEMPLATES_DIR);
            if (!Files.exists(templatesDir)) {
                Files.createDirectories(templatesDir);
            }

            // Create default template file if it doesn't exist
            Path defaultTemplatePath = Paths.get(TEMPLATES_DIR + "default-template.html");
            String defaultTemplateContent;

            if (!Files.exists(defaultTemplatePath)) {
                // Try to load the built-in default template
                try {
                    ClassPathResource resource = new ClassPathResource(DEFAULT_TEMPLATE_PATH);
                    defaultTemplateContent = new String(Files.readAllBytes(
                            Paths.get(resource.getURI())), StandardCharsets.UTF_8);
                } catch (IOException e) {
                    // If built-in template can't be found, use a simple fallback template
                    defaultTemplateContent = getBasicDefaultTemplate();
                }

                // Write the template content to file
                Files.write(defaultTemplatePath, defaultTemplateContent.getBytes(StandardCharsets.UTF_8));
            } else {
                // Read existing template file
                defaultTemplateContent = new String(Files.readAllBytes(defaultTemplatePath), StandardCharsets.UTF_8);
            }

            // Create and save the default template in the database
            ReportTemplate defaultTemplate = new ReportTemplate();
            defaultTemplate.setName("Default Template");
            defaultTemplate.setDescription("System default template for reports");
            defaultTemplate.setDefault(true);
            defaultTemplate.setHtmlTemplate(defaultTemplateContent);
            defaultTemplate.setContent(defaultTemplateContent);
            defaultTemplate.setFilePath("default-template.html");
            defaultTemplate.setCreatedBy("system");
            defaultTemplate.setCreatedAt(LocalDateTime.now());

            ReportTemplate savedTemplate = templateRepository.save(defaultTemplate);

            // Ensure the file is saved with the template ID
            if (savedTemplate.getId() != null) {
                String templateFileName = "template_" + savedTemplate.getId() + ".html";
                Path templatePath = Paths.get(TEMPLATES_DIR, templateFileName);
                Files.write(templatePath, defaultTemplateContent.getBytes(StandardCharsets.UTF_8));
                savedTemplate.setFilePath(templateFileName);
                return templateRepository.save(savedTemplate);
            }

            return savedTemplate;

        } catch (IOException e) {
            log.error("Error creating default template file", e);
            throw new RuntimeException("Failed to create default template", e);
        }
    }

    private String getBasicDefaultTemplate() {
        return "<!DOCTYPE html>\n" +
                "<html xmlns:th=\"http://www.thymeleaf.org\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\"/>\n" +
                "    <title th:text=\"${title != null ? title : 'Report'}\">Report</title>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; }\n" +
                "        .header { text-align: center; margin-bottom: 20px; }\n" +
                "        .section { margin: 15px 0; }\n" +
                "        .footer { text-align: center; font-size: 12px; margin-top: 30px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"header\">\n" +
                "        <h1 th:text=\"${title != null ? title : 'Report'}\">Report</h1>\n" +
                "    </div>\n" +
                "    <div class=\"section\">\n" +
                "        <h2>Report Information</h2>\n" +
                "        <p>Case Number: <span th:text=\"${caseNumber != null ? caseNumber : 'N/A'}\">N/A</span></p>\n" +
                "        <p>Date: <span th:text=\"${createdAt != null ? createdAt : 'N/A'}\">N/A</span></p>\n" +
                "    </div>\n" +
                "    <div class=\"section\">\n" +
                "        <h2>Description</h2>\n" +
                "        <p th:text=\"${description != null ? description : 'No description provided.'}\">No description provided.</p>\n" +
                "    </div>\n" +
                "    <div class=\"footer\">\n" +
                "        <p>Generated by the Report Management System</p>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    public ReportTemplate createTemplate(ReportTemplate template) {
        // If this is set as default, unset any existing default
        if (template.isDefault()) {
            Optional<ReportTemplate> currentDefault = templateRepository.findByIsDefaultTrue();
            currentDefault.ifPresent(t -> {
                t.setDefault(false);
                templateRepository.save(t);
            });
        }

        // Save the template to the database first to get an ID
        template.setCreatedAt(LocalDateTime.now());
        ReportTemplate savedTemplate = templateRepository.save(template);

        // Now use the generated ID to create a unique filename
        if (savedTemplate.getHtmlTemplate() != null) {
            String fileName = "template_" + savedTemplate.getId() + ".html";
            saveTemplateToFile(savedTemplate, fileName);

            // Update the file path in the database
            savedTemplate.setFilePath(fileName);
            savedTemplate = templateRepository.save(savedTemplate);
        }

        return savedTemplate;
    }

    public ReportTemplate updateTemplate(String id, ReportTemplate template) {
        ReportTemplate existingTemplate = getTemplateById(id);

        existingTemplate.setName(template.getName());
        existingTemplate.setDescription(template.getDescription());
        existingTemplate.setContent(template.getContent());

        // Update HTML template if provided
        if (template.getHtmlTemplate() != null) {
            existingTemplate.setHtmlTemplate(template.getHtmlTemplate());

            // Always create/update the file with the template ID
            String fileName = "template_" + id + ".html";
            saveTemplateToFile(existingTemplate, fileName);
            existingTemplate.setFilePath(fileName);
        }

        // Handle default template status
        if (template.isDefault() && !existingTemplate.isDefault()) {
            Optional<ReportTemplate> currentDefault = templateRepository.findByIsDefaultTrue();
            currentDefault.ifPresent(t -> {
                t.setDefault(false);
                templateRepository.save(t);
            });
            existingTemplate.setDefault(true);
        } else if (!template.isDefault() && existingTemplate.isDefault()) {
            // Check if this is the only template
            long count = templateRepository.count();
            if (count > 1) {
                existingTemplate.setDefault(false);
            } else {
                // Keep as default if it's the only template
                existingTemplate.setDefault(true);
            }
        }

        existingTemplate.setUpdatedAt(LocalDateTime.now());
        return templateRepository.save(existingTemplate);
    }

    public void deleteTemplate(String id) {
        ReportTemplate template = getTemplateById(id);

        // Don't allow deleting the default template if it's the only one
        if (template.isDefault() && templateRepository.count() <= 1) {
            throw new IllegalStateException("Cannot delete the only default template");
        }

        // If deleting the default template, set another one as default
        if (template.isDefault()) {
            Optional<ReportTemplate> anotherTemplate = templateRepository.findFirstByIdNot(id);
            anotherTemplate.ifPresent(t -> {
                t.setDefault(true);
                templateRepository.save(t);
            });
        }

        // Delete the template file if it exists
        if (template.getFilePath() != null) {
            try {
                Path templatePath = Paths.get(TEMPLATES_DIR, template.getFilePath());
                if (Files.exists(templatePath)) {
                    Files.delete(templatePath);
                    log.info("Deleted template file: {}", templatePath);
                }
            } catch (IOException e) {
                log.error("Error deleting template file", e);
                // Continue with deletion even if file deletion fails
            }
        }

        templateRepository.deleteById(id);
    }

    private void saveTemplateToFile(ReportTemplate template, String fileName) {
        try {
            // Create templates directory if it doesn't exist
            Path templatesDir = Paths.get(TEMPLATES_DIR);
            if (!Files.exists(templatesDir)) {
                Files.createDirectories(templatesDir);
            }

            Path templatePath = Paths.get(TEMPLATES_DIR, fileName);
            Files.write(templatePath, template.getHtmlTemplate().getBytes(StandardCharsets.UTF_8));

            log.info("Saved template file: {}", templatePath);
        } catch (IOException e) {
            log.error("Error saving template to file", e);
            throw new RuntimeException("Failed to save template file", e);
        }
    }

    public String getTemplateContent(ReportTemplate template) {
        // If content is stored in the database, return it
        if (template.getContent() != null && !template.getContent().isEmpty()) {
            return template.getContent();
        }

        // Otherwise, try to load from file
        if (template.getFilePath() != null && !template.getFilePath().isEmpty()) {
            try {
                if (template.getFilePath().startsWith("classpath:")) {
                    Resource resource = resourceLoader.getResource(template.getFilePath());
                    return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                } else {
                    Path path = Paths.get(TEMPLATES_DIR, template.getFilePath());
                    return Files.readString(path, StandardCharsets.UTF_8);
                }
            } catch (IOException e) {
                log.error("Failed to read template file: {}", template.getFilePath(), e);
                throw new TemplateNotFoundException("Template file not found: " + template.getFilePath());
            }
        }

        // If no content or file path, throw exception
        throw new TemplateNotFoundException("Template has no content or file path: " + template.getId());
    }

    public String processTemplate(String templateContent, Map<String, Object> data) {
        Context context = new Context();
        context.setVariables(data);

        return templateEngine.process(templateContent, context);
    }
}