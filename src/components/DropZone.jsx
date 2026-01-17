import React, { useCallback, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';

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
        <div className="hero-section">
            <div
                className={`drop-zone ${dragActive ? 'active' : ''} ${isProcessing ? 'disabled' : ''}`}
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

                <div className="drop-content">
                    {isProcessing ? (
                        <>
                            <div className="spinner">
                                <Loader2 size={48} className="spin-icon" />
                            </div>
                            <h3>Analizando FDS...</h3>
                            <p>Extrayendo texto y consultando a Gemini AI</p>
                        </>
                    ) : (
                        <>
                            <div className="icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <h3>Arrastra tu Ficha de Datos de Seguridad</h3>
                            <p>o haz clic para seleccionar (PDF)</p>
                            <label htmlFor="file-upload" className="btn btn-primary">
                                Seleccionar Archivo
                            </label>
                        </>
                    )}
                </div>
            </div>

            <style>{`
        .hero-section {
          padding: 4rem 1rem;
          display: flex;
          justify-content: center;
        }

        .drop-zone {
          width: 100%;
          max-width: 600px;
          height: 300px;
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-white);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.2s;
        }

        .drop-zone.active {
          border-color: var(--color-primary);
          background: #f0f9ff;
          transform: scale(1.02);
        }
        
        .drop-zone.disabled {
          pointer-events: none;
          opacity: 0.9;
        }

        #file-upload {
          display: none;
        }

        .drop-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .icon-wrapper {
          width: 64px;
          height: 64px;
          background: #f5f7fa;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
        }

        .drop-zone h3 {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .drop-zone p {
          color: var(--color-text-light);
          margin-bottom: 0.5rem;
        }

        .spin-icon {
          animation: spin 2s linear infinite;
          color: var(--color-primary);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
