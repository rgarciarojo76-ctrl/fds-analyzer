import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuración de Vercel (Serverless Function)
export const config = {
    maxDuration: 60, // Aumentar timeout a 60 segundos (requiere plan Pro para >10s, pero si falla 504 es lo indicado)
    // runtime: 'nodejs', // Por defecto es nodejs
};

const SYSTEM_PROMPT = `
Rol: Eres un experto Técnico en Seguridad Química y PRL (Prevención de Riesgos Laborales).
Tarea: Analiza el texto extraído de una Ficha de Datos de Seguridad (FDS) y extrae información crítica para la evaluación de riesgos.
Formato de Entrada: Texto plano con marcadores de página (--- PÁGINA X ---).

Requisitos Estrictos de Salida:
1. Responde ÚNICAMENTE con un objeto JSON válido. NO uses bloques de código markdown (\`\`\`json).
2. Cada ítem de información extraído DEBE incluir una referencia a la página de donde se extrajo al final de la frase, formato: (Ref. Pág. X).
3. Si una sección no tiene información, array vacío [] o ["No especificado"].
4. Busca Iconos de peligro y devuélvelos como códigos ISO 7010 si es posible (ej: ISO_W019) o descripciones claras.

Estructura JSON Objetivo:
{
  "productName": "Nombre comercial completo del producto",
  "card1": ["Identificación de la sustancia/mezcla y de la sociedad/empresa (Ref. Pág. X)", ...],
  "card2": ["Identificación de los peligros (Ref. Pág. X)", "Frases H y P (Ref. Pág. X)", ...],
  "card3": ["Composición/información sobre los componentes (Ref. Pág. X)", ...],
  "card4": ["Primeros auxilios (Ref. Pág. X)", ...],
  "card5": ["Medidas de lucha contra incendios (Ref. Pág. X)", ...],
  "card6": ["Medidas en caso de vertido accidental (Ref. Pág. X)", ...],
  "card7": ["Manipulación y almacenamiento (Ref. Pág. X)", ...],
  "card8": ["Controles de exposición/protección individual (EPIs) (Ref. Pág. X)", ...],
  "card9": ["Propiedades físicas y químicas (Ref. Pág. X)", ...],
  "card10": ["Estabilidad y reactividad (Ref. Pág. X)", ...],
  "card11": ["Información toxicológica (Ref. Pág. X)", ...],
  "card12": ["Información ecológica y eliminación (Ref. Pág. X)", ...]
}
`;

export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { text } = await request.json();

        if (!text || text.length < 50) {
            return new Response(JSON.stringify({ error: 'El texto extraído es demasiado corto o inválido.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Configuración del servidor incompleta: Falta GEMINI_API_KEY' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Inicializar SDK
        const genAI = new GoogleGenerativeAI(apiKey);
        // Usamos gemini-pro-latest como en la app 'risk-analysis' que funciona correctamente
        const model = genAI.getGenerativeModel({
            model: "gemini-pro-latest",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1
            }
        });

        const prompt = SYSTEM_PROMPT + "\n\n-- INICIO DE DOCUMENTO FDS --\n" + text + "\n-- FIN DE DOCUMENTO FDS --";

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedText = response.text();

        if (!generatedText) {
            throw new Error("La IA no generó respuesta válida.");
        }

        // Limpieza de Markdown por seguridad (aunque responseMimeType debería evitarlo)
        let cleanJsonString = generatedText;
        if (cleanJsonString.startsWith('```json')) {
            cleanJsonString = cleanJsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanJsonString.startsWith('```')) {
            cleanJsonString = cleanJsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(cleanJsonString);
        } catch (e) {
            console.error("Error parseando JSON de IA:", e);
            console.error("Texto recibido:", generatedText);
            throw new Error("La respuesta de la IA no tiene un formato válido: " + generatedText.substring(0, 50) + "...");
        }

        return new Response(JSON.stringify(jsonResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message || 'Error desconocido en el servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
