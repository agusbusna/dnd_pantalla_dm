# D&D 5e Combat Tracker — Pantalla del DM

Tracker de combate para D&D 5e construido con React + Vite + Electron.

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
cd dnd-tracker
npm install
```

## Modo desarrollo

### Solo navegador (localhost)
```bash
npm run dev
# Abrir http://localhost:5173
```

### Con Electron (app de escritorio)
```bash
npm run electron:dev
```
Esto levanta Vite en el puerto 5173 y abre Electron apuntando ahí.

## Build para producción (Electron)
```bash
npm run build
NODE_ENV=production npm run electron
```

## Estructura del proyecto

```
dnd-tracker/
├── electron/
│   ├── main.js        ← Proceso principal de Electron
│   └── preload.js     ← Puente IPC seguro (contextBridge)
├── src/
│   ├── components/
│   │   ├── CombatantRow.jsx      ← Fila de cada combatiente
│   │   ├── AddCombatantPanel.jsx ← Panel para agregar
│   │   └── RoundBanner.jsx       ← Contador de rondas
│   ├── App.jsx        ← Lógica principal y estado
│   ├── App.module.css
│   ├── index.css      ← Variables globales / tema oscuro
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Features

- **Orden de iniciativa** automático (ordenado de mayor a menor)
- **Gestión de HP** con daño, curación y barra visual
- **Tirada de iniciativa** aleatoria con bonus por combatiente
- **Condiciones** D&D 5e (cegado, paralizado, etc.) — click para quitar
- **Espacios de conjuro** con pips visuales y reset por descanso largo
- **Auto-guardado** en Electron (carpeta userData del sistema)
- **Estado persistente** entre sesiones cuando se usa como app Electron

## Notas

- En modo navegador el estado se pierde al refrescar (no hay persistencia)
- En modo Electron el estado se guarda automáticamente cada 800ms
- La fuente de display es Cinzel (Google Fonts) — requiere conexión en el primer uso
