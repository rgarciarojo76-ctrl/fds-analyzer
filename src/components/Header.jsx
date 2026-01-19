import React from 'react';
import { Download, AlertTriangle } from 'lucide-react';

export default function Header({ onExport, exportDisabled }) {
  return (
    <header className="app-header">
      <div className="container header-content">
        {/* Sección Izquierda: Branding */}
        <div className="branding-section">
          <div className="logo-container">
            <img
              src="/logo-direccion-tecnica.jpg"
              alt="Dirección Técnica"
              className="logo-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback code if image is missing */}
            <div className="logo-placeholder" style={{ display: 'none' }}>DT</div>
          </div>

          <div className="branding-separator"></div>

          <div className="branding-text">
            <h1 className="main-title">DIRECCIÓN TÉCNICA IA LAB</h1>
            <p className="sub-title">App: Análisis FDS</p>
          </div>
        </div>

        {/* Sección Central: Avisos */}
        <div className="status-section">
          <div className="status-badge">
            Estado: Piloto interno
          </div>
          <div className="status-disclaimer">
            <AlertTriangle size={18} className="disclaimer-icon" />
            <div className="disclaimer-content">
              <span className="disclaimer-title">AVISO:</span>
              <span className="disclaimer-body">
                Apoyo técnico (no sustitutivo del criterio profesional). La información debe ser validada.
              </span>
            </div>
          </div>
        </div>

        {/* Sección Derecha: Acciones (Exportar) */}
        <div className="actions-section">
          <button
            className="btn btn-primary"
            onClick={onExport}
            disabled={exportDisabled}
            style={{ opacity: exportDisabled ? 0 : 1, transition: 'opacity 0.2s' }}
          >
            <Download size={18} />
            Exportar PDF
          </button>
        </div>
      </div>

      <style>{`
        .app-header {
          background-color: var(--color-white);
          border-bottom: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 0;
          z-index: 100;
          height: 90px;
          display: flex;
          align-items: center;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          height: 100%;
        }

        /* Branding Section */
        .branding-section {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .logo-img {
          height: 50px;
          width: auto;
          object-fit: contain;
        }

        .logo-placeholder {
          width: 50px;
          height: 50px;
          background: var(--color-primary);
          color: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .branding-separator {
          width: 1px;
          height: 40px;
          background-color: var(--color-border);
          margin: 0 1.5rem;
        }

        .branding-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .main-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--color-primary);
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .sub-title {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin: 0;
          line-height: 1.2;
        }

        /* Avisos Section -> Status Section */
        .status-section {
          display: flex;
          flex-direction: row; /* User requested row alignment */
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .status-badge {
          background-color: var(--color-primary-light);
          border: 1px solid var(--color-primary-border);
          color: var(--color-primary);
          font-size: 0.75rem;
          padding: 2px 12px;
          border-radius: 999px;
          font-weight: 600;
          display: inline-block;
          white-space: nowrap; /* Prevent badge wrapping */
        }
        
        /* Removed disclaimer-text style as it is replaced by global status-disclaimer */

        /* Actions Section */
        .actions-section {
          min-width: 140px;
          display: flex;
          justify-content: flex-end;
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .app-header {
            height: auto;
            padding: 0.75rem 0;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .branding-section {
            width: 100%;
            justify-content: center;
          }
          
          .branding-separator {
             margin: 0 1rem;
             height: 30px;
          }

          .branding-text {
            text-align: left;
          }

          .main-title {
            font-size: 1rem;
          }
          
          .sub-title {
            font-size: 0.65rem;
          }

          .status-section {
            width: 100%;
            flex-direction: column; /* Stack on mobile */
            text-align: center;
            border-top: 1px dashed var(--color-border);
            border-bottom: 1px dashed var(--color-border);
            padding: 0.5rem 0;
            gap: 0.75rem;
          }

          .actions-section {
            width: 100%;
            justify-content: center;
          }
          
          .btn {
            width: 100%;
          }
        }
      `}</style>
    </header>
  );
}
