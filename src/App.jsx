import React, { useState } from 'react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import AnalysisCard from './components/AnalysisCard';
import { extractTextFromPDF } from './services/pdf';
import { generatePDF } from './services/report';

export default function App() {
    // Authentication is now handled by Gatekeeper wrapper
    const [error, setError] = useState(null);

    const handleFileSelect = async (file) => {
        setIsProcessing(true);
        setProgress(0);
        setError(null);
        try {
            // 1. Extract Text locally
            console.log('Starting extraction...');
            const text = await extractTextFromPDF(file, (percent) => {
                setProgress(Math.round(percent));
            });
            console.log('Extraction complete, length:', text.length);

            // 2. Send to Gemini API
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Error ${response.status}: Error en el servicio de análisis IA`;
                throw new Error(errorMessage);
            }

            // 3. Process Streamed Response from Edge Function
            // The API returns a direct stream of JSON chunks from Google Gemini
            const streamChunks = await response.json();

            let accumulatedText = "";

            if (Array.isArray(streamChunks)) {
                // Iterate over chunks to assemble the full text
                for (const chunk of streamChunks) {
                    if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content) {
                        accumulatedText += chunk.candidates[0].content.parts[0].text || "";
                    }
                }
            } else {
                // Fallback for non-streamed errors or unexpected formats
                throw new Error("Formato de respuesta inválido del servidor (Stream esperado)");
            }

            console.log("Full AI Text Reconstructed:", accumulatedText);

            // 4. Clean and Parse Final JSON
            let cleanJsonString = accumulatedText;
            // Remove Markdown code blocks if present (common in AI responses)
            if (cleanJsonString.trim().startsWith('```')) {
                cleanJsonString = cleanJsonString.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const result = JSON.parse(cleanJsonString);
            console.log('Final Parsed Analysis:', result);
            setData(result);

        } catch (error) {
            console.error(error);
            setError(error.message || 'Ocurrió un error desconocido procesando el archivo.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateCard = (cardKey, newContent) => {
        setData(prev => ({
            ...prev,
            [cardKey]: newContent
        }));
    };

    const handleExport = () => {
        if (!data) return;
        generatePDF(data, data.productName);
    };

    // Card Definitions for mapping
    const cardDefinitions = [
        { key: 'card1', title: '1. Identificación de la Sustancia' },
        { key: 'card2', title: '2. Identificación de Peligros' },
        { key: 'card3', title: '3. Composición/Componentes' },
        { key: 'card4', title: '4. Primeros Auxilios' },
        { key: 'card5', title: '5. Medidas de Lucha contra Incendios' },
        { key: 'card6', title: '6. Medidas en caso de Vertido Accidental' },
        { key: 'card7', title: '7. Manipulación y Almacenamiento' },
        { key: 'card8', title: '8. Controles de Exposición/EPIs' },
        { key: 'card9', title: '9. Propiedades Físico-Químicas' },
        { key: 'card10', title: '10. Estabilidad y Reactividad' },
        { key: 'card11', title: '11. Información Toxicológica' },
        { key: 'card12', title: '12. Información Ecológica y Residuos' },
    ];

    const criticalSections = ['card2', 'card4', 'card8'];

    return (
        <div className="app-container">
            <Header onExport={handleExport} exportDisabled={!data} />

            <main className="container main-content">
                {!data && (
                    <div className="hero-wrapper">
                        {error && (
                            <div className="error-banner">
                                ⚠️ {error}
                            </div>
                        )}
                        <DropZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />
                    </div>
                )}

                {data && (
                    <div className="an-results fade-in">
                        <div className="results-header">
                            <h2>Análisis: {data.productName || 'Producto Desconocido'}</h2>
                            <button className="btn btn-secondary" onClick={() => setData(null)}>
                                Analizar otro archivo
                            </button>
                        </div>

                        <div className="cards-grid">
                            {cardDefinitions.map((def) => (
                                <AnalysisCard
                                    key={def.key}
                                    id={def.key}
                                    title={def.title}
                                    content={data[def.key]}
                                    isCritical={criticalSections.includes(def.key)}
                                    onUpdate={handleUpdateCard}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <style>{`
        .app-container {
          min-height: 100vh;
        }
        
        .main-content {
          padding-top: 2rem;
          padding-bottom: 4rem;
        }

        .hero-wrapper {
          min-height: calc(100vh - 160px); /* Adjust for header + padding */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 0;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
        }

        .results-header h2 {
          color: var(--color-primary);
          margin: 0;
        }

        .btn-secondary {
           background: transparent;
           border: 1px solid var(--color-border);
           color: var(--color-text);
        }
        .btn-secondary:hover {
           background: #eee;
        }

        .error-banner {
            background-color: #fee2e2;
            color: #991b1b;
            padding: 1rem;
            border-radius: var(--radius-md);
            margin-bottom: 1rem;
            border: 1px solid #f87171;
            max-width: 600px;
            width: 100%;
            text-align: center;
            font-weight: 500;
        }
      `}</style>
        </div>
    );
}
