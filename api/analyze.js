export const config = {
    runtime: 'edge', // Using Edge for potentially longer timeouts or streaming if needed, though extracting text is done client side.
};

const SYSTEM_PROMPT = `
Rol: Eres un experto Técnico en Seguridad Química y PRL (Prevención de Riesgos Laborales).
Tarea: Analiza la Ficha de Datos de Seguridad (FDS) adjunta y extrae la información para las 12 secciones siguientes.
Formato: JSON puro. Si no hay información, devuelve ['No especificado'].
Estilo: Técnico, directo, sin frases introductorias. Cita la página de referencia si es posible (Ref. Pág X).
Obligatorio: Busca siempre el Nombre del Producto.

Estructura JSON requerida:
{
  "productName": "Nombre del producto",
  "card1": ["Identificación..."],
  "card2": ["Clasificación..."],
  "card3": ["Composición..."],
  "card4": ["Primeros Auxilios..."],
  "card5": ["Incendios..."],
  "card6": ["Vertido Accidental..."],
  "card7": ["Manipulación y Almacenamiento..."],
  "card8": ["Exposición/EPIs..."],
  "card9": ["Propiedades Físico-Químicas..."],
  "card10": ["Estabilidad y Reactividad..."],
  "card11": ["Toxicología..."],
  "card12": ["Residuos..."]
}

Mapeo de tarjetas:
card1: Identificación (Sustancia, proveedor, usos, teléfono emergencia).
card2: Clasificación (CLP, Peligros, frases H/P).
card3: Composición (Sustancias peligrosas, concentraciones).
card4: Primeros Auxilios (Inhalación, piel, ojos, ingestión).
card5: Incendios (Medios extinción, peligros específicos).
card6: Vertido Accidental (Precauciones, métodos limpieza).
card7: Manipulación y Almacenamiento (Condiciones, incompatibilidades).
card8: Exposición/EPIs (Límites, equipos protección).
card9: Propiedades Físico-Químicas (Estado, pH, inflamación, densidad, etc).
card10: Estabilidad y Reactividad (Reactividad, condiciones a evitar).
card11: Toxicología (Efectos agudos/crónicos).
card12: Residuos (Eliminación, códigos LER).
`;

export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { text } = await request.json();

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Completar configuración de API Key' }), {
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
                        { text: `Aquí está el contenido extraído de la FDS:\n\n${text}` }
                    ]
                }
            ],
            generationConfig: {
                response_mime_type: "application/json"
            }
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error("No se generó respuesta");
        }

        // Attempt to parse just to be sure we are valid json before sending back
        // (Although response_mime_type should handle it)
        const jsonResponse = JSON.parse(generatedText);

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
