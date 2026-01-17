# 🚀 Guía de Despliegue Seguro en Vercel - FDS Analyzer

Esta guía te acompañará paso a paso para poner tu aplicación **FDS Analyzer** en producción. Hemos diseñado este proceso para que sea automático y extremadamente seguro, separando tu código de tus contraseñas y claves secretas.

---

## 🛡️ Filosofía de Seguridad

Para garantizar la seguridad de tu aplicación corporativa "Dirección Técnica IA LAB", seguimos una regla de oro:

> **"El código es público (o compartido), pero los secretos son privados."**

Esto significa que nunca escribiremos contraseñas ni claves de API (como la de Gemini Google) directamente en los archivos de código. En su lugar, las guardaremos en la "bóveda fuerte" de Vercel (Variables de Entorno). De esta forma, aunque alguien vea tu código, no podrá usar tu IA ni acceder a tu aplicación sin permiso.

---

## Paso 1: Crear el Repositorio en GitHub

GitHub es donde vivirá tu código. Vercel leerá de aquí para construir tu web.

1.  Entra en [GitHub.com](https://github.com) y loguéate.
2.  Haz clic en el botón **New** (o el icono `+` arriba a la derecha) para crear un nuevo repositorio.
3.  **Repository name**: Escribe `fds-analyzer` (o el nombre que prefieras).
4.  **Visibility**: Elige **Private** (recomendado para herramientas internas).
5.  Haz clic en **Create repository**.
6.  **Subir tu código**: Desde la carpeta de tu proyecto en tu ordenador, abre una terminal y ejecuta:

```bash
git init
git add .
git commit -m "Versión inicial: FDS Analyzer IA LAB"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/fds-analyzer.git
git push -u origin main
```
*(Nota: Reemplaza `TU_USUARIO` por tu nombre de usuario de GitHub. GitHub te mostrará estos comandos exactos al crear el repo).*

---

## Paso 2: Conectar con Vercel

Vercel es la plataforma que hará que tu aplicación sea accesible en internet.

1.  Entra en [Vercel.com](https://vercel.com) e inicia sesión (puedes usar tu cuenta de GitHub).
2.  En tu Dashboard, haz clic en **Add New...** -> **Project**.
3.  En "Import Git Repository", verás tu lista de repositorios de GitHub. Busca `fds-analyzer` y haz clic en **Import**.
4.  Vercel detectará automáticamente que es un proyecto **Vite**. **¡NO despliegues todavía!** Necesitamos configurar los secretos antes.

---

## Paso 3: Configurar los Secretos (Environment Variables) 🔐

Este es el paso más importante para que la IA funcione y la app sea segura.

1.  En la pantalla de configuración del proyecto ("Configure Project"), busca la sección **Environment Variables** y despliégala.
2.  Añade las siguientes variables una por una:

    **CLAVE 1: La Inteligencia (Gemini)**
    *   **Key:** `GOOGLE_GENERATIVE_AI_API_KEY`
    *   **Value:** *(Pega aquí tu API Key de Google AI Studio, empieza por `AIza...`)*
    *   Haz clic en **Add**.

    **CLAVE 2: El Candado (Tu Contraseña)**
    *   **Key:** `VITE_SHARED_SECRET`
    *   **Value:** *(Escribe la contraseña que quieras usar para entrar a la app. Ej: `IA-LAB-2024-SEGURIDAD`)*
    *   Haz clic en **Add**.

3.  Verifica que ambas variables aparecen en la lista.

---

## Paso 4: Desplegar

1.  Una vez añadidas las variables, pulsa el botón azul **Deploy** al final de la página.
2.  Espera unos segundos (o un minuto). Verás una pantalla de "Building..." con terminales de colores.
3.  ¡Felicidades! 🎉 Verás una pantalla con confeti indicando que tu aplicación está "Ready".
4.  Haz clic en la imagen de previsualización o en el botón **Visit** para ir a tu nueva aplicación web.

---

## ✅ Verificación y Mantenimiento

*   **Prueba de Acceso**: Al entrar, te pedirá contraseña. Introduce la que definiste en `VITE_SHARED_SECRET`.
*   **Prueba de IA**: Sube un PDF y verifica que lo analiza. Si funciona, la conexión con Google es correcta.
*   **Actualizaciones Automáticas**: A partir de ahora, cada cambio que hagas en tu código y subas a GitHub (`git push`), Vercel lo detectará y actualizará tu web automáticamente en cuestión de segundos.

---

### Nota sobre Seguridad Adicional
Hemos incluido un archivo `vercel.json` en tu proyecto que añade capas de seguridad extra (HSTS, protección contra iFrames, etc.) automáticamente. Tu aplicación cumple con estándares de seguridad modernos para herramientas corporativas.
