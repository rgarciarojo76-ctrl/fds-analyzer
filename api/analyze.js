
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

Reglas Específicas por Sección:
- SECCIÓN 4 (Primeros Auxilios):
    * Extrae SOLO información relevante para PRL y actuación inmediata de personal NO sanitario.
    * Prioriza: Medidas generales, vías de exposición (inhalación/cutánea), síntomas clave y criterios médicos.
    * Indica expresamente si "No existen tratamientos especiales".
    * EXCLUYE: Redacciones genéricas, instrucciones clínicas avanzadas, vías no previsibles.
    * FORMATO: Protocolo operativo breve y claro (listas cortas).
- SECCIÓN 5 (Medidas de lucha contra incendios):
    * Extrae SOLO lo relevante para personal del centro/plan de emergencias (NO bomberos).
    * Incluye: Riesgos específicos graves (ej: explosión), medios extinción (sí/no), advertencias clave (evacuación, aislamiento).
    * EXCLUYE: Instrucciones técnicas profesionales, temas ambientales menores.
    * FORMATO: Resumen operativo y preventivo.
- SECCIÓN 6 (Medidas en caso de vertido accidental):
    * Extrae SOLO información relevante para seguridad del trabajador (Riesgos: polvo, explosión, contacto).
    * Incluye: Actuación inmediata (Aislamiento, EPI obligatorio, evitar polvo), métodos seguros de limpieza y gestión inicial.
    * Indica CLARAMENTE cuándo NO intervenir.
    * EXCLUYE: Medidas ambientales, referencias cruzadas, procedimientos externos complejos.
    * FORMATO: Procedimiento operativo resumido.
- SECCIÓN 7 (Manipulación y almacenamiento):
    * Extrae y reformula SOLO información relevante para PRL, operativa y procedimental.
    * Estructura OBLIGATORIA en 4 bloques: 1. Manipulación segura (Minimizar exposición, polvo, ventilación), 2. Prevención incendios/explosiones (ATEX, control polvo), 3. Higiene industrial, 4. Almacenamiento seguro.
    * EXCLUYE: Referencias cruzadas, datos accesorios.
    * FORMATO: Instrucción preventiva clara.
- SECCIÓN 8 (Controles de exposición/EPIs):
    * Prioridad: Control exposición trabajador (Normativa España).
    * Extrae: 1. Límites (VLA-ED/EC, DNEL compl.), 2. Controles técnicos (Ventilación), 3. EPIs (Respiratoria: filtro/norma; Ocular; Manos: material/norma).
    * EXCLUYE: PNEC, datos ambientales, controles ambientales puros.
    * FORMATO: Resumen técnico-preventivo.
- SECCIÓN 9 (Propiedades físicas y químicas):
    * Extrae SOLO propiedades con relevancia preventiva (Exposición, combustibilidad, explosión, ATEX).
    * EXCLUYE: pH, ptebullición, densidad, etc. si NO influyen en el riesgo.
    * FORMATO: Resumen técnico-preventivo conciso.

Estructura JSON Objetivo:
{
  "productName": "Nombre comercial completo del producto",
  "card1": ["Identificación de la sustancia/mezcla y de la sociedad/empresa (Ref. Pág. X)", ...],
  "card2": ["Identificación de los peligros (Ref. Pág. X)", "Frases H y P (Ref. Pág. X)", ...],
  "card3": ["Composición/información sobre los componentes (Ref. Pág. X)", ...],
  "card4": ["Protocolo de Actuación Inmediata (Ref. Pág. X)", "Inhalación: ... (Ref. Pág. X)", "Piel: ... (Ref. Pág. X)", "Ojos: ... (Ref. Pág. X)", "Ingestión: ... (Ref. Pág. X)", "Síntomas Alerta: ... (Ref. Pág. X)", "Atención Médica: ... (Ref. Pág. X)"],
  "card5": ["Medidas de lucha contra incendios (Ref. Pág. X)", ...],
  "card6": ["Medidas en caso de vertido accidental (Ref. Pág. X)", ...],
  "card7": ["1. Manipulación Segura: ... (Ref. Pág. X)", "2. Prevención Incendios/Explosiones: ... (Ref. Pág. X)", "3. Higiene Industrial: ... (Ref. Pág. X)", "4. Almacenamiento Seguro: ... (Ref. Pág. X)"],
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

        // Reverting to 1.5-flash as 2.5 might be unstable/unavailable causing 504s
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
