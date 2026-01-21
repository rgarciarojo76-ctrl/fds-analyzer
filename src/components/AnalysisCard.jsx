import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Edit2, Save } from 'lucide-react';
import { generatePDF } from '../services/report'; // Import PDF service

export default function AnalysisCard({ id, title, content, isCritical, onUpdate, productName }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleSave = () => {
    onUpdate(id, editContent);
    setIsEditing(false);
  };

  const handleCopy = () => {
    const textToCopy = Array.isArray(content) ? `${title}\n${content.join('\n')}` : `${title}\n${content}`;
    navigator.clipboard.writeText(textToCopy)
      .then(() => alert('Contenido copiado al portapapeles'))
      .catch(err => console.error('Error al copiar:', err));
  };

  const handlePDF = () => {
    // Generate PDF for this single section
    const sectionData = {
      title: title,
      data: { content: content } // Structure expected by report.js mapping
    };
    generatePDF({ productName }, [sectionData]);
  };

  const renderContent = (data) => {
    if (Array.isArray(data)) {
      return (
        <ul className="content-list">
          {data.map((item, idx) => <li key={idx}>{item}</li>)}
        </ul>
      );
    }
    return <p className="content-text">{data}</p>;
  };

  return (
    <div className={`analysis-card ${isCritical ? 'critical' : ''} fade-in`}>
      <div className="card-header">
        <div className="header-left">
          {isCritical ?
            <AlertTriangle size={20} className="icon-critical" /> :
            <CheckCircle size={20} className="icon-normal" />
          }
          <h4>{title}</h4>
        </div>
        <button
          className="icon-btn"
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          title={isEditing ? "Guardar" : "Editar"}
        >
          {isEditing ? <Save size={18} /> : <Edit2 size={16} />}
        </button>
      </div>

      <div className="card-body">
        {isEditing ? (
          <textarea
            className="edit-area"
            value={Array.isArray(editContent) ? editContent.join('\n') : editContent}
            onChange={(e) => {
              // Simple split by newline for list behavior emulation in textarea
              const val = e.target.value;
              setEditContent(val.split('\n'));
            }}
            rows={6}
          />
        ) : (
          renderContent(editContent)
        )}
      </div>

      <div className="assess-actions">
        <button className="assess-btn" onClick={handleCopy}>Copiar</button>
        <button className="assess-btn" onClick={handlePDF}>PDF Indiv.</button>
      </div>

      <style>{`
        .analysis-card {
          background: white;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .analysis-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .analysis-card.critical {
          border-top: 4px solid var(--color-danger);
        }
        
        .analysis-card:not(.critical) {
           border-top: 4px solid var(--color-primary);
        }

        .card-header {
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #fcfcfc;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-left h4 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .icon-critical {
          color: var(--color-danger);
        }

        .icon-normal {
          color: var(--color-primary);
        }

        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-light);
          padding: 4px;
          border-radius: 4px;
        }

        .icon-btn:hover {
          background-color: #eee;
          color: var(--color-primary);
        }

        .card-body {
          padding: 1rem;
          font-size: 0.9rem;
          color: var(--color-text);
          flex-grow: 1;
        }
        
        /* Actions Footer */
        .assess-actions {
            padding: 0 1rem 1rem 1rem;
            display: flex;
            gap: 0.5rem;
            justify-content: flex-start;
        }

        .assess-btn {
            background: white;
            border: 1px solid var(--color-border);
            color: var(--color-text-secondary);
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .assess-btn:hover {
            border-color: var(--color-primary);
            color: var(--color-primary);
            background: #fafafa;
        }

        .content-list {
          padding-left: 1.25rem;
          margin: 0;
        }
        
        .content-list li {
          margin-bottom: 0.4rem;
        }

        .edit-area {
          width: 100%;
          border: 1px solid var(--color-primary);
          border-radius: var(--radius-sm);
          padding: 0.5rem;
          font-family: inherit;
          font-size: inherit;
          resize: vertical;
          outline: none;
          min-height: 150px;
        }
      `}</style>
    </div>
  );
}
