import React from 'react';
import { Download, FileText } from 'lucide-react';

export default function Header({ onExport, exportDisabled }) {
    return (
        <header className="app-header">
            <div className="container header-content">
                <div className="logo-section">
                    <div className="logo-icon">
                        <FileText size={24} color="#fff" />
                    </div>
                    <h1 className="logo-text">Dirección Técnica IA LAB</h1>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={onExport}
                    disabled={exportDisabled}
                >
                    <Download size={18} />
                    Exportar PDF
                </button>
            </div>

            <style>{`
        .app-header {
          background-color: var(--color-white);
          border-bottom: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 0;
          z-index: 100;
          height: 70px;
          display: flex;
          align-items: center;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background-color: var(--color-primary);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: -0.5px;
        }
      `}</style>
        </header>
    );
}
