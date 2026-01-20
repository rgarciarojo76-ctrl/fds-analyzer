import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import AnalysisCard from './components/AnalysisCard';
import { extractTextFromPDF } from './services/pdf';
import { generatePDF } from './services/report';

export default function App() {
    // Authentication is now handled by Gatekeeper wrapper
    const [isProcessing, setIsProcessing] = useState(false); // Restore state
    const [progress, setProgress] = useState(0); // Restore state
    const [data, setData] = useState(null); // Restore state 
    const [error, setError] = useState(null);
    const [debugLogs, setDebugLogs] = useState([]);

    // Load logs from session storage on mount
    useEffect(() => {
        const savedLogs = sessionStorage.getItem('fds_debug_logs');
        if (savedLogs) {
            try {
                setDebugLogs(JSON.parse(savedLogs));
            } catch (e) {
                console.error("Error parsing saved logs", e);
            }
        }

        // PREVENT DEFAULT BROWSER DRAG/DROP BEHAVIOR GLOBALLY
        const preventDefault = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        window.addEventListener('dragover', preventDefault);
        window.addEventListener('drop', preventDefault);

        return () => {
            window.removeEventListener('dragover', preventDefault);
            window.removeEventListener('drop', preventDefault);
        };
    }, []);

    const addLog = (msg) => {
        const timestampedMsg = `${new Date().toLocaleTimeString()} - ${msg}`;
        setDebugLogs(prev => {
            const newLogs = [...prev, timestampedMsg];
            sessionStorage.setItem('fds_debug_logs', JSON.stringify(newLogs));
            return newLogs;
        });
    };

    const clearLogs = () => {
        setDebugLogs([]);
        sessionStorage.removeItem('fds_debug_logs');
    };

    const handleFileSelect = async (file) => {
        setIsProcessing(true);
        setProgress(0);
        setError(null);
        setError(null);
        clearLogs(); // Clear logs on new attempt
        addLog("Iniciando proceso de carga...");

        try {
            // 1. Extract Text locally
            addLog('Llamando a extractTextFromPDF...');
            const text = await extractTextFromPDF(file, (percent) => {
                setProgress(Math.round(percent));
            }, addLog); // Pass log function provided to PDF service

            addLog(`Extracción local completada. Longitud texto: ${text.length}`);

            // 2. Send to Gemini API
            addLog('Enviando texto a API Gemini...');
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
            addLog('Recibiendo respuesta en streaming...');
            const streamChunks = await response.json();

            let accumulatedText = "";

            if (Array.isArray(streamChunks)) {
                for (const chunk of streamChunks) {
                    if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content) {
                        accumulatedText += chunk.candidates[0].content.parts[0].text || "";
                    }
                }
            } else {
                throw new Error("Formato de respuesta inválido del servidor (Stream esperado)");
            }

            addLog("Respuesta IA recibida completamente.");

            // 4. Clean and Parse Final JSON
            let cleanJsonString = accumulatedText;
            if (cleanJsonString.trim().startsWith('```')) {
                cleanJsonString = cleanJsonString.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            addLog("Parseando JSON...");
            const result = JSON.parse(cleanJsonString);
            addLog("Análisis completado con éxito.");
            setData(result);

        } catch (error) {
            console.error(error);
            addLog(`ERROR CAPTURADO: ${error.message}`);
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
                {/* Error Banner moved outside conditional rendering for visibility */}
                {error && (
                    <div className="container error-container">
                        <div className="error-banner">
                            ⚠️ {error}
                        </div>
                    </div>
                )}

                {!data && (
                    <div className="hero-wrapper">
                        <DropZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />

                        {/* DEBUG LOG SECTION */}
                        <div className="debug-log">
                            <h4>Registro de Actividad (Debug)</h4>
                            <div className="log-entries">
                                {debugLogs.length === 0 ? (
                                    <span className="text-muted">Esperando acción...</span>
                                ) : (
                                    debugLogs.map((log, idx) => (
                                        <div key={idx} className="log-entry">{log}</div>
                                    ))
                                )}
                            </div>
                        </div>
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

        .error-container {
            display: flex;
            justify-content: center;
            margin-bottom: 1rem;
        }

        .debug-log {
            margin-top: 2rem;
            width: 100%;
            max-width: 600px;
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: var(--radius-md);
            padding: 1rem;
            font-family: monospace;
            font-size: 0.85rem;
        }
        
        .debug-log h4 {
            margin-top: 0;
            margin-bottom: 0.5rem;
            color: var(--color-text-secondary);
        }

        .log-entries {
            max-height: 200px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .log-entry {
            border-bottom: 1px solid #eee;
            padding-bottom: 2px;
        }
      `}</style>
        </div>
    );
}
