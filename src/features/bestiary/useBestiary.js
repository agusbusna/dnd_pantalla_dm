/**
 * useBestiary.js — Hook de lógica del bestiario
 *
 * Responsabilidades:
 *   • Cargar criaturas desde localStorage (con seed inicial desde bestiary.json)
 *   • CRUD: crear, editar, eliminar criaturas
 *   • Búsqueda/filtro por nombre y tipo
 *   • Guardar automáticamente en cada cambio
 *
 * Persistencia: usa la misma capa storage.js que el combate.
 * En Etapa 6 (SQLite) solo se toca storage.js.
 */

import { useState, useEffect, useMemo } from 'react'
import { loadBestiary, saveBestiary } from '../../lib/storage'

// Criaturas de ejemplo para la primera carga (si no hay datos guardados)
// Podés ampliar este array o reemplazarlo con tu propio bestiary.json
const SEED_CREATURES = [
  { id: 'goblin',        name: 'Goblin',          type: 'enemy', ac: 15, hpMax: 7,   bonusInit: 2,  dc: null, spellcaster: false, spellSlots: {} },
  { id: 'orco',          name: 'Orco',             type: 'enemy', ac: 13, hpMax: 15,  bonusInit: 1,  dc: null, spellcaster: false, spellSlots: {} },
  { id: 'zombi',         name: 'Zombi',            type: 'enemy', ac: 8,  hpMax: 22,  bonusInit: -2, dc: null, spellcaster: false, spellSlots: {} },
  { id: 'esqueleto',     name: 'Esqueleto',        type: 'enemy', ac: 13, hpMax: 13,  bonusInit: 2,  dc: null, spellcaster: false, spellSlots: {} },
  { id: 'bugbear',       name: 'Bugbear',          type: 'enemy', ac: 16, hpMax: 27,  bonusInit: 1,  dc: null, spellcaster: false, spellSlots: {} },
  { id: 'hobgoblin',     name: 'Hobgoblin',        type: 'enemy', ac: 18, hpMax: 11,  bonusInit: 1,  dc: null, spellcaster: false, spellSlots: {} },
  { id: 'kobold',        name: 'Kobold',           type: 'enemy', ac: 12, hpMax: 5,   bonusInit: 2,  dc: null, spellcaster: false, spellSlots: {} },
  { id: 'troll',         name: 'Troll',            type: 'enemy', ac: 15, hpMax: 84,  bonusInit: 1,  dc: null, spellcaster: false, spellSlots: {} },
  { id: 'ogro',          name: 'Ogro',             type: 'enemy', ac: 11, hpMax: 59,  bonusInit: -1, dc: null, spellcaster: false, spellSlots: {} },
  { id: 'cultista',      name: 'Cultista',         type: 'enemy', ac: 12, hpMax: 9,   bonusInit: 1,  dc: null, spellcaster: false, spellSlots: {} },
  { id: 'guardia',       name: 'Guardia',          type: 'ally',  ac: 16, hpMax: 11,  bonusInit: 1,  dc: null, spellcaster: false, spellSlots: {} },
  { id: 'ladron_gremio', name: 'Ladrón de Gremio', type: 'enemy', ac: 13, hpMax: 22,  bonusInit: 3,  dc: null, spellcaster: false, spellSlots: {} },
  { id: 'mago_nigromante', name: 'Nigromante',     type: 'enemy', ac: 12, hpMax: 40,  bonusInit: 2,  dc: 14,   spellcaster: true,  spellSlots: { 1:4, 2:3, 3:3, 4:1 } },
  { id: 'sacerdote',     name: 'Sacerdote',        type: 'ally',  ac: 13, hpMax: 27,  bonusInit: 0,  dc: 13,   spellcaster: true,  spellSlots: { 1:4, 2:3 } },
]

function generateId() {
  return 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

export function useBestiary() {
  const [creatures, setCreatures] = useState([])
  const [loaded, setLoaded]       = useState(false)
  const [search, setSearch]       = useState('')
  const [filterType, setFilterType] = useState('all') // 'all' | 'enemy' | 'ally' | 'player'

  // ─── Carga inicial ────────────────────────────────────────────────────────

  useEffect(() => {
    loadBestiary().then(res => {
      if (res.ok && res.data && res.data.length > 0) {
        setCreatures(res.data)
      } else {
        // Primera vez: cargar seed
        setCreatures(SEED_CREATURES)
        saveBestiary(SEED_CREATURES)
      }
      setLoaded(true)
    })
  }, [])

  // ─── Guardado automático ──────────────────────────────────────────────────

  useEffect(() => {
    if (!loaded) return
    saveBestiary(creatures)
  }, [creatures, loaded])

  // ─── Filtrado ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = creatures
    if (filterType !== 'all') {
      list = list.filter(c => c.type === filterType)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q))
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [creatures, search, filterType])

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  function addCreature(data) {
    const creature = { ...data, id: generateId() }
    setCreatures(prev => [...prev, creature])
    return creature
  }

  function updateCreature(id, patch) {
    setCreatures(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  function deleteCreature(id) {
    setCreatures(prev => prev.filter(c => c.id !== id))
  }

  // ─── Retorno ──────────────────────────────────────────────────────────────

  return {
    creatures,
    filtered,
    loaded,
    search,
    setSearch,
    filterType,
    setFilterType,
    addCreature,
    updateCreature,
    deleteCreature,
  }
}