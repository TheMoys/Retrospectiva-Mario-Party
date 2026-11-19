# ⭐ Sprint Party 3D: Senda Arcoíris ⭐

> **Juego de mesa interactivo en 3D para retrospectivas de equipo ágiles**, inspirado en las mecánicas clásicas de *Mario Party* y la estética neón de *Mario Kart: Senda Arcoíris*. Diseñado para dinámicas de hasta 6 jugadores y desplegable directamente en **Netlify**.

---

## 🚀 Cómo Levantar el Proyecto Localmente

### 1. Requisitos Previos
* Node.js v18+ (recomendado v20+)
* Gestor de paquetes: `pnpm` (o `npm`)

### 2. Pasos de Instalación y Ejecución
Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
# 1. Instalar dependencias
pnpm install

# 2. Iniciar el servidor de desarrollo en red local
pnpm dev
```

La consola te mostrará las URLs disponibles:
* **Local:** `http://localhost:3000`
* **Red (Móviles / Wi-Fi):** `http://<tu-ip-local>:3000`

---

## 🎮 Los 3 Modos de Juego

1. **📺 Pantalla Principal (Host TV):**
   * Muestra el circuito 3D ovalado a pantalla completa sin mandos laterales.
   * Genera un **código de sala de 4 letras** (ej. `STAR`) y un **código QR** dinámico para que los participantes escaneen con la cámara de sus teléfonos.
   * Arriba muestra el marcador en vivo con las estrellas de cada jugador, la corona para el líder y las 3 medallas desbloqueadas.
2. **📱 Mando Móvil (Joy-Phone Real):**
   * Los jugadores se conectan desde su navegador móvil entrando a la URL o escaneando el QR.
   * Eligen su personaje (**Mario, Luigi, Peach, Yoshi, Bowser, Toad**).
   * Su pantalla se convierte en un gamepad personal con botón gigante para lanzar el dado 3D en su turno, mochila de objetos Power-Up, formulario privado para redactar tarjetas de retrospectiva y pulsadores para los minijuegos.
3. **💻 Modo Local / Demo:**
   * Permite probar toda la experiencia en un solo ordenador.
   * Divide la pantalla en dos: escenario 3D a la izquierda y un **Smartphone simulado interactivo** a la derecha con selector de jugador y seguimiento automático de turnos.

---

## 🌈 El Escenario 3D (WebGL / Three.js)

* **Cámara Panorámica Fija (FOV 38):** Encuadre estático en perspectiva que abarca todo el circuito sin giros bruscos de cámara para evitar mareos.
* **Senda Arcoíris Ovalada (15.2 x 7.8):** 6 carriles independientes con colores neón vibrantes (`rojo, naranja, amarillo, verde, azul cielo, violeta`), divisiones luminosas y bordillos dorados metálicos.
* **Elementos 3D Animados:**
  * Gran Estrella dorada extruida girando en el centro sobre un halo de partículas orbitales.
  * Tuberías Warp 3D con Plantas Piraña animadas entrando y saliendo.
  * Bloques `?` dorados flotando en el aire.
  * Trampas 3D de cáscaras de plátano en las casillas donde se activen.
  * Peones 3D articulados para cada personaje con sus rasgos en volumen (gorras con visera, vestido acampanado, cuernos, caparazón con picos, sombrero champiñón).
  * Dado 3D cúbico flotante con texturas de puntos clásicas (duplicable en Champiñón Turbo).

---

## 🎲 Dinámica de la Retrospectiva y Medallas

* **Casillas del Tablero (20 en total):**
  * 🏁 **Salida:** Bonificación de vuelta completa (+1 Estrella).
  * 🟢 **Verde (Seguir Haciendo):** El jugador redacta un elogio sincero a un compañero de equipo (+1 Estrella y Medalla Verde).
  * 🟡 **Amarilla (Mejorar / Potenciar):** Propuesta de optimización técnica o de proceso (+1 Estrella y Medalla Amarilla).
  * 🔴 **Roja (Dejar de Hacer):** Identificación de blockers, deuda técnica o frenos (+1 Estrella y Medalla Roja).
  * 🟣 **Morada (Evento Caos):** Ruleta que otorga un Power-Up aleatorio para la mochila.

* **5 Power-Ups en la Mochila:**
  * 🍄 **Champiñón Turbo:** Lanza 2 dados simultáneos (avance de 2 a 12).
  * 🎲 **Dado Dorado:** Dado cargado que garantiza sacar 4, 5 o 6.
  * 👻 **Boo:** Envía al fantasma a robar 1 Estrella a un rival seleccionado.
  * 🍌 **Plátano:** Coloca una trampa 3D que frena al siguiente jugador que pase por la casilla.
  * 🛡️ **Estrella Escudo:** Otorga inmunidad frente a robos de Boo y trampas de plátano.

* **Minijuegos Express:**
  * ⚡ **¡Machaca el Bloque !:** Cuenta atrás de 8 segundos donde todos machacan la pantalla; el más rápido gana `+2 Estrellas`.
  * 🗳️ **Votación Rápida:** Preguntas divertidas del sprint (ej. "¿Quién resolvió el bug más infernal?"); el más votado gana `+2 Estrellas`.

---

## 🏆 Cierre y Exportación de la Retrospectiva

1. **Fase de El Peaje:** Permite a quienes tengan medallas pendientes completarlas para que ningún feedback del sprint quede fuera.
2. **Estrellas Bonus:** Ruleta final que premia categorías como *Estrella del Compañerismo* a quien más elogios recibió.
3. **Ceremonia de Podio:** Celebración con fanfarria y confeti animado para el 1º, 2º y 3º puesto.
4. **Buzones y Acta Markdown:**
   * Cada participante puede abrir su buzón personal para leer los elogios recibidos.
   * Botón para copiar o descargar el acta completa en formato **Markdown (.md)** lista para pegar en Jira, Confluence, GitHub o Notion.

---

## 🌐 Despliegue en Netlify

1. Sube este repositorio a tu cuenta de GitHub / GitLab.
2. En Netlify, selecciona **"Add new site"** > **"Import an existing project"**.
3. Parámetros de compilación (detectados automáticamente por `netlify.toml`):
   * **Build command:** `pnpm build`
   * **Publish directory:** `dist`
4. ¡Listo! Tendrás tu enlace público HTTPS con WebRTC activo para proyectar en cualquier reunión.
