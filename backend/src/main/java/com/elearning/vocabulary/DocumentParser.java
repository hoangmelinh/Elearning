package com.elearning.vocabulary;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
public class DocumentParser {

    /**
     * Parses the uploaded file and returns its text content.
     * For .docx files that contain tables with 2+ columns, returns TSV format
     * so it can be parsed directly without AI.
     */
    public String parse(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            return "";
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return new String(file.getBytes(), StandardCharsets.UTF_8);
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();

        try (InputStream is = file.getInputStream()) {
            switch (extension) {
                case ".pdf":
                    return parsePdf(file.getBytes());
                case ".docx":
                    return parseDocx(file.getBytes());
                case ".txt":
                case ".csv":
                default:
                    return new String(file.getBytes(), StandardCharsets.UTF_8);
            }
        }
    }

    /**
     * Detect if a .docx file has vocabulary tables.
     * Returns TSV rows if tables found, otherwise falls back to plain text.
     * TSV prefix "TABLE_TSV:\n" marks structured data for the controller.
     */
    public String parseDocx(byte[] bytes) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(new java.io.ByteArrayInputStream(bytes))) {
            List<XWPFTable> tables = doc.getTables();
            if (!tables.isEmpty()) {
                List<String> tsvRows = new ArrayList<>();
                for (XWPFTable table : tables) {
                    List<XWPFTableRow> rows = table.getRows();
                    for (int i = 0; i < rows.size(); i++) {
                        XWPFTableRow row = rows.get(i);
                        List<XWPFTableCell> cells = row.getTableCells();
                        if (cells.size() < 2) continue;

                        List<String> cellTexts = new ArrayList<>();
                        for (XWPFTableCell cell : cells) {
                            cellTexts.add(cell.getText().trim());
                        }

                        // Skip header rows (first row or rows where all cells are typical header keywords)
                        String firstCell = cellTexts.get(0).toLowerCase();
                        if (i == 0 && (firstCell.contains("từ vựng") || firstCell.contains("word") || firstCell.contains("term"))) {
                            continue;
                        }

                        // Only include rows that have actual content
                        if (!cellTexts.get(0).isEmpty()) {
                            tsvRows.add(String.join("\t", cellTexts));
                        }
                    }
                }
                if (!tsvRows.isEmpty()) {
                    return "TABLE_TSV:\n" + String.join("\n", tsvRows);
                }
            }

            // Fallback: extract plain text
            try (XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
                return extractor.getText();
            }
        }
    }

    private String parsePdf(byte[] bytes) throws Exception {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }
}
