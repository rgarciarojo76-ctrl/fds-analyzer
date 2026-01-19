import * as pdfjsLib from 'pdfjs-dist';

// Configuración del Worker para Vite
// Importamos la URL del worker directamente del paquete build
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export const extractTextFromPDF = async (file, onProgress) => {
    try {
        const arrayBuffer = await file.arrayBuffer();

        // Carga del documento
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const numPages = pdf.numPages;
        let fullText = '';

        // Iteración por páginas (1-indexed)
        for (let i = 1; i <= numPages; i++) {
            if (onProgress) {
                // Notificar progreso
                onProgress((i / numPages) * 100);
            }

            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Unir items de texto con un espacio (lo más simple y efectivo para análisis posterior)
            const pageText = textContent.items.map((item) => item.str).join(' ');

            // INSERCIÓN DE MARCADOR DE PÁGINA EXPLÍCITO
            // Formato solicitado: --- PÁGINA ${numero_pagina} ---\n${contenido_texto}\n\n
            fullText += `--- PÁGINA ${i} ---\n${pageText}\n\n`;
        }

        return fullText;
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        throw new Error("No se pudo leer el archivo PDF. Verifica que sea un PDF válido.");
    }
};
