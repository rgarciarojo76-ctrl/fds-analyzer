export const config = {
    runtime: 'edge', // Using Edge for potentially longer timeouts or streaming if needed
};

// Prompt de Sistema Definido por el Usuario (Técnico PRL)
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

        // Validación básica de entrada
        if (!text || text.length < 50) {
            return new Response(JSON.stringify({ error: 'El texto extraído es demasiado corto o inválido.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Configuración del servidor incompleta: Falta API Key' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: SYSTEM_PROMPT },
                        { text: `-- INICIO DE DOCUMENTO FDS --\n${text}\n-- FIN DE DOCUMENTO FDS --` }
                    ]
                }
            ],
            generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.2, // Baja temperatura para ser más determinista y técnico
            }
        };

        // Llamada a la API REST de Google Gemini (Flash por defecto por velocidad/coste, o Pro si se requiere mayor razonamiento)
        // Usamos gemini-1.5-flash-latest para rapidez en demos, cambiar a pro si es necesario.
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Error de Google AI: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error("La IA no generó respuesta válida.");
        }

        // Limpieza de Markdown si la IA ignora la instrucción de JSON puro (backup safety)
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
            throw new Error("La respuesta de la IA no tiene un formato válido.");
        }

        return new Response(JSON.stringify(jsonResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
