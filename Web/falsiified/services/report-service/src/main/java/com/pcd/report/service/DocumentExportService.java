package com.pcd.report.service;

import lombok.extern.slf4j.Slf4j;
import com.itextpdf.html2pdf.HtmlConverter;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.jsoup.Jsoup; // Add Jsoup dependency for basic HTML stripping
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class DocumentExportService{


    public byte[] generatePdf(String htmlContent) throws IOException {
        if (htmlContent == null || htmlContent.trim().isEmpty()) {
            htmlContent = "<p>No content available.</p>"; // Provide default content
        }
        ByteArrayOutputStream pdfOutputStream = new ByteArrayOutputStream();
        try (InputStream htmlInputStream = new ByteArrayInputStream(htmlContent.getBytes(StandardCharsets.UTF_8))) {
            HtmlConverter.convertToPdf(htmlInputStream, pdfOutputStream);
            log.info("Successfully generated PDF from HTML content.");
        } catch (Exception e) {
            log.error("Error generating PDF from HTML: {}", e.getMessage(), e);
            throw new IOException("Failed to generate PDF document.", e);
        }
        return pdfOutputStream.toByteArray();
    }


    public byte[] generateDocx(String htmlContent) throws IOException {
        if (htmlContent == null || htmlContent.trim().isEmpty()) {
            htmlContent = "No content available.";
        }
        String plainText = Jsoup.clean(htmlContent, Safelist.none());

        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream docxOutputStream = new ByteArrayOutputStream()) {

            XWPFParagraph paragraph = document.createParagraph();
            XWPFRun run = paragraph.createRun();
            // Handle line breaks from plain text
            String[] lines = plainText.split("\\r?\\n");
            for (int i = 0; i < lines.length; i++) {
                run.setText(lines[i]);
                if (i < lines.length - 1) {
                    run.addBreak(); // Add line break for POI
                }
            }

            document.write(docxOutputStream);
            log.info("Successfully generated basic DOCX from HTML content (text only).");
            return docxOutputStream.toByteArray();
        } catch (Exception e) {
            log.error("Error generating DOCX from HTML: {}", e.getMessage(), e);
            throw new IOException("Failed to generate DOCX document.", e);
        }
    }
}