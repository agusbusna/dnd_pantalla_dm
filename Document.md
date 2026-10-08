# Combat Tracker — Arquitectura modular (Etapas 1–8)

## Estructura de archivos

```
src/
├── App.jsx                          ← Layout principal (solo render, consume contextos)
├── App.module.css
│
├── context/                         ← Estado global repartido vía React Context
│   ├── AppProviders.jsx             ← Compone todos los providers (se monta en main.jsx)
│   ├── UIContext.jsx                ← Pestaña activa + formulario "Añadir" (PAGES)
│   ├── CombatContext.jsx            ← Combate activo → hooks/useCombat.js
│   ├── BestiaryContext.jsx          ← Bestiario → features/bestiary/useBestiary.js
│   ├── CharactersContext.jsx        ← Personajes → features/characters/useCharacters.js
│   └── EncountersContext.jsx        ← Encuentros → features/encounters/useEncounters.js
│
├── hooks/
│   └── useCombat.js                 ← Toda la lógica de combate (Etapas 1, 5)
│
├── lib/
│   ├── sort.js                      ← Ordenamiento + reordenamiento manual
│   └── storage.js                   ← Abstracción de persistencia (Electron / localStorage)
│
├── components/                      ← Componentes compartidos (solo props, sin contextos)
│   ├── CombatantRow.jsx             ← Fila del tracker (con ↑ ↓)
│   ├── CombatantRow.module.css
│   ├── AddCombatantPanel.jsx
│   ├── AddCombatantPanel.module.css
│   ├── RoundBanner.jsx
│   └── RoundBanner.module.css
│
└── features/                        ← Una carpeta por funcionalidad grande
    ├── bestiary/
    │   ├── Bestiary.jsx             ← Página (consume contextos, sin props)
    │   ├── CreatureForm.jsx         ← Formulario (solo props)
    │   ├── useBestiary.js           ← Lógica + CRUD
    │   └── Bestiary.module.css
    ├── characters/
    │   ├── Characters.jsx           ← Página (consume contextos, sin props)
    │   ├── CharacterForm.jsx
    │   ├── useCharacters.js
    │   └── Characters.module.css
    ├── encounters/                  ← Etapa 4 ✅
    │   ├── Encounters.jsx           ← Página (consume contextos, sin props)
    │   ├── EncounterForm.jsx        ← Crear/editar encuentros
    │   ├── useEncounters.js         ← Lógica + CRUD + helpers de entradas
    │   └── Encounters.module.css
    ├── combat/                      ← Para Etapa 5 (pestañas múltiples)
    └── campaigns/                   ← Para Etapa 7
```

---

## Contextos por página

**Regla de la arquitectura:** los contextos envuelven los hooks; las páginas
consumen los contextos; los componentes hoja solo reciben props.

```
main.jsx
└── <AppProviders>                    ← src/context/AppProviders.jsx
    ├── UIProvider                    ← pestaña activa (PAGES) + form "Añadir"
    ├── CombatProvider                ← wraps useCombat()
    ├── BestiaryProvider              ← wraps useBestiary()
    ├── CharactersProvider            ← wraps useCharacters()
    └── EncountersProvider            ← wraps useEncounters()
        └── <App/>
            ├── App.jsx               → useUIContext() + useCombatContext()
            ├── <Bestiary />          → useBestiaryContext() + useCombatContext() + useUIContext()
            ├── <Characters />        → useCharactersContext() + useCombatContext() + useUIContext()
            ├── <Encounters />        → useEncountersContext() + useCombatContext() + useUIContext()
            └── <CombatantRow />      → solo props (invariante)
```

Beneficios concretos:

- **Cero prop drilling:** las páginas ya no reciben `onAddToCombat` / `onClose`;
  vuelven al combate con `goToCombat()` y añaden con
  `addCreatureFromBestiary()` directo.
- **Los datos sobreviven al cierre del panel:** los providers viven en la raíz,
  así Bestiary/Characters/Encounters no releen `localStorage` cada apertura y
  conservan búsqueda/filtro.
