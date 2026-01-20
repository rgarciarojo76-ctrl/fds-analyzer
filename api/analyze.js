
export const config = {
    runtime: 'edge', // Critical for bypassing serverless timeouts
};

const SYSTEM_PROMPT = `
Rol: Técnico Superior en Prevención de Riesgos Laborales (PRL).
Contexto: Normativa REACH y CLP.
Tarea: Analiza el texto extraído de una Ficha de Datos de Seguridad (FDS) y extrae información crítica.

Requisitos Estrictos:
1. Salida: ÚNICAMENTE un objeto JSON válido.
2. Citas: CADA string extraído DEBE terminar con la referencia de página en la que aparece, formato: "(Ref. Pág. X)".
3. Si no hay información: array vacío [] o ["No especificado"].

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

        if (!text) {
            return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 500 });
        }

        // Reverting to generic 'gemini-1.5-flash' (Valid alias, previously 504 but exists)
        const model = 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;

        // Construct the payload for the REST API
        const payload = {
            contents: [{
                parts: [{
                    text: `${SYSTEM_PROMPT}\n\n-- DOCUMENTO FDS --\n${text}\n-- FIN --`
                }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                // temperature: 0.1 // Optional
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            return new Response(JSON.stringify({ error: `Gemini API Error: ${response.status}`, details: errorText }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Passthrough the stream directly to the client
        // This keeps the connection alive preventing Vercel timeouts
        return new Response(response.body, {
            headers: {
                'Content-Type': 'application/json',
                'Transfer-Encoding': 'chunked'
            }
        });

    } catch (error) {
        console.error("Edge Handler Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
