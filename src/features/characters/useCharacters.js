/**
 * useCharacters.js — Hook de lógica de la biblioteca de personajes
 *
 * Guarda PJs y aliados frecuentes con datos extendidos:
 *   • Datos base (igual que criaturas): AC, HP, bonusInit, DC, spellcaster, spellSlots
 *   • Datos extra: nivel, clase, STR/DEX/CON/INT/WIS/CHA
 *
 * El modificador de iniciativa (bonusInit) se puede calcular automáticamente
 * desde DEX si el usuario quiere, o ingresar manualmente.
 */

import { useState, useEffect, useMemo } from 'react'
import { loadCharacters, saveCharacters } from '../../lib/storage'

const SEED_CHARACTERS = [
  {
    id: 'pc_ejemplo',
    name: 'Ejemplo PJ',
    type: 'player',
    clase: 'Guerrero',
    nivel: 5,
    ac: 18, hpMax: 44, bonusInit: 2, dc: null,
    spellcaster: false, spellSlots: {},
    str: 18, dex: 14, con: 16, int: 10, wis: 12, cha: 10,
  },
  {
    id: 'npc_ejemplo',
    name: 'Ejemplo Aliado',
    type: 'ally',
    clase: 'Clérigo',
    nivel: 4,
    ac: 15, hpMax: 28, bonusInit: 1, dc: 13,
    spellcaster: true, spellSlots: { 1:4, 2:3 },
    str: 12, dex: 12, con: 14, int: 10, wis: 18, cha: 14,
  },
]

function generateId() {
  return 'ch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

/** Calcula modificador de D&D desde puntuación de atributo */
export function abilityMod(score) {
  return Math.floor((score - 10) / 2)
}

export function useCharacters() {
  const [characters, setCharacters] = useState([])
  const [loaded, setLoaded]         = useState(false)
  const [search, setSearch]         = useState('')
  const [filterType, setFilterType] = useState('all')

  // ─── Carga inicial ────────────────────────────────────────────────────────

  useEffect(() => {
    loadCharacters().then(res => {
      if (res.ok && res.data && res.data.length > 0) {
        setCharacters(res.data)
      } else {
        setCharacters(SEED_CHARACTERS)
        saveCharacters(SEED_CHARACTERS)
      }
      setLoaded(true)
    })
  }, [])

  // ─── Guardado automático ──────────────────────────────────────────────────

  useEffect(() => {
    if (!loaded) return
    saveCharacters(characters)
  }, [characters, loaded])

  // ─── Filtrado ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = characters
    if (filterType !== 'all') list = list.filter(c => c.type === filterType)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.clase || '').toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [characters, search, filterType])

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  function addCharacter(data) {
    const character = { ...data, id: generateId() }
    setCharacters(prev => [...prev, character])
    return character
  }

  function updateCharacter(id, patch) {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  function deleteCharacter(id) {
    setCharacters(prev => prev.filter(c => c.id !== id))
  }

  return {
    characters,
    filtered,
    loaded,
    search, setSearch,
    filterType, setFilterType,
    addCharacter,
    updateCharacter,
    deleteCharacter,
  }
}