- **Puentes entre dominios en la página, no en los providers:** por ejemplo,
  "cargar encuentro" consume `useEncountersContext()` + `useCombatContext()`
  a la vez; ningún provider depende de otro.

Cada módulo de contexto expone `XxxProvider` + `useXxxContext()`; usar el hook
de `features/` directamente solo tiene sentido en tests o en su propio provider.

---

## Navegación por pestañas

La app es una interfaz de **pestañas**: `UIContext` maneja `page` con
`PAGES = { combat, encounters, characters, bestiary }` y `App.jsx` renderiza
**una sola pestaña por vez, a completo**:

- **Combate** → barra de turnos + lista de combatientes + controles de combate
  (ronda, 🎲 Iniciativa, ↺ Reiniciar, ↺ Orden, indicador de guardado).
- **Encuentros / Personajes / Bestiario** → solo esa página, ocupando toda el
  área principal (sin el combate ni la barra de turnos debajo). La lista hace
  scroll dentro de la pestaña (`.panel` es flex a altura completa).

Reglas:

- Las pestañas del header siempre están visibles; la activa se resalta en oro.
- `addOpen` (formulario "Añadir") es una sub-vista del combate, no una pestaña:
  se abre con **+ Añadir** (desde cualquier pestaña navega al combate) y se
  cierra al salir de la pestaña Combate.
- El ✕ de cada página llama a `goToCombat()` (volver a la pestaña Combate).
- Pestañas de navegación usan `goTo(page)` — no hay "toggle a cerrar": se
  vuelve al combate desde el ✕ o desde la pestaña ⚔ Combate.

---

## Etapa 1 — Cambios realizados

### ✅ Reordenamiento manual con botones ↑ ↓

**Cómo funciona:**

1. La lista siempre se ordena por `initiative → bonusInit → id`.
2. Cuando el DM presiona ↑ o ↓ en una fila, se llama a `moveCombatantInOrder(id, direction)`.
3. Esta función asigna un campo `order` numérico a todos los combatientes (si no tenían) e intercambia el `order` entre el combatiente seleccionado y su vecino.
4. La función `sortedCombatants()` en `sort.js` detecta si los combatientes tienen `order` y lo usa como criterio primario.
5. El badge de iniciativa muestra un borde punteado cuando hay orden manual activo.
6. El botón **"↺ Orden"** (aparece en el header solo cuando hay orden manual) llama a `resetOrder()`, que borra todos los `order` y vuelve al sort automático.
7. El botón **"🎲 Iniciativa"** también limpia los órdenes manuales (tira de nuevo para todos).

### ✅ Desempate por bonusInit

Ya estaba implementado en la versión anterior. Confirmado en `sort.js`.

### ✅ Guardado automático

Migrado a `storage.js`. Ahora funciona con:
- `window.electronAPI` → Electron IPC (producción)
- `localStorage` → fallback para desarrollo en navegador

### ✅ Lógica extraída a `useCombat`

`App.jsx` quedó limpio: solo layout y render. Toda la lógica de estado vive en `hooks/useCombat.js`, lo que permite en **Etapa 5** instanciar múltiples combates con `useCombat('pestaña-1')`, `useCombat('pestaña-2')`, etc.

---

## Etapa 4 — Encuentros guardados ✅

Implementado en `features/encounters/`:

- **Modelo:** `{ id, name, notes, entries[], createdAt }` donde cada entrada es
  `{ name, type, count, data }`. `data` guarda un **snapshot** de stats
  (AC, HP, bonusInit, DC, conjuros): el encuentro carga aunque la criatura se
  haya editado o borrado del bestiario.
- **Creación:** desde el formulario se elige del bestiario/personajes con
  cantidad, o con **"⚔ Desde combate"** se captura el combate actual agrupando
  los duplicados ("Goblin 1", "Goblin 2", "Goblin 3" → `3× Goblin`).
- **Carga:** `addCreatures(groups)` añade todas las entradas en **un único
  update atómico** con ids correlativos (evita que varias llamadas seguidas a
  `addCreatureFromBestiary()` se pisen el `nextId` del cierre).
