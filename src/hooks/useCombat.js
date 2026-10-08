/**
 * useCombat.js — Hook centralizado para toda la lógica de combate
 *
 * Extrae el estado y las acciones de App.jsx para:
 *   a) Mantener App.jsx limpio (solo layout y render)
 *   b) Facilitar las pestañas múltiples de la Etapa 5 (un hook por pestaña)
 *   c) Facilitar los tests unitarios de la lógica
 *
 * Consumo: las páginas NO llaman a este hook directamente — lo hace
 * `context/CombatContext.jsx`, que lo distribuye vía `useCombatContext()`.
 *
 * El guardado automático usa debounce de 800ms y no arranca hasta terminar
 * la carga inicial (evita pisar los datos guardados con los defaults).
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { sortedCombatants, moveCombatant, clearOrders } from '../lib/sort'
import { loadCombat, saveCombat } from '../lib/storage'

const DEFAULT_COMBATANTS = [
  {
    id: 1, name: 'Gorik', type: 'player',
    init: 15, ac: 14, dc: 13, bonusInit: 4,
    hpMax: 20, hpLeft: 20,
    conditions: [], expanded: false, dead: false,
    spellcaster: false, spellSlots: {}, spellUsed: {}
  },
  {
    id: 2, name: 'Sorik', type: 'player',
    init: 15, ac: 14, dc: 13, bonusInit: 4,
    hpMax: 20, hpLeft: 20,
    conditions: [], expanded: false, dead: false,
    spellcaster: false, spellSlots: {}, spellUsed: {}
  },
]

/**
 * Copia de un template (bestiario/personaje/encuentro) lista para entrar
 * al combate: stats del template + estado de combate a cero.
 */
function buildCopy(creature, id, suffix = '') {
  return {
    ...creature,
    id,
    name: creature.name + suffix,
    // Templates sin init (bestiario/personajes) → default 0 para que el sort
    // no reciba NaN. La tira "🎲 Iniciativa" reparte los valores reales.
    init: Number.isFinite(creature.init) ? creature.init : 0,
    hpLeft: creature.hpMax,
    conditions: [],
    expanded: false,
    dead: false,
    spellUsed: {},
    order: undefined,   // se ordenará por iniciativa
  }
}

