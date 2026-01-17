import * as pdfjsLib from 'pdfjs-dist';

// Configure worker. 
// In a Vite environment, we need to ensure the worker is loaded correctly.
// We accepted the pdfjs-dist dependency in package.json.
// Standard modern approach for Vite:
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export const extractTextFromPDF = async (file, onProgress) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

        // Optional: Hook into progress if pdf.js supports it on loadingTask
        // loadingTask.onProgress = (progressData) => { ... }

        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        let fullText = '';

        for (let i = 1; i <= numPages; i++) {
            if (onProgress) {
                onProgress((i / numPages) * 100);
            }

            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(' ');

            fullText += `--- PÁGINA ${i} ---\n${pageText}\n\n`;
        }

        return fullText;
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        throw new Error("No se pudo leer el archivo PDF.");
    }
};