- **Edición** con el mismo formulario y **eliminación con doble click** para
  confirmar.
- Persistencia con `loadEncounters()` / `saveEncounters()` de `storage.js`.

---

## Mejoras aplicadas — Contextos y correcciones

### ✅ Contextos por página

Ver sección "Contextos por página". `main.jsx` monta `<AppProviders>` y las
páginas consumen sus contextos sin props.

### ✅ Correcciones de bugs

1. **Carrera en el autoguardado del combate:** el debounce de 800ms podía
   guardarse *antes* de terminar la carga inicial, pisando lo guardado con los
   valores por defecto. Ahora `useCombat` tiene flag `loaded` y no guarda hasta
   terminar de cargar.
2. **Crash en "‹ Anterior" con combate vacío:** `prevTurn()` calculaba módulo
   sobre longitud 0 → `sortedList[NaN].dead` explotaba. Ahora tiene guarda y
   los botones de turno se deshabilitan sin combatientes.
3. **Pérdida del turno al eliminar:** `removeCombatant()` reseteaba el turno a
   0 aunque se hubiera eliminado a otro. Ahora mantiene al combatiente activo.
4. **IDs duplicados al cargar encuentros:** ver `addCreatures()` arriba.
5. **`init: undefined` al añadir del bestiario/personajes:** el sort recibía
   NaN y el badge mostraba "undefined". Ahora `buildCopy()` defaulta a 0.
6. **Persistencia de Electron:** `preload.js` ignoraba la `entity`, así que
   bestiario, personajes, encuentros y combate **se escribían todos sobre el
   mismo archivo** y se pisaban entre sí. Ahora hay un archivo por entidad en
   `userData/data/`, con migración automática del `combat-state.json` legado.
7. **Variables CSS inexistentes:** `--bg-input` y `--radius` se usaban en los
   módulos pero no estaban declaradas (inputs sin fondo, paneles sin redondeo).
8. **`Usecombat.js` → `useCombat.js`:** el import en `App.jsx` dependía de que
   Windows ignorara mayúsculas; en Linux/macOS el build fallaba.

---

## Próximas etapas — qué hay que hacer

### ✅ Etapa 2 — Bestiario (hecho)
### ✅ Etapa 3 — Personajes y NPCs (hecho)
### ✅ Etapa 4 — Encuentros guardados (hecho)

### Etapa 5 — Múltiples combates
1. Mover el estado de pestañas a `App.jsx`.
2. Cada pestaña instancia su propio `CombatProvider combatId={tabId}`;
   la UI de pestañas puede vivir en `UIContext`.
3. `useCombat` ya recibe `combatId` como argumento para separar persistencia.

### Etapa 6 — SQLite
1. Solo tocar `storage.js`. El resto de la app no cambia.
2. Reemplazar `lsGet`/`lsSet` por llamadas IPC a un worker de SQLite.
3. El proceso principal de Electron ya guarda **una archivo por entidad**
   (`userData/data/<entity>.json`), así que el worker puede reemplazar
   `fs.readFile/writeFile` por tablas con la misma clave de entidad.

### Etapa 7 — Campañas
1. Crear `src/features/campaigns/`.
2. Usar `loadCampaigns()` / `saveCampaigns()` de `storage.js`.
3. Crear `CampaignsContext.jsx` + sumarlo a `AppProviders` (mismo patrón que
   los contextos existentes).

---

## Invariantes que no se deben romper

- `CombatantRow` y el resto de `components/` no acceden a estado global — solo props.
- Los contextos envuelven hooks; **las páginas consumen contextos**; los
  componentes hoja reciben props.
- `useCombat` es la única fuente de verdad del combate activo.
- `storage.js` es el único lugar que toca `localStorage` o `electronAPI`.
- `sort.js` es la única fuente de verdad del ordenamiento.
- Un provider no depende de otro: los cruces de dominios (cargar encuentro en
  el combate, añadir bestiario al combate) se resuelven en la página.