export function useCombat(combatId = 'default') {
  const [combatants, setCombatants] = useState(DEFAULT_COMBATANTS)
  const [round, setRound]           = useState(1)
  const [activeTurn, setActiveTurn] = useState(0)
  const [nextId, setNextId]         = useState(20)
  const [saveStatus, setSaveStatus] = useState(null)   // null | 'saved' | 'error'
  const [loaded, setLoaded]         = useState(false)  // true cuando terminó la carga inicial
  const saveTimer = useRef(null)

  // ─── Persistencia ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    setLoaded(false)   // si cambia el combatId, esperar la nueva carga

    loadCombat(combatId).then(res => {
      if (cancelled) return
      if (res.ok && res.data) {
        const d = res.data
        if (d.combatants)            setCombatants(d.combatants)
        if (d.round)                 setRound(d.round)
        if (d.activeTurn !== undefined) setActiveTurn(d.activeTurn)
        if (d.nextId)                setNextId(d.nextId)
      }
      setLoaded(true)
    })

    return () => { cancelled = true }
  }, [combatId])

  const autoSave = useCallback((data) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const res = await saveCombat(data)
      setSaveStatus(res.ok ? 'saved' : 'error')
      setTimeout(() => setSaveStatus(null), 2000)
    }, 800)
  }, [])

  // No guardar hasta terminar la carga: si no, los valores por defecto
  // pisarían lo guardado (carrera entre la carga y el debounce de 800ms).
  useEffect(() => {
    if (!loaded) return
    autoSave({ combatants, round, activeTurn, nextId })
  }, [combatants, round, activeTurn, nextId, loaded, autoSave])

  // Limpia el timer de guardado al desmontar
  useEffect(() => () => clearTimeout(saveTimer.current), [])

  // ─── Lista ordenada (derivada, no estado) ────────────────────────────────

  const sortedList = useMemo(() => sortedCombatants(combatants), [combatants])

  // ─── Navegación de turnos ────────────────────────────────────────────────

  function nextTurn() {
    const len = sortedList.length
    if (!len) return
    let idx = activeTurn
    let tries = 0
    let wrapped = false
    do {
      idx = (idx + 1) % len
      if (idx === 0) wrapped = true
      tries++
    } while (sortedList[idx].dead && tries < len)
    if (wrapped) setRound(r => r + 1)
    setActiveTurn(idx)
  }

  function prevTurn() {
    const len = sortedList.length
    if (!len) return
    let idx = activeTurn
    let tries = 0
    do {
      idx = (idx - 1 + len) % len
      tries++
    } while (sortedList[idx].dead && tries < len)
    setActiveTurn(idx)
  }

  // ─── CRUD de combatientes ────────────────────────────────────────────────

  function updateCombatant(id, patch) {
    setCombatants(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  /**
   * Elimina un combatiente sin robarle el turno a nadie:
   *   • si el activo sigue en pie, su índice baja si el eliminado estaba antes
   *   • si se eliminó al activo, el siguiente en el orden ocupa su lugar
   *   • si la lista queda vacía, el turno vuelve a 0
   */
  function removeCombatant(id) {
    const removedIdx = sortedList.findIndex(c => c.id === id)
    const next = combatants.filter(c => c.id !== id)
    setCombatants(next)

    if (next.length === 0) {
      setActiveTurn(0)
      return
    }

    let idx = activeTurn
    if (removedIdx !== -1 && removedIdx < activeTurn) idx = activeTurn - 1
    if (idx >= next.length) idx = 0
    setActiveTurn(idx)
  }

  function addCombatant(data) {
    const id = nextId
    setNextId(n => n + 1)
    setCombatants(prev => [
      ...prev,
      { ...data, id, conditions: [], expanded: false, dead: false, spellUsed: {} }
    ])
  }

  /**
   * Añade varios grupos `{ creature, count }` en un único update atómico
   * con ids correlativos.
   *
   * Hace falta para "Cargar encuentro": varias especies en un solo clic.
   * Si se llamara a addCreatureFromBestiary() varias veces en el mismo
   * handler, todas leerían el mismo `nextId` del cierre y se pisarían los ids.
   *
   * @param {Array<{creature: Object, count: number}>} groups
   */
  function addCreatures(groups) {
    const total = groups.reduce((sum, g) => sum + (g.count || 0), 0)
    if (!total) return

    const baseId = nextId
    setNextId(n => n + total)
    setCombatants(prev => {
      const copies = []
      let id = baseId
      for (const { creature, count } of groups) {
        for (let i = 0; i < count; i++) {
          const suffix = count > 1 ? ` ${i + 1}` : ''
          copies.push(buildCopy(creature, id++, suffix))
        }
      }
      return [...prev, ...copies]
    })
  }

  /**
   * Añade múltiples copias de una criatura desde el bestiario.
   * Cada copia es independiente (HP, condiciones, estado propios).
   *
   * @param {Object} creature   - Datos de la criatura del bestiario
   * @param {number} count      - Cantidad de copias (por defecto 1)
   */
  function addCreatureFromBestiary(creature, count = 1) {
    addCreatures([{ creature, count }])
  }

  // ─── Reordenamiento manual ───────────────────────────────────────────────

  /**
   * Mueve un combatiente una posición hacia arriba (-1) o abajo (+1).
   * Asigna `order` explícito a toda la lista si no existía.
   */
  function moveCombatantInOrder(id, direction) {
    setCombatants(prev => moveCombatant(prev, id, direction))
  }

  /**
   * Elimina todos los `order` manuales y vuelve al sort por iniciativa.
   */
  function resetOrder() {
    setCombatants(prev => clearOrders(prev))
    setActiveTurn(0)
  }

  // ─── Acciones de combate ─────────────────────────────────────────────────

  function rollInitiative() {
    setCombatants(prev => clearOrders(prev).map(c => ({
      ...c,
      init: Math.ceil(Math.random() * 20) + (c.bonusInit || 0)
    })))
    setActiveTurn(0)
  }

  function resetCombat() {
    setCombatants(prev => clearOrders(prev).map(c => ({
      ...c,
      dead: false,
      conditions: [],
      spellUsed: {},
      hpLeft: c.hpMax
    })))
    setRound(1)
    setActiveTurn(0)
  }

  // ─── Retorno ─────────────────────────────────────────────────────────────

  return {
    // Estado
    combatants,
    sortedList,
    round,
    activeTurn,
    saveStatus,
    loaded,

    // Turnos
    nextTurn,
    prevTurn,

    // CRUD
    updateCombatant,
    removeCombatant,
    addCombatant,
    addCreatures,
    addCreatureFromBestiary,

    // Reordenamiento
    moveCombatantInOrder,
    resetOrder,

    // Acciones globales
    rollInitiative,
    resetCombat,
  }
}