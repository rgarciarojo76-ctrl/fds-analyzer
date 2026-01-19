import React, { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function DropZone({ onFileSelect, isProcessing }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        onFileSelect(file);
      } else {
        alert("Por favor, sube solo archivos PDF.");
      }
    }
  }, [onFileSelect]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="landing-container glass-panel">
      {/* Headers del Panel */}
      <h1 className="landing-title">
        Análisis Ficha de Datos de Seguridad de Productos Químicos
      </h1>
      <h3 className="landing-subtitle">
        Asistente virtual para la extracción y análisis de información preventiva en fichas de datos de seguridad
      </h3>
      <p className="landing-description">
        Este sistema utiliza Inteligencia Artificial para procesar la Ficha de Datos de Seguridad,
        identificando automáticamente factores de riesgo, medidas de seguridad, EPIs obligatorios
        y procedimientos de emergencia según la normativa vigente.
      </p>

      {/* Zona de Carga (Drag & Drop) */}
      <div
        className={`upload-zone ${dragActive ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          accept=".pdf"
          onChange={handleChange}
          disabled={isProcessing}
        />

        <div className="upload-content">
          {isProcessing ? (
            <div className="processing-state">
              <Loader2 size={40} className="spin-icon text-primary" />
              <h3 className="processing-title">Analizando documento con Gemini...</h3>
              <p className="processing-subtitle">Extrayendo texto y procesando riesgos...</p>
            </div>
          ) : (
            <div className="idle-state">
              <div className="file-icon">📄</div>
              <h3 className="zone-title">Análisis Automático de Manuales (IA)</h3>
              <p className="zone-instruction">Arrastra tu PDF aquí o usa el botón para buscarlo.</p>

              <label htmlFor="file-upload" className="btn btn-action">
                Subir Manual de Instrucciones (PDF)
              </label>
            </div>
          )}
        </div>
      </div>

      <style>{`
                .landing-container {
                    padding: 3rem 2rem;
                    max-width: 800px;
                    width: 100%;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                }

                .landing-title {
                    color: var(--color-primary);
                    font-size: 2rem;
                    font-weight: 700;
                    line-height: 1.2;
                    max-width: 90%;
                }

                .landing-subtitle {
                    color: var(--color-text);
                    font-size: 1.1rem;
                    font-weight: 500;
                    margin-top: -0.5rem;
                }

                .landing-description {
                    color: var(--color-text-secondary);
                    font-size: 0.95rem;
                    max-width: 80%;
                    line-height: 1.6;
                    margin-bottom: 1rem;
                }

                /* Zona de Carga */
                .upload-zone {
                    width: 100%;
                    max-width: 600px;
                    min-height: 300px;
                    background-color: #f8fbff;
                    border: 2px dashed var(--color-border-dashed);
                    border-radius: var(--radius-lg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .upload-zone.active {
                    border-color: var(--color-primary);
                    background-color: #f0f9ff;
                    transform: scale(1.01);
                }
                
                .upload-zone.processing {
                    border: none;
                    background: transparent;
                }

                #file-upload {
                    display: none;
                }

                .upload-content {
                    width: 100%;
                    padding: 2rem;
                }

                /* Estado Idle */
                .idle-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                .file-icon {
                    font-size: 2.5rem;
                    opacity: 0.5;
                    margin-bottom: 0.5rem;
                }

                .zone-title {
                    color: var(--color-primary);
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin: 0;
                }

                .zone-instruction {
                    color: var(--color-text-secondary);
                    margin: 0;
                    font-size: 0.95rem;
                }

                .btn-action {
                    margin-top: 1rem;
                    background-color: var(--color-white);
                    border: 1px solid var(--color-primary);
                    color: var(--color-primary);
                    font-weight: 700;
                    padding: 0.8rem 1.5rem;
                }

                .btn-action:hover {
                    background-color: #eff6ff;
                }

                /* Estado Processing */
                .processing-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                .processing-title {
                    color: var(--color-primary); /* Azul */
                    font-size: 1.25rem;
                    font-weight: 600;
                    animation: pulse 2s infinite;
                }

                .processing-subtitle {
                    color: var(--color-text-secondary);
                }

                .spin-icon {
                    animation: spin 2s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }
            `}</style>
    </div>
  );
}
