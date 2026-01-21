import { Loader2, FileText, Terminal } from 'lucide-react';
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

    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileSelection = (file) => {
        setError(null);
        setSelectedFile(file);
        addLog(`Archivo seleccionado: ${file.name} (${file.type})`);
    };

    const startAnalysis = async () => {
        if (!selectedFile) return;

        const file = selectedFile;
        setIsProcessing(true);
        setError(null);
        clearLogs();
        addLog("Iniciando análisis manual...");

        try {
            // 1. Extract Text locally
            addLog('Llamando a extractTextFromPDF con Worker CDN...');
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
                let errorMsg = errorData.error || `Error ${response.status}: Error en el servicio de análisis IA`;

                // Append detailed error info if available using the logs
                if (errorData.details) {
                    addLog(`[API DETALLES]: ${typeof errorData.details === 'object' ? JSON.stringify(errorData.details) : errorData.details}`);
                    // errorMsg += ` (${errorData.details})`; // Keep the UI clean, rely on debug log
                }

                if (errorData.debugUrl) {
                    addLog(`[DEBUG URL]: ${errorData.debugUrl}`);
                }

                if (errorData.availableModels) {
                    addLog(`[MODELOS DISPONIBLES]: ${JSON.stringify(errorData.availableModels, null, 2)}`);
                }

                throw new Error(errorMsg);
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
            setSelectedFile(null); // Reset selection

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
        generatePDF(data);
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
                        {error && (
                            <div className="error-banner">
                                ⚠️ {error}
                            </div>
                        )}

                        {!selectedFile ? (
                            <DropZone onFileSelect={handleFileSelection} isProcessing={isProcessing} />
                        ) : (
                            <div className="file-confirmation fade-in">
                                <div className="file-icon-wrapper">
                                    <FileText size={40} className="text-primary" />
                                </div>

                                <div className="file-details">
                                    <span className="file-status-label">Documento preparado</span>
                                    <h3 className="file-name">{selectedFile.name}</h3>
                                    <p className="file-size">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                                    </p>
                                </div>

                                <div className="action-buttons">
                                    <button
                                        className="btn btn-primary btn-large btn-glow"
                                        onClick={startAnalysis}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="spin-icon" size={20} /> ANALIZANDO...
                                            </>
                                        ) : (
                                            "INICIAR ANÁLISIS"
                                        )}
                                    </button>

                                    <button
                                        className="btn btn-text-subtle"
                                        onClick={() => setSelectedFile(null)}
                                        disabled={isProcessing}
                                    >
                                        Cancelar operación
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* DEBUG LOG SECTION - TERMINAL STYLE */}
                        <div className="debug-log-terminal">
                            <div className="terminal-header">
                                <div className="terminal-title">
                                    <Terminal size={12} strokeWidth={3} />
                                    <span>SYSTEM_DIAGNOSTICS</span>
                                </div>
                                <div className="terminal-controls">
                                    <span className="dot red"></span>
                                    <span className="dot yellow"></span>
                                    <span className="dot green"></span>
                                </div>
                            </div>
                            <div className="log-entries-terminal custom-scrollbar">
                                {debugLogs.length === 0 ? (
                                    <span className="log-line text-muted">{'>'} System ready. Waiting for input...</span>
                                ) : (
                                    debugLogs.map((log, idx) => (
                                        <div key={idx} className="log-line">
                                            <span className="log-time">[{log.split(' - ')[0]}]</span>
                                            <span className="log-msg">{log.split(' - ').slice(1).join(' - ')}</span>
                                        </div>
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
                                    productName={data.productName}
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

        .debug-log-terminal {
            margin-top: 3rem;
            width: 100%;
            max-width: 600px;
            background: #1e1e1e;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            overflow: hidden;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 0.75rem;
            border: 1px solid #333;
        }

        .terminal-header {
            background: #2d2d2d;
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #333;
        }

        .terminal-title {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #888;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .terminal-controls {
            display: flex;
            gap: 6px;
        }

        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        .dot.red { background: #ff5f56; }
        .dot.yellow { background: #ffbd2e; }
        .dot.green { background: #27c93f; }

        .log-entries-terminal {
            height: 200px;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .log-line {
            line-height: 1.4;
            color: #d4d4d4;
            display: flex;
            gap: 8px;
        }

        .log-time {
            color: #569cd6;
            min-width: 70px;
        }

        .log-msg {
            color: #ce9178;
        }

        /* PREMIUM FILE CARD */
        .file-confirmation {
            background: white;
            padding: 2.5rem 3rem;
            text-align: center;
            max-width: 480px;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03);
            border-radius: 24px;
        }

        .file-icon-wrapper {
            background: #f0f9ff;
            width: 80px;
            height: 80px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            color: var(--color-primary);
        }

        .file-status-label {
            display: block;
            text-transform: uppercase;
            font-size: 0.7rem;
            letter-spacing: 1px;
            font-weight: 700;
            color: #a0a0a0;
            margin-bottom: 0.5rem;
        }

        .file-name {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 0.5rem 0;
            line-height: 1.3;
            max-width: 300px;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
        }

        .file-size {
            font-size: 0.85rem;
            color: #666;
            margin: 0;
            font-weight: 500;
        }

        .action-buttons {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 100%;
            margin-top: 2rem;
        }

        .btn-large {
            padding: 0.9rem;
            font-size: 0.95rem;
            letter-spacing: 0.5px;
            font-weight: 600;
            border-radius: 12px;
            text-transform: uppercase;
        }
        
        .btn-glow {
            box-shadow: 0 4px 14px 0 rgba(0, 118, 255, 0.39);
            transition: all 0.2s ease;
        }
        
        .btn-glow:hover {
            box-shadow: 0 6px 20px rgba(0, 118, 255, 0.23);
            transform: translateY(-1px);
        }

        .btn-text-subtle {
            background: none;
            border: none;
            color: #888;
            font-size: 0.85rem;
            cursor: pointer;
            transition: color 0.2s;
        }
        
        .btn-text-subtle:hover {
            color: #333;
        }

        /* SCROLLBAR FOR TERMINAL */
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #1e1e1e; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #444; 
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555; 
        }
      `
                `}</style>
        </div>
    );
}
