package com.pcd.imageanalysis.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Configuration
public class PythonModelConfig {

    @Value("${model.pytorch.path:classpath:models/falsification_detector.pth}")
    private Resource modelResource;

    @Value("${python.script.path:classpath:python/detect_falsification.py}")
    private Resource pythonScriptResource;

    @Value("${temp.dir:${java.io.tmpdir}}")
    private String tempDir;

    @Bean(name = "modelPath")
    public String modelPath() throws IOException {
        Path tempFile = Paths.get(tempDir, "falsification_detector.pth");
        Files.copy(modelResource.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);
        return tempFile.toString();
    }

    @Bean(name = "pythonScriptPath")
    public String pythonScriptPath() throws IOException {
        Path tempFile = Paths.get(tempDir, "detect_falsification.py");
        Files.copy(pythonScriptResource.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);
        return tempFile.toString();
    }
}