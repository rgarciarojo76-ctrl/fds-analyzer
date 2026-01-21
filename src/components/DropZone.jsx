import React, { useCallback, useState } from 'react';
import { Loader2, CloudUpload, FileText } from 'lucide-react';

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
        console.warn("Intento de subir archivo no PDF");
        // alert("Por favor, sube solo archivos PDF."); // Removed legacy alert
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
        <span className="gradient-text">FDS Analyzer</span>
        <span className="subtitle-block">Gestión Inteligente de Seguridad Química</span>
      </h1>
      <p className="landing-description">
        Tu asistente experto en normativa y prevención. Arrastra tu documento para un análisis instantáneo de riesgos y medidas preventivas.
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
              <Loader2 size={48} className="spin-icon text-primary" />
              <h3 className="processing-title">Analizando Documento...</h3>
              <p className="processing-subtitle">Nuestra IA está extrayendo datos críticos</p>
            </div>
          ) : (
            <div className="idle-state">
              <div className="icon-wrapper">
                <CloudUpload size={40} className="text-gradient" />
              </div>
              <h3 className="zone-title">Sube tu Ficha de Seguridad</h3>
              <p className="zone-instruction">Arrastra tu PDF aquí o haz clic para explorar</p>

              <label htmlFor="file-upload" className="btn btn-action">
                Seleccionar Archivo (PDF)
              </label>
            </div>
          )}
        </div>
      </div>

      <style>{`
                .landing-container {
                    padding: 4rem 2rem;
                    max-width: 900px;
                    width: 100%;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2rem;
                }

                .landing-title {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    line-height: 1.1;
                    margin-bottom: 1rem;
                }

                .gradient-text {
                    font-size: 3.5rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, var(--color-primary) 0%, #3b82f6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -1px;
                }

                .subtitle-block {
                    font-size: 1.5rem;
                    color: var(--color-text);
                    font-weight: 500;
                    letter-spacing: -0.5px;
                }

                .landing-description {
                    color: var(--color-text-secondary);
                    font-size: 1.1rem;
                    max-width: 600px;
                    line-height: 1.6;
                    margin-bottom: 1rem;
                }

                /* Zona de Carga Premium */
                .upload-zone {
                    width: 100%;
                    max-width: 640px;
                    min-height: 360px;
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    border: 2px dashed rgba(0, 0, 0, 0.1);
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.1);
                }

                .upload-zone:hover {
                    border-color: var(--color-primary);
                    background: rgba(255, 255, 255, 0.95);
                    transform: translateY(-4px);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
                }

                .upload-zone.active {
                    border-color: var(--color-primary);
                    background: #f0f9ff;
                    transform: scale(1.02);
                }
                
                .upload-zone.processing {
                    border-style: solid;
                    border-color: transparent;
                }

                #file-upload {
                    display: none;
                }

                .upload-content {
                    width: 100%;
                    padding: 3rem;
                }

                /* Estado Idle */
                .idle-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.25rem;
                }

                .icon-wrapper {
                   background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
                   width: 80px;
                   height: 80px;
                   border-radius: 24px;
                   display: flex;
                   align-items: center;
                   justify-content: center;
                   margin-bottom: 0.5rem;
                   color: var(--color-primary);
                }

                .zone-title {
                    color: var(--color-text);
                    font-weight: 700;
                    font-size: 1.25rem;
                    margin: 0;
                }

                .zone-instruction {
                    color: var(--color-text-secondary);
                    margin: 0;
                    font-size: 1rem;
                }

                .btn-action {
                    background: var(--color-primary);
                    color: white;
                    font-weight: 600;
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 14px 0 rgba(0, 118, 255, 0.39);
                    transition: all 0.2s ease;
                    cursor: pointer;
                    margin-top: 1rem;
                }

                .btn-action:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 118, 255, 0.23);
                    background: #0060df; /* Darker Blue */
                }

                /* Estado Processing */
                .processing-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                }

                .processing-title {
                    color: var(--color-primary);
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                .processing-subtitle {
                    color: var(--color-text-secondary);
                    font-size: 1.1rem;
                }

                .spin-icon {
                    animation: spin 3s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Mobile Responsiveness */
                @media (max-width: 768px) {
                    .landing-container {
                        padding: 2rem 1rem;
                    }

                    .gradient-text {
                        font-size: 2.5rem;
                    }
                    
                    .subtitle-block {
                        font-size: 1.1rem;
                    }

                    .upload-zone {
                        min-height: 280px;
                    }

                    .upload-content {
                        padding: 1.5rem;
                    }
                    
                    .btn-action {
                        width: 100%;
                        text-align: center;
                    }
                }
            `}</style>
    </div>
  );
}
