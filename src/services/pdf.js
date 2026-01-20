import * as pdfjsLib from 'pdfjs-dist';

// Configuración del Worker para Vite
// Importamos la URL del worker directamente del paquete build
// import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// USAR CDN PARA EVITAR PROBLEMAS DE BUNDLING CON VITE
const workerUrl = "https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";

// Inicializar el worker solo cuando sea necesario o comprobar si ya está
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
}

export const extractTextFromPDF = async (file, onProgress, onDebug) => {
    const log = (msg) => {
        console.log(`[PDF Service] ${msg}`);
        if (onDebug) onDebug(msg);
    };

    try {
        log('Iniciando extracción de PDF...');
        const arrayBuffer = await file.arrayBuffer();
        log(`Buffer cargado: ${arrayBuffer.byteLength} bytes`);

        // Carga del documento
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

        loadingTask.onProgress = (progressData) => {
            if (progressData.total > 0) {
                const percent = (progressData.loaded / progressData.total) * 100;
                log(`Cargando documento: ${Math.round(percent)}%`);
            }
        };

        const pdf = await loadingTask.promise;
        log(`Documento PDF cargado. Páginas: ${pdf.numPages}`);

        const numPages = pdf.numPages;
        let fullText = '';

        // Iteración por páginas (1-indexed)
        for (let i = 1; i <= numPages; i++) {
            if (onProgress) {
                onProgress((i / numPages) * 100);
            }
            log(`Procesando página ${i}/${numPages}...`);

            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Unir items de texto con un espacio (lo más simple y efectivo para análisis posterior)
            const pageText = textContent.items.map((item) => item.str).join(' ');

            // INSERCIÓN DE MARCADOR DE PÁGINA EXPLÍCITO
            fullText += `--- PÁGINA ${i} ---\n${pageText}\n\n`;
        }

        log('Extracción completada con éxito.');
        return fullText;
    } catch (error) {
        log(`ERROR CRÍTICO: ${error.message}`);
        console.error("Error extracting text from PDF:", error);
        throw new Error(`No se pudo leer el archivo PDF: ${error.message}`);
    }
};
