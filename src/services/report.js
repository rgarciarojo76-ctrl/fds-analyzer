
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Use the public folder path directly
const logoUrl = '/logo-direccion-tecnica.jpg';

export const generatePDF = async (data, customSections = null) => {
    if (!data && !customSections) return;

    try {
        console.log("Starting PDF generation with FDS Template...");
        const doc = new jsPDF();

        // --- Config & Styles ---
        const pageWidth = doc.internal.pageSize.width; // 210mm
        const pageHeight = doc.internal.pageSize.height; // 297mm
        const margin = 15;
        const availableWidth = pageWidth - (margin * 2);

        // Dynamic Column Width: Full width if single section, else split
        const isSingleSection = customSections && customSections.length === 1;
        const colWidth = isSingleSection ? availableWidth : availableWidth / 2;

        const headerColor = [0, 159, 227]; // ASPY Corporate Blue (#009FE3)
        const borderColor = [0, 0, 0]; // Black

        // --- Helper Functions ---
        const loadLogoSafe = async (url) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network response was not ok');
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.warn("Could not load logo for PDF:", e);
                return null;
            }
        };

        const drawFooter = () => {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);

                // Centered Tagline
                doc.text("Información Prevención de Riesgos Laborales - Apoyo Técnico IA", pageWidth / 2, pageHeight - 10, { align: 'center' });

                // Page Numbering "1-2" Bottom Right
                doc.text(`${i}-${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
            }
        };

        // Pre-load logo
        const logoBase64 = await loadLogoSafe(logoUrl);

        // --- Header Rendering ---
        if (logoBase64) {
            doc.addImage(logoBase64, 'JPEG', margin, 10, 45, 0);
        }

        // Top Right Title - ADAPTED FOR FDS
        doc.setFontSize(10);
        doc.setTextColor(0, 159, 227); // ASPY Corporate Blue
        doc.setFont("helvetica", "bold");
        doc.text("ANÁLISIS DE FICHAS DE DATOS DE SEGURIDAD", pageWidth - margin, 18, { align: 'right' });

        // Product Name Logic (Simplified for FDS)
        let productName = "PRODUCTO QUÍMICO";

        if (data && data.productName) {
            productName = data.productName.toUpperCase();
        } else if (data && data.card1 && data.card1.length > 0) {
            // Fallback: Try to find name in card1 if productName matches default
            const firstLine = data.card1[0];
            if (firstLine && firstLine.length < 100) {
                productName = firstLine.replace(/\(Ref\..*?\)/g, "").trim().toUpperCase();
            }
        }

        doc.setTextColor(100); // Grey for subtitle
        // Use splitTextToSize to handle long product names
        doc.setFontSize(12);
        const splitTitle = doc.splitTextToSize(productName, pageWidth / 2);
        doc.text(splitTitle, pageWidth - margin, 23, { align: 'right' });

        // Decorative line under logo
        doc.setDrawColor(200);
        doc.line(margin, 28, margin + 45, 28); // Short line under logo

        // Decorative bracket/line for title
        doc.setDrawColor(150);
        doc.line(pageWidth - margin - 5, 25, pageWidth - margin, 25);


        // --- Grid Content ---
        let currentY = 40; // Start Y for table

        // Determine Sections source
        let allSections = [];
        if (customSections) {
            allSections = customSections;
        } else if (data) {
            // MAP FDS 12 CARDS TO SECTIONS
            // Mapping keys to Titles exactly as requested in style
            allSections = [
                { title: "1. IDENTIFICACIÓN DE LA SUSTANCIA", data: { content: data.card1 } },
                { title: "2. IDENTIFICACIÓN DE PELIGROS", data: { content: data.card2 } },
                { title: "3. COMPOSICIÓN/COMPONENTES", data: { content: data.card3 } },
                { title: "4. PRIMEROS AUXILIOS", data: { content: data.card4 } },
                { title: "5. MEDIDAS LUCHA CONTRA INCENDIOS", data: { content: data.card5 } },
                { title: "6. MEDIDAS VERTIDO ACCIDENTAL", data: { content: data.card6 } },
                { title: "7. MANIPULACIÓN Y ALMACENAMIENTO", data: { content: data.card7 } },
                { title: "8. CONTROLES EXPOSICIÓN / EPIs", data: { content: data.card8 } },
                { title: "9. PROPIEDADES FÍSICO-QUÍMICAS", data: { content: data.card9 } },
                { title: "10. ESTABILIDAD Y REACTIVIDAD", data: { content: data.card10 } },
                { title: "11. INFORMACIÓN TOXICOLÓGICA", data: { content: data.card11 } },
                { title: "12. INFORMACIÓN ECOLÓGICA / RESIDUOS", data: { content: data.card12 } },
            ];
        }

        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.1);

        // Helper to clean content lines (Remove Page Refs if desired, or keep them small)
        const cleanContentLine = (text) => {
            if (text === null || text === undefined) return "";
            return String(text).trim(); // Force string to avoid .trim() errors on numbers/objects
        };

        // Helper to get wrapped lines and CLEAN them
        const getLines = (section) => {
            if (!section || !section.data || !section.data.content) return [];

            // Handle various data types safely
            let sourceContent = section.data.content;
            let rawLines = [];

            if (Array.isArray(sourceContent)) {
                rawLines = sourceContent.map(line => cleanContentLine(line));
            } else {
                rawLines = [cleanContentLine(sourceContent)];
            }

            // Wrap text
            const wrapped = [];
            rawLines.forEach(line => {
                // Ensure we don't have empty lines after cleaning
                if (line && line.replace(/•|-/, '').trim().length > 0) {
                    // Prepend bullet if it's a list item and doesn't have one
                    let textToWrap = line;
                    if (!textToWrap.startsWith("•") && !textToWrap.startsWith("-")) {
                        textToWrap = "• " + textToWrap;
                    }

                    try {
                        const splitLines = doc.splitTextToSize(textToWrap, (colWidth - 8)); // -8 for padding
                        splitLines.forEach(l => wrapped.push(l));
                    } catch (err) {
                        console.warn("Error wrapping text:", textToWrap, err);
                        wrapped.push(textToWrap); // Fallback
                    }
                }
            });
            return wrapped;
        };

        // Process in pairs (Row by Row)
        for (let i = 0; i < allSections.length; i += 2) {
            const leftSec = allSections[i];
            const rightSec = i + 1 < allSections.length ? allSections[i + 1] : null;

            const leftLines = getLines(leftSec);
            const rightLines = rightSec ? getLines(rightSec) : [];

            // 1. Calculate Dimensions
            const lineHeight = 5; // mm per line
            const headerHeight = 12;
            const topPadding = 6;
            const bottomPadding = 2; // slight buffer
            const baseRowOverhead = headerHeight + topPadding + bottomPadding;

            const maxLines = Math.max(leftLines.length, rightLines.length);
            const totalRowHeight = (maxLines * lineHeight) + baseRowOverhead;

            // 2. Logic: Fit or Split
            const pageEffectiveHeight = pageHeight - 15; // Bottom margin safe zone
            const spaceLeft = pageEffectiveHeight - currentY;

            // Definition of "Worth Splitting":
            // We need enough space for Header + at least 3 lines of text to look good.
            const minSplitHeight = headerHeight + topPadding + (3 * lineHeight);

            if (totalRowHeight <= spaceLeft) {
                // CASE A: FITS PERFECTLY
                drawRowSegment(doc, currentY, leftLines, rightLines, leftSec, rightSec, headerColor, colWidth, margin, headerHeight, lineHeight);
                currentY += totalRowHeight;
            } else {
                // IT DOES NOT FIT.
                // Check if we should split or just jump.
                if (spaceLeft > minSplitHeight) {
                    // CASE B: SPLIT (Fill gap, then jump)

                    // Calculate how many lines fit in the remaining space
                    // spaceLeft = header + topPadding + (lines * 5)
                    // lines = (spaceLeft - header - topPadding) / 5
                    const linesFit = Math.floor((spaceLeft - headerHeight - topPadding) / lineHeight);

                    // Slice content
                    const leftChunk1 = leftLines.slice(0, linesFit);
                    const leftChunk2 = leftLines.slice(linesFit);
                    const rightChunk1 = rightLines.slice(0, linesFit);
                    const rightChunk2 = rightLines.slice(linesFit);

                    // Draw Part 1
                    drawRowSegment(doc, currentY, leftChunk1, rightChunk1, leftSec, rightSec, headerColor, colWidth, margin, headerHeight, lineHeight);

                    // New Page
                    doc.addPage();
                    currentY = 20;

                    // Draw Part 2 (With REPEATED HEADERS same title)
                    drawRowSegment(doc, currentY, leftChunk2, rightChunk2, leftSec, rightSec, headerColor, colWidth, margin, headerHeight, lineHeight);

                    // Update Y
                    const part2Height = (Math.max(leftChunk2.length, rightChunk2.length) * lineHeight) + baseRowOverhead;
                    currentY += part2Height;

                } else {
                    // CASE C: NOT ENOUGH SPACE TO SPLIT (Just Jump)
                    doc.addPage();
                    currentY = 20;
                    drawRowSegment(doc, currentY, leftLines, rightLines, leftSec, rightSec, headerColor, colWidth, margin, headerHeight, lineHeight);
                    currentY += totalRowHeight;
                }
            }
        }

        drawFooter();
        // Use sanitized filename
        const filename = (productName || 'FDS_Informe').replace(/[^a-z0-9]/gi, '_').substring(0, 30);
        doc.save(`FDS_${filename}.pdf`);

    } catch (error) {
        console.error("PDF Generation Failed:", error);
        alert("Error al generar el PDF: " + error.message);
    }
};

const isSingleSection = (colW, margin) => {
    // Rough check if colW is essentially full width
    return colW > 150;
}

// Helper function to draw a row (or segment of a row)
const drawRowSegment = (doc, startY, lLines, rLines, lSec, rSec, color, colW, margin, headH, lineH) => {
    // Height of this specific segment content
    const segLines = Math.max(lLines.length, rLines.length);
    // Ensure minimum box height even if empty
    const boxH = Math.max((segLines * lineH) + 8, 10);

    // -- Headers --
    doc.setFillColor(...color);

    // Calculate Header Text Y to Center it Vertically
    const getCenteredY = (text, boxY, boxHeight) => {
        const lines = doc.splitTextToSize(text, colW - 4);
        if (lines.length > 1) {
            return boxY + 5; // Shift up slightly for multiline
        }
        return boxY + 7; // Default for single line
    };

    // Left Header
    doc.rect(margin, startY, colW, headH, 'F');
    doc.rect(margin, startY, colW, headH, 'S');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    let headerY = getCenteredY(lSec.title, startY, headH);
    doc.text(lSec.title, margin + (colW / 2), headerY, { align: 'center', maxWidth: colW - 4 });

    // Right Header
    if (rSec) {
        doc.setFillColor(...color);
        doc.rect(margin + colW, startY, colW, headH, 'F');
        doc.rect(margin + colW, startY, colW, headH, 'S');

        doc.setTextColor(255, 255, 255);
        headerY = getCenteredY(rSec.title, startY, headH);
        doc.text(rSec.title, margin + colW + (colW / 2), headerY, { align: 'center', maxWidth: colW - 4 });
    } else if (!rSec && !isSingleSection(colW, margin)) {
        // If no right section but we are in 2-col mode, draw empty header frame? 
        // Better to check if we are full width. 
        // Here colW is already passed. If colW is half, we might leave empty space.
    }

    // -- Content --
    const contentY = startY + headH;
    doc.setFillColor(255, 255, 255);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9); // Ensure font size resets

    // Left Box
    doc.rect(margin, contentY, colW, boxH, 'S');
    let textY = contentY + 6;
    lLines.forEach(line => {
        doc.text(line, margin + 4, textY);
        textY += lineH;
    });

    // Right Box
    if (rSec) {
        doc.rect(margin + colW, contentY, colW, boxH, 'S');
        textY = contentY + 6;
        rLines.forEach(line => {
            doc.text(line, margin + colW + 4, textY);
            textY += lineH;
        });
    }
};
