/**
 * storage.js — Capa de abstracción de almacenamiento
 *
 * Prioridad:
 *   1. Electron IPC (window.electronAPI) — para la app de escritorio
 *   2. localStorage — fallback para desarrollo en navegador
 *
 * Esta capa permite que el resto de la app no sepa ni le importe
 * dónde se guarda el estado. En Etapa 6, se puede reemplazar el
 * interior de estas funciones para apuntar a SQLite sin tocar nada más.
 *
 * Entidades separadas para escalar hacia las etapas futuras:
 *   - combat      → estado actual del tracker (ronda, turno, combatientes)
 *   - bestiary    → biblioteca de monstruos
 *   - characters  → PJs y aliados frecuentes
 *   - encounters  → encuentros guardados
 *   - campaigns   → campañas con notas, NPCs, mapas, etc.
 */

const LS_PREFIX = 'dnd_tracker_'

// ─── Electron IPC ─────────────────────────────────────────────────────────────

function hasElectron() {
  return typeof window !== 'undefined' && !!window.electronAPI
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function lsGet(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Carga el estado de una entidad específica.
 * @param {string} entity - 'combat' | 'bestiary' | 'characters' | 'encounters' | 'campaigns'
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function loadEntity(entity) {
  if (hasElectron()) {
    // Electron puede manejar entidades por separado en el futuro.
    // Por ahora usamos la misma API con prefijo en la key.
    try {
      const res = await window.electronAPI.loadState(entity)
      return res.ok ? res : { ok: true, data: null }
    } catch {
      return { ok: false, data: null }
    }
  }

  const data = lsGet(entity)
  return { ok: true, data }
}

/**
 * Guarda el estado de una entidad específica.
 * @param {string} entity
 * @param {any}    data
 * @returns {Promise<{ok: boolean}>}
 */
export async function saveEntity(entity, data) {
  if (hasElectron()) {
    try {
      const res = await window.electronAPI.saveState(data, entity)
      return { ok: res.ok }
    } catch {
      return { ok: false }
    }
  }

  const ok = lsSet(entity, data)
  return { ok }
}

// ─── Atajos por entidad ───────────────────────────────────────────────────────
// Convenientes para importar directamente donde se necesiten.

export const loadCombat     = () => loadEntity('combat')
export const saveCombat     = (d) => saveEntity('combat', d)

export const loadBestiary   = () => loadEntity('bestiary')
export const saveBestiary   = (d) => saveEntity('bestiary', d)

export const loadCharacters = () => loadEntity('characters')
export const saveCharacters = (d) => saveEntity('characters', d)

export const loadEncounters = () => loadEntity('encounters')
export const saveEncounters = (d) => saveEntity('encounters', d)

export const loadCampaigns  = () => loadEntity('campaigns')
export const saveCampaigns  = (d) => saveEntity('campaigns', d)