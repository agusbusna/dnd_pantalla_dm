/**
 * useEncounters.js — Hook de lógica de los encuentros guardados (Etapa 4)
 *
 * Un encuentro es una "plantilla" de combate: nombre + notas + lista de
 * entradas `{ name, type, count, data }`. `data` es un snapshot de las
 * stats (AC, HP, bonusInit, DC, conjuros), así cargar un encuentro funciona
 * aunque la criatura se haya editado o borrado del bestiario después.
 *
 * Responsabilidades:
 *   • Cargar/guardar encuentros en localStorage (o Electron vía storage.js)
 *   • CRUD: crear, editar, eliminar encuentros
 *   • Búsqueda por nombre y notas
 *   • Construcción de entradas desde el combate activo o desde una criatura
 *
 * El consumo en UI se hace vía `context/EncountersContext.jsx`.
 */

import { useState, useEffect, useMemo } from 'react'
import { loadEncounters, saveEncounters } from '../../lib/storage'

function generateId() {
  return 'enc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

/** Quita el sufijo numérico que añade el tracker ("Goblin 2" → "Goblin"). */
function baseName(name) {
  return String(name ?? '').replace(/\s+\d+$/, '').trim() || 'Sin nombre'
}

/** Clave de identidad de una entrada: mismo ser ⇒ se agrupan en una fila. */
function entryKey(entry) {
  const d = entry.data || {}
  return [entry.type, entry.name, d.ac, d.hpMax, d.bonusInit, d.dc].join('|')
}

/** Snapshot de stats de un combatiente/criatura/personaje → entrada. */
export function entryFrom(creature) {
  return {
    name: baseName(creature.name),
    type: creature.type || 'enemy',
    count: 1,
    data: {
      ac:        creature.ac ?? 0,
      hpMax:     creature.hpMax ?? 0,
      bonusInit: creature.bonusInit || 0,
      dc:        creature.dc ?? null,
      spellcaster: !!creature.spellcaster,
      spellSlots:  creature.spellSlots || {},
    },
  }
}

/**
 * Convierte la lista actual del combate en entradas de encuentro.
 * Los duplicados ("Goblin 1", "Goblin 2"…) se agrupan en una sola entrada
 * con su cantidad.
 */
export function entriesFromCombatants(combatants) {
  const map = new Map()
  for (const c of combatants) {
    const entry = entryFrom(c)
    const key = entryKey(entry)
    const found = map.get(key)
    if (found) found.count += 1
    else map.set(key, entry)
  }
  return [...map.values()]
}

/** Suma total de criaturas que carga el encuentro. */
export function encounterTotal(encounter) {
  return (encounter.entries || []).reduce((sum, e) => sum + (e.count || 0), 0)
}

/** Agrega una entrada, sumando cantidad si el mismo ser ya estaba. */
export function mergeEntry(entries, entry) {
  const key = entryKey(entry)
  const idx = entries.findIndex(e => entryKey(e) === key)
  if (idx === -1) return [...entries, entry]
  return entries.map((e, i) => (i === idx ? { ...e, count: e.count + entry.count } : e))
}

export function useEncounters() {
  const [encounters, setEncounters] = useState([])
  const [loaded, setLoaded]         = useState(false)
  const [search, setSearch]         = useState('')

  // ─── Carga inicial ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    loadEncounters().then(res => {
      if (cancelled) return
      if (res.ok && Array.isArray(res.data)) setEncounters(res.data)
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [])

  // ─── Guardado automático ──────────────────────────────────────────────────

  useEffect(() => {
    if (!loaded) return
    saveEncounters(encounters)
  }, [encounters, loaded])

  // ─── Búsqueda ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const byRecency = (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    if (!search.trim()) return [...encounters].sort(byRecency)
    const q = search.toLowerCase()
    return encounters
      .filter(e =>
        (e.name || '').toLowerCase().includes(q) ||
        (e.notes || '').toLowerCase().includes(q)
      )
      .sort(byRecency)
  }, [encounters, search])

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  function addEncounter({ name, notes = '', entries = [] }) {
    const encounter = {
      id: generateId(),
      name: name.trim(),
      notes: (notes || '').trim(),
      entries,
      createdAt: new Date().toISOString(),
    }
    setEncounters(prev => [encounter, ...prev])
    return encounter
  }

  function updateEncounter(id, patch) {
    setEncounters(prev => prev.map(e =>
      e.id === id
        ? { ...e, ...patch, notes: (patch.notes ?? e.notes ?? '').trim(), updatedAt: new Date().toISOString() }
        : e
    ))
  }

  function deleteEncounter(id) {
    setEncounters(prev => prev.filter(e => e.id !== id))
  }

  // ─── Retorno ──────────────────────────────────────────────────────────────

  return {
    encounters,
    filtered,
    loaded,
    search,
    setSearch,
    addEncounter,
    updateEncounter,
    deleteEncounter,
  }
}
