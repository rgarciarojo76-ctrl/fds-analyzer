import React, { useEffect, useState } from 'react';

const SHARED_SECRET = import.meta.env.VITE_SHARED_SECRET;

const Gatekeeper = ({ children }) => {
    const [accessGranted, setAccessGranted] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verifyToken = async () => {
            // Development bypass or if secret is missing
            if (!SHARED_SECRET) {
                console.error("Falta VITE_SHARED_SECRET");
                setError("Error de Configuración de Seguridad");
                return;
            }

            const params = new URLSearchParams(window.location.search);
            const timestamp = params.get('t');
            const signature = params.get('h');

            if (!timestamp || !signature) {
                // Redirect to portal if no params
                window.location.href = 'https://direccion-tecnica-ia-lab.vercel.app';
                return;
            }

            const now = Date.now();
            const timeDiff = now - parseInt(timestamp);

            // Time window: 60s past or 5s future drift
            if (timeDiff > 60000 || timeDiff < -5000) {
                setError("⛔ Enlace Caducado. Vuelve al Portal.");
                return;
            }

            try {
                const encoder = new TextEncoder();
                const key = await crypto.subtle.importKey(
                    'raw',
                    encoder.encode(SHARED_SECRET),
                    { name: 'HMAC', hash: 'SHA-256' },
                    false,
                    ['verify']
                );

                const verified = await crypto.subtle.verify(
                    'HMAC',
                    key,
                    hexToBuf(signature),
                    encoder.encode(timestamp)
                );

                if (verified) {
                    setAccessGranted(true);
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                } else {
                    setError("⛔ Acceso Denegado: Firma Inválida.");
                }
            } catch (e) {
                console.error(e);
                setError("Error de Verificación.");
            }
        };

        function hexToBuf(hex) {
            const bytes = new Uint8Array(hex.length / 2);
            for (let i = 0; i < hex.length; i += 2) {
                bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
            }
            return bytes;
        }

        verifyToken();
    }, []);

    if (error) return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            fontFamily: 'Helvetica, sans-serif'
        }}>
            <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>🛡️ {error}</h1>
            <p style={{ color: '#666' }}>Por favor, accede a través del Portal Oficial.</p>
        </div>
    );

    if (!accessGranted) return null; // Loading state essentially

    return children;
};

export default Gatekeeper;
