import React from 'react';
import { Download } from 'lucide-react';

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
            <p className="sub-title">App: Análisis de Manuales – Riesgos PRL</p>
          </div>
        </div>

        {/* Sección Central: Avisos */}
        <div className="avisos-section">
          <div className="status-badge">
            Estado: Piloto interno
          </div>
          <p className="disclaimer-text">
            AVISO: Apoyo técnico (no sustitutivo del criterio profesional). La información debe ser validada.
          </p>
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

        /* Avisos Section */
        .avisos-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
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
        }

        .disclaimer-text {
          color: var(--color-warning-text);
          font-size: 0.7rem;
          margin: 0;
          font-weight: 500;
        }

        /* Actions Section */
        .actions-section {
          min-width: 140px;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </header>
  );
}
