# 🔌 Guía de Integración: FDS Analyzer -> Portal IA LAB

Para añadir la herramienta **FDS Analyzer** a tu Portal Central de Aplicaciones, utiliza el siguiente snippet de código. Este bloque está diseñado para integrarse visualmente con el ecosistema "Dirección Técnica IA LAB".

## 1. Importar Icono (Si usas Lucide React)
Asegúrate de tener el icono disponible en tus importaciones.

```jsx
import { FlaskConical } from 'lucide-react';
```

## 2. Snippet de la Tarjeta (Componente React)

Copia y pega este bloque dentro de tu Grid de herramientas (ej. en `src/PortalApp.jsx` o donde definas tu lista de apps).

```jsx
{/* --- INICIO TARJETA FDS ANALYZER --- */}
<a 
  href="PON_AQUI_TU_URL_DE_VERCEL" 
  target="_blank" 
  rel="noopener noreferrer"
  className="group block p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-500 transition-all duration-200"
>
  <div className="flex items-start justify-between mb-4">
    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
      {/* Icono Matraz/Química */}
      <FlaskConical className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
    </div>
    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
      v1.0
    </span>
  </div>
  
  <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
    FDS Analyzer
  </h3>
  
  <p className="text-sm text-slate-600 leading-relaxed">
    Extracción automática de datos de fichas de seguridad química (12 puntos) mediante IA.
  </p>
</a>
{/* --- FIN TARJETA FDS ANALYZER --- */}
```

## 3. Configuración Final
1.  Sustituye `"PON_AQUI_TU_URL_DE_VERCEL"` por el enlace real de tu despliegue (ej. `https://fds-analyzer-ia-lab.vercel.app`).
2.  Guarda los cambios y despliega tu Portal.
