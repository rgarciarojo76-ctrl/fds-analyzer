
export const config = {
    runtime: 'edge', // Critical for bypassing serverless timeouts
};

const SYSTEM_PROMPT = `
Rol: Técnico Superior en Prevención de Riesgos Laborales (PRL).
Tarea: Analizar FDS para generar fichas de seguridad operativas.
DIRECTIVA MAESTRA: Extracción LITERAL de textos relevantes para la seguridad del trabajador.

REGLAS GENERALES:
1. NO inventar. Mantener redacción exacta de la FDS (salvo Sección 2).
2. Citar página al final de CADA string: "(Ref. Pág. X)".
3. Salida: ÚNICAMENTE JSON válido.

CRITERIOS ESPECÍFICOS POR SECCIÓN:
- SECCIÓN 1 (Identificación): Extrae Nombre, IDs (CAS/CE/CLP/REACH), Usos funcionales, Tlf Emergencia (ES), Proveedor (Nombre/País). Omitir datos administrativos (emails, direcciones).
- SECCIÓN 2 (Peligros): EXCEPCIÓN -> INTERPRETAR Y SINTETIZAR. Extrae Clasificación (Salud), Frases H (Trabajador), Órganos, Pictogramas. Evalúa Nivel Peligrosidad (Grave/Crítico).
- SECCIÓN 3 (Composición): Identifica Sustancia/Mezcla. Extrae Componentes peligrosos, CAS/CE, Concentración.
- SECCIÓN 4 (Primeros Auxilios): Literal. Actuación inmediata personal no sanitario (Inhalación, Piel, Ojos, Ingestión). Síntomas y atención médica.
- SECCIÓN 5 (Incendios): Literal. Riesgos específicos (explosión), medios extinción, advertencias (evacuación). No instrucciones bomberos.
- SECCIÓN 6 (Vertidos): Literal. Medidas seguridad trabajador, aislamiento, EPIs emergencia, limpieza segura.
- SECCIÓN 7 (Manipulación/Almacenamiento): Literal. Clasificar en 4 bloques: 1. Manipulación Segura, 2. Prevención Incendios/Explosión (ATEX), 3. Higiene Industrial, 4. Almacenamiento Seguro.
- SECCIÓN 8 (Exposición/EPIs): Literal. Prioridad VLA (España). Controles técnicos. EPIs con detalle técnico (Tipo/Norma). Omitir PNEC.
- SECCIÓN 9 (Físico-Químicos): Literal. Solo parámetros de riesgo (Inflamabilidad, Explosión, Combustibilidad). Omitir datos sin valor preventivo (pH neutro, densidad).
- SECCIÓN 10 (Estabilidad): Literal. Riesgo explosión polvo, reacciones peligrosas en proceso, productos descomposición.
- SECCIÓN 11 (Toxicología): Literal. Vías entrada, efectos graves (Carcinógeno, Mutágeno, STOT), síntomas laborales. Omitir DL50 ratas.
- SECCIÓN 12 (Ecología/Residuos): Literal. Solo gestión residuos peligrosos y prevención exposición personal. Omitir ecotoxicidad pura.
`;
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

        // Trying explicit version alias for stability
        const model = 'gemini-1.5-flash-latest';
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
    const maskedUrl = url.replace(apiKey, 'HIDDEN_KEY');
    return new Response(JSON.stringify({
        error: `Gemini API Error: ${response.status} ${response.statusText}`,
        details: errorText,
        debugUrl: maskedUrl
    }), {
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
