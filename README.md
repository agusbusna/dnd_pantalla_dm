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
│   ├── main.js        ← Proceso principal (un archivo de datos por entidad)
│   └── preload.js     ← Puente IPC seguro (contextBridge)
├── src/
│   ├── context/       ← React Context por dominio (estado global)
│   │   ├── AppProviders.jsx
│   │   ├── UIContext.jsx        ← pestaña activa (Combate/Encuentros/Personajes/Bestiario)
│   │   ├── CombatContext.jsx    ← combate activo
│   │   ├── BestiaryContext.jsx  ← bestiario
│   │   ├── CharactersContext.jsx← personajes y aliados
│   │   └── EncountersContext.jsx← encuentros guardados
│   ├── hooks/
│   │   └── useCombat.js         ← lógica del combate
│   ├── lib/
│   │   ├── sort.js              ← orden de iniciativa
│   │   └── storage.js           ← persistencia (Electron / localStorage)
│   ├── components/              ← componentes reutilizables (solo props)
│   ├── features/                ← una carpeta por página/funcionalidad
│   │   ├── bestiary/
│   │   ├── characters/
│   │   └── encounters/
│   ├── App.jsx                  ← layout principal
│   ├── App.module.css
│   ├── index.css                ← variables globales / tema oscuro
│   └── main.jsx                 ← monta <AppProviders><App />
├── index.html
├── package.json
└── vite.config.js
```

## Features

- **Orden de iniciativa** automático (ordenado de mayor a menor) + reordenamiento manual ↑ ↓
- **Gestión de HP** con daño, curación y barra visual
- **Tirada de iniciativa** aleatoria por combatiente
- **Condiciones** D&D 5e (cegado, paralizado, etc.) — click para quitar
- **Espacios de conjuro** con pips visuales y reset por descanso largo
- **Bestiario** con búsqueda, filtro y alta/baja de criaturas
- **Personajes y aliados** con atributos (FUE/DES/CON/INT/SAB/CAR)
- **Encuentros guardados**: crear plantillas (desde el combate actual o el
  bestiario), editarlas y cargarlas al combate de una sola vez
- **Auto-guardado** con debounce de 800ms en todas las entidades
- **Estado persistente** entre sesiones (localStorage en navegador,
  `userData/data/` en Electron)

## Notas

- En modo navegador el estado se guarda en `localStorage` (sobrevive al refrescar)
- En modo Electron cada entidad tiene su archivo en la carpeta `userData/data/`
- La fuente de display es Cinzel (Google Fonts) — requiere conexión en el primer uso
- Arquitectura y roadmap detallados en `Document.md`
