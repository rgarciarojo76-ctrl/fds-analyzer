
export const config = {
    runtime: 'edge', // Critical for bypassing serverless timeouts
};

const SYSTEM_PROMPT = `
Rol: Técnico Superior en Prevención de Riesgos Laborales (PRL).
Tarea: Analiza la Ficha de Datos de Seguridad (FDS).
INSTRUCCIÓN MAESTRA: Extrae y reproduce LITERALMENTE la información relevante para PRL.
1. NO inventes ni interpretes.
2. Mantén la redacción LITERAL de la FDS para los elementos seleccionados.
3. Excluye información sin aplicación directa a PRL.

Requisitos Estrictos:
1. Salida: ÚNICAMENTE un objeto JSON válido.
2. Citas: CADA string extraído DEBE terminar con la referencia de página en la que aparece, formato: "(Ref. Pág. X)".

Reglas Específicas por Sección (CRITERIOS DE SELECCIÓN):
- SECCIÓN 1 (Identificación de la sustancia):
    * Extrae LITERALMENTE: Nombre/Forma, IDs (CAS/CE/REACH/CLP), Usos funcionales, Tlf Emergencia (España), Proveedor (Solo Nombre/País).
    * Excluye: Direcciones completas, emails, webs, datos admin.
- SECCIÓN 4 (Primeros Auxilios):
    * Extrae LITERALMENTE frases sobre actuación inmediata personal no sanitario.
    * Selecciona: Medidas generales, vías de exposición, síntomas, atención médica. "No existen tratamientos" si aplica.
    * Excluye: Redacciones genéricas.
- SECCIÓN 5 (Lucha contra incendios):
    * Extrae LITERALMENTE riesgos graves (explosión), medios extinción, advertencias evacuación.
    * Excluye: Instrucciones bomberos.
- SECCIÓN 6 (Vertido accidental):
    * Extrae LITERALMENTE medidas para trabajador: Riesgos directos, Aislamiento, EPIs, Limpieza segura.
- SECCIÓN 7 (Manipulación y almacenamiento):
    * Extrae LITERALMENTE frases operativas.
    * Clasifica en: 1. Manipulación (polvo/ventilación), 2. Incendios/Explosiones, 3. Higiene, 4. Almacenamiento.
- SECCIÓN 8 (Controles de exposición/EPIs):
    * Extrae LITERALMENTE: VLA-ED/EC (España), Controles técnicos, EPIs (Filtros/Materiales específicos).
    * Excluye: PNEC.
- SECCIÓN 9 (Propiedades físicas y químicas):
    * Extrae LITERALMENTE solo propiedades de riesgo (Combustibilidad, Explosión, P. Inflamación).
- SECCIÓN 10 (Estabilidad y reactividad):
    * Extrae LITERALMENTE riesgos explosión polvo, reacciones peligrosas reales, productos descomposición.
- SECCIÓN 11 (Información toxicológica):
    * Extrae LITERALMENTE vías entrada, efectos graves (Carc/Mut) y síntomas laborales.
    * Excluye: DL50 ratas.
- SECCIÓN 12 (Información ecológica y residuos):
    * Extrae LITERALMENTE medidas manejo residuos y prevención exposición.
    * Excluye: LC50 peces.
    * EXCLUYE: Toxicidad acuática (LC50/EC50), bioacumulación, reciclado complejo.
    * FORMATO: Resumen técnico-preventivo para gestión interna residuos.
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
