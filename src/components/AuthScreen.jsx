import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function AuthScreen({ onAuthenticated }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const secret = import.meta.env.VITE_SHARED_SECRET || 'secret'; // Fallback if env not set in dev
        if (password === secret) {
            onAuthenticated();
        } else {
            setError(true);
            setPassword('');
        }
    };

    return (
        <div className="auth-overlay">
            <div className="auth-card">
                <div className="auth-icon">
                    <Lock size={32} color="var(--color-primary)" />
                </div>
                <h2>Acceso Restringido</h2>
                <p>Introduce la contraseña para acceder al analizador de FDS.</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <input
                        type="password"
                        placeholder="Contraseña..."
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError(false);
                        }}
                        className="auth-input"
                        autoFocus
                    />
                    {error && <span className="auth-error">Contraseña incorrecta</span>}
                    <button type="submit" className="btn btn-primary auth-submit">
                        Entrar
                    </button>
                </form>
            </div>

            <style>{`
        .auth-overlay {
          position: fixed;
          inset: 0;
          background-color: #f5f7fa;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .auth-card {
          background: white;
          padding: 3rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-width: 400px;
          text-align: center;
        }

        .auth-icon {
          background: #f0f9ff;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .auth-card h2 {
          color: var(--color-text);
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .auth-card p {
          color: var(--color-text-light);
          margin-bottom: 2rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .auth-input {
          padding: 0.8rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .auth-input:focus {
          border-color: var(--color-primary);
        }

        .auth-error {
          color: var(--color-danger);
          font-size: 0.875rem;
          margin-top: -0.5rem;
        }

        .auth-submit {
          width: 100%;
        }
      `}</style>
        </div>
    );
}
