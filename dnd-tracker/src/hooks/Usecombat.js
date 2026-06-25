/**
 * useCombat.js — Hook centralizado para toda la lógica de combate
 *
 * Extrae el estado y las acciones de App.jsx para:
 *   a) Mantener App.jsx limpio (solo layout y render)
 *   b) Facilitar las pestañas múltiples de la Etapa 5 (un hook por pestaña)
 *   c) Facilitar los tests unitarios de la lógica
 *
 * El guardado automático usa debounce de 800ms, igual que antes.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
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

export function useCombat(combatId = 'default') {
  const [combatants, setCombatants] = useState(DEFAULT_COMBATANTS)
  const [round, setRound]           = useState(1)
  const [activeTurn, setActiveTurn] = useState(0)
  const [nextId, setNextId]         = useState(20)
  const [saveStatus, setSaveStatus] = useState(null)   // null | 'saved' | 'error'
  const saveTimer = useRef(null)

  // ─── Persistencia ────────────────────────────────────────────────────────

  useEffect(() => {
    loadCombat(combatId).then(res => {
      if (res.ok && res.data) {
        const d = res.data
        if (d.combatants)            setCombatants(d.combatants)
        if (d.round)                 setRound(d.round)
        if (d.activeTurn !== undefined) setActiveTurn(d.activeTurn)
        if (d.nextId)                setNextId(d.nextId)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combatId])

  const autoSave = useCallback((data) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const res = await saveCombat(data)
      setSaveStatus(res.ok ? 'saved' : 'error')
      setTimeout(() => setSaveStatus(null), 2000)
    }, 800)
  }, [])

  useEffect(() => {
    autoSave({ combatants, round, activeTurn, nextId })
  }, [combatants, round, activeTurn, nextId, autoSave])

  // ─── Lista ordenada (derivada, no estado) ────────────────────────────────

  const sortedList = sortedCombatants(combatants)

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

  function removeCombatant(id) {
    setCombatants(prev => prev.filter(c => c.id !== id))
    setActiveTurn(0)
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
   * Añade múltiples copias de una criatura desde el bestiario.
   * Cada copia es independiente (HP, condiciones, estado propios).
   * Etapa 2.
   *
   * @param {Object} creature   - Datos de la criatura del bestiario
   * @param {number} count      - Cantidad de copias (por defecto 1)
   */
  function addCreatureFromBestiary(creature, count = 1) {
    const copies = Array.from({ length: count }, (_, i) => {
      const id = nextId + i
      const suffix = count > 1 ? ` ${i + 1}` : ''
      return {
        ...creature,
        id,
        name: creature.name + suffix,
        hpLeft: creature.hpMax,
        conditions: [],
        expanded: false,
        dead: false,
        spellUsed: {},
        order: undefined,   // se ordenará por iniciativa
      }
    })
    setNextId(n => n + count)
    setCombatants(prev => [...prev, ...copies])
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

    // Turnos
    nextTurn,
    prevTurn,

    // CRUD
    updateCombatant,
    removeCombatant,
    addCombatant,
    addCreatureFromBestiary,

    // Reordenamiento
    moveCombatantInOrder,
    resetOrder,

    // Acciones globales
    rollInitiative,
    resetCombat,
  }
}