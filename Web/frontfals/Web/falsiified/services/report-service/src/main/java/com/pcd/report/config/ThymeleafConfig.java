package com.pcd.report.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.thymeleaf.templateresolver.FileTemplateResolver;
import org.thymeleaf.templateresolver.ITemplateResolver;
import org.thymeleaf.templateresolver.StringTemplateResolver;

import java.nio.charset.StandardCharsets;

@Configuration
public class ThymeleafConfig {

    @Value("${templates.directory:src/main/resources/templates/}")
    private String templatesDirectory;

    @Value("${spring.thymeleaf.cache:true}")
    private boolean thymeleafCache;

    @Bean(name = "customTemplateEngine")
    public TemplateEngine templateEngine() {
        SpringTemplateEngine templateEngine = new SpringTemplateEngine();

        // Add string template resolver with highest priority for database-stored templates
        templateEngine.addTemplateResolver(stringTemplateResolver());

        // Add file template resolver for file-based templates
        templateEngine.addTemplateResolver(fileTemplateResolver());

        // Add classpath template resolver as fallback
        templateEngine.addTemplateResolver(classLoaderTemplateResolver());

        return templateEngine;
    }

    private ITemplateResolver stringTemplateResolver() {
        StringTemplateResolver templateResolver = new StringTemplateResolver();
        templateResolver.setTemplateMode(TemplateMode.HTML);
        templateResolver.setCacheable(thymeleafCache);
        templateResolver.setOrder(1); // Highest priority
        return templateResolver;
    }

    private ITemplateResolver fileTemplateResolver() {
        FileTemplateResolver templateResolver = new FileTemplateResolver();
        templateResolver.setPrefix(templatesDirectory);
        templateResolver.setSuffix(".html");
        templateResolver.setTemplateMode(TemplateMode.HTML);
        templateResolver.setCharacterEncoding(StandardCharsets.UTF_8.name());
        templateResolver.setCacheable(thymeleafCache); // Enable caching in production
        templateResolver.setCheckExistence(true);
        templateResolver.setOrder(2); // Second priority
        return templateResolver;
    }

    private ITemplateResolver classLoaderTemplateResolver() {
        ClassLoaderTemplateResolver templateResolver = new ClassLoaderTemplateResolver();
        templateResolver.setPrefix("templates/");
        templateResolver.setSuffix(".html");
        templateResolver.setTemplateMode(TemplateMode.HTML);
        templateResolver.setCharacterEncoding(StandardCharsets.UTF_8.name());
        templateResolver.setCacheable(thymeleafCache); // Enable caching in production
        templateResolver.setCheckExistence(true);
        templateResolver.setOrder(3); // Lowest priority
        return templateResolver;
    }
}