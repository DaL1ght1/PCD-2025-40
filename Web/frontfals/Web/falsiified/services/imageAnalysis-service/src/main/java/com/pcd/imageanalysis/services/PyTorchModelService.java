package com.pcd.imageanalysis.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class PyTorchModelService {
    private static final Logger log = LoggerFactory.getLogger(PyTorchModelService.class);

    private final String modelPath;
    private final String pythonScriptPath;
    private final ObjectMapper objectMapper;

    @Value("${python.executable:python}")
    private String pythonExecutable;

    @Value("${python.timeout:60}")
    private int pythonTimeout;

    @Value("${shap.background.dir:/path/to/background/images}")
    private String shapBackgroundDir;

    @Autowired
    public PyTorchModelService(
            @Qualifier("modelPath") String modelPath,
            @Qualifier("pythonScriptPath") String pythonScriptPath,
            ObjectMapper objectMapper) {
        this.modelPath = modelPath;
        this.pythonScriptPath = pythonScriptPath;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        log.info("PyTorch Model Service initialized with model at {}", modelPath);
        log.info("Using Python script at {}", pythonScriptPath);
        try {
            Process process = new ProcessBuilder(pythonExecutable, "--version")
                    .redirectErrorStream(true)
                    .start();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.info("Python version: {}", line);
                }
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.error("Python executable test failed with exit code {}", exitCode);
            }
        } catch (Exception e) {
            log.error("Error testing Python environment", e);
        }
    }

    public Map<String, Object> analyzeImage(
            Path imagePath,
            String arch,
            int imgHeight,
            int imgWidth,
            int denseUnits,
            double dropout,
            String modelVersion
    ) throws IOException, InterruptedException {
        File tempOutput = null;
        File xaiOutputDir = null;
        try {
            tempOutput = File.createTempFile("analysis_result_", ".json");
            xaiOutputDir = Files.createTempDirectory("xai_outputs_").toFile();

            List<String> command = new ArrayList<>();
            command.add(pythonExecutable);
            command.add(pythonScriptPath);
            command.add("--model"); command.add(modelPath);
            command.add("--image"); command.add(imagePath.toString());
            command.add("--output"); command.add(tempOutput.getAbsolutePath());
            command.add("--arch"); command.add(arch);
            command.add("--img-height"); command.add(String.valueOf(imgHeight));
            command.add("--img-width"); command.add(String.valueOf(imgWidth));
            command.add("--dense-units"); command.add(String.valueOf(denseUnits));
            command.add("--dropout"); command.add(String.valueOf(dropout));
            command.add("--xai-output-dir"); command.add(xaiOutputDir.getAbsolutePath());
            command.add("--shap-background-dir"); command.add(shapBackgroundDir);

            log.debug("Executing Python command: {}", String.join(" ", command));

            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();

            StringBuilder outputLog = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    outputLog.append(line).append("\n");
                    log.debug("Python script output: {}", line);
                }
            }

            boolean completed = process.waitFor(pythonTimeout, TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                log.error("Python process timed out after {} seconds for image {}", pythonTimeout, imagePath);
                throw new IOException("Python process timed out after " + pythonTimeout + " seconds");
            }

            int exitCode = process.exitValue();
            log.info("Python script finished for image {} with exit code: {}", imagePath, exitCode);

            if (!tempOutput.exists() || tempOutput.length() == 0) {
                log.error("Python script output file missing or empty: {}", tempOutput.getAbsolutePath());
                throw new IOException("Python script did not produce an output file. Exit code: " + exitCode + ". Script log:\n" + outputLog);
            }

            String jsonResult = Files.readString(tempOutput.toPath());
            log.debug("Raw JSON result from Python script: {}", jsonResult);

            Map<String, Object> result;
            try {
                result = objectMapper.readValue(jsonResult, new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.error("Failed to parse JSON result from Python script: {}", jsonResult, e);
                throw new IOException("Failed to parse JSON result from Python script: " + e.getMessage(), e);
            }

            if (result.containsKey("error")) {
                log.error("Python script reported an error: {}", result.get("error"));
                throw new IOException("Python script failed: " + result.get("error"));
            }

            result.putIfAbsent("modelVersion", modelVersion);

            if (!result.containsKey("isFalsified") || !result.containsKey("confidenceScore")) {
                log.warn("Parsed JSON result is missing expected keys ('isFalsified', 'confidenceScore'). Result: {}", result);
                throw new IOException("Parsed JSON result is missing expected keys.");
            }

            log.info("Successfully parsed analysis result for image {}: Falsified={}, Score={}",
                    imagePath, result.get("isFalsified"), result.get("confidenceScore"));

            return result;

        } catch (IOException | InterruptedException e) {
            log.error("Error executing or processing Python script for image {}: {}", imagePath, e.getMessage(), e);
            throw e;
        } finally {
            if (tempOutput != null && !tempOutput.delete()) {
                log.warn("Could not delete temporary output file: {}", tempOutput.getAbsolutePath());
            }
        }
    }
}