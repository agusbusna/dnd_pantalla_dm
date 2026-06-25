# Combat Tracker — Arquitectura modular (Etapas 1–8)

## Estructura de archivos

```
src/
├── App.jsx                          ← Layout principal (solo render)
├── App.module.css
│
├── hooks/
│   └── useCombat.js                 ← Toda la lógica de combate (Etapas 1, 5)
│
├── lib/
│   ├── sort.js                      ← Ordenamiento + reordenamiento manual
│   └── storage.js                   ← Abstracción de persistencia (Electron / localStorage)
│
├── components/                      ← Componentes compartidos y reutilizables
│   ├── CombatantRow.jsx             ← Fila del tracker (actualizada con ↑ ↓)
│   ├── CombatantRow.module.css
│   ├── AddCombatantPanel.jsx        ← Sin cambios
│   ├── AddCombatantPanel.module.css
│   ├── RoundBanner.jsx              ← Sin cambios
│   └── RoundBanner.module.css
│
└── features/                        ← Una carpeta por funcionalidad grande
    ├── bestiary/
    │   └── Bestiary.jsx             ← Etapa 2 (stub listo)
    ├── encounters/
    │   └── Encounters.jsx           ← Etapa 4 (stub listo)
    ├── combat/                      ← Para Etapa 5 (pestañas múltiples)
    ├── campaigns/                   ← Para Etapa 7
    └── characters/                  ← Para Etapa 3
```

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

## Guía de migración

### Paso 1 — Reemplazar archivos

Copiar los nuevos archivos encima de los existentes:

```
src/App.jsx                    ← reemplazar
src/components/CombatantRow.jsx ← reemplazar
```

Crear archivos nuevos:

```
src/hooks/useCombat.js
src/lib/sort.js
src/lib/storage.js
src/features/bestiary/Bestiary.jsx
src/features/encounters/Encounters.jsx
```

### Paso 2 — Actualizar CSS

En `CombatantRow.module.css`, agregar al final el contenido de `CombatantRow.additions.css`.

En `App.module.css`, agregar:

```css
.btnWarn {
  background: rgba(230, 126, 34, 0.12);
  border: 1px solid rgba(230, 126, 34, 0.35);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  color: #e67e22;
  font-size: 12px;
  font-weight: 500;
}
.btnWarn:hover { background: rgba(230, 126, 34, 0.22); }
```

### Paso 3 — Actualizar preload.js (Electron)

Si usás Electron, el `preload.js` puede seguir igual. El nuevo `storage.js` llama a `window.electronAPI.loadState(entity)` y `window.electronAPI.saveState(data, entity)` donde `entity` es una string como `'combat'`.

Si tu `preload.js` actual solo acepta `loadState()` y `saveState(data)` sin argumentos adicionales, la capa de storage tiene un fallback compatible:

```js
// En storage.js, línea del if hasElectron():
// Electron legacy: ignora el argumento entity si no lo soporta
const res = await window.electronAPI.loadState()
```

Podés actualizar esto después sin urgencia. Para Etapa 1 funciona con la API actual.

---

## Próximas etapas — qué hay que hacer

### Etapa 2 — Bestiario
1. Crear `src/features/bestiary/bestiary.json` con las criaturas.
2. Activar `<Bestiary onAddToCombat={addCreatureFromBestiary} />` en `App.jsx`.
3. `addCreatureFromBestiary()` ya está implementado en `useCombat.js`.

### Etapa 3 — Personajes y NPCs
1. Crear `src/features/characters/Characters.jsx`.
2. Misma interfaz que Bestiary pero con `type: 'player'` y `type: 'ally'`.
3. Usar `loadCharacters()` / `saveCharacters()` de `storage.js`.

### Etapa 4 — Encuentros guardados
1. Implementar el formulario de creación en `Encounters.jsx`.
2. Un encuentro es: nombre + lista de `{ creatureId, count }`.
3. "Cargar encuentro" → llama `addCreatureFromBestiary()` por cada entrada.

### Etapa 5 — Múltiples combates
1. Mover el estado de pestañas a `App.jsx`.
2. Cada pestaña instancia su propio `useCombat(tabId)`.
3. `useCombat` ya recibe `combatId` como argumento para separar persistencia.

### Etapa 6 — SQLite
1. Solo tocar `storage.js`. El resto de la app no cambia.
2. Reemplazar `lsGet`/`lsSet` por llamadas IPC a un worker de SQLite.

### Etapa 7 — Campañas
1. Crear `src/features/campaigns/`.
2. Usar `loadCampaigns()` / `saveCampaigns()` de `storage.js`.

---

## Invariantes que no se deben romper

- `CombatantRow` no accede a estado global — solo props.
- `useCombat` es la única fuente de verdad del combate activo.
- `storage.js` es el único lugar que toca `localStorage` o `electronAPI`.
- `sort.js` es la única fuente de verdad del ordenamiento.