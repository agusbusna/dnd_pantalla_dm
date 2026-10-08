/**
 * Bestiary.jsx — Panel principal del bestiario
 *
 * Funcionalidades:
 *   • Lista de criaturas con búsqueda y filtro por tipo
 *   • Cada criatura muestra: nombre, tipo, AC, HP, bonusInit, DC, spellcaster
 *   • Selector de cantidad + botón "Añadir al combate"
 *   • Botones editar y eliminar por criatura
 *   • Formulario de creación/edición inline
 *
 * No recibe props: todo sale de los contextos
 * (Bestiary → lista/CRUD, Combat → añadir al combate, UI → pestaña activa).
 * Se muestra como pestaña completa: el combate no aparece debajo.
 */

import { useState } from 'react'
import { useBestiaryContext } from '../../context/BestiaryContext'
import { useCombatContext } from '../../context/CombatContext'
import { useUIContext } from '../../context/UIContext'
import CreatureForm from './CreatureForm'
import styles from './Bestiary.module.css'

const TYPE_LABEL = {
  enemy:  'Enemigo',
  ally:   'Aliado',
  player: 'PJ',
}

const TYPE_FILTER_OPTIONS = [
  { value: 'all',    label: 'Todos' },
  { value: 'enemy',  label: 'Enemigos' },
  { value: 'ally',   label: 'Aliados' },
  { value: 'player', label: 'PJs' },
]

export default function Bestiary() {
  const {
    filtered, loaded,
    search, setSearch,
    filterType, setFilterType,
    addCreature, updateCreature, deleteCreature,
  } = useBestiaryContext()

  const { addCreatureFromBestiary } = useCombatContext()
  const { goToCombat } = useUIContext()

  const [counts, setCounts]         = useState({})
  const [editing, setEditing]       = useState(null)   // creature | 'new' | null
  const [confirmDel, setConfirmDel] = useState(null)   // creature id

  function getCount(id) { return counts[id] || 1 }
  function setCount(id, val) {
    setCounts(prev => ({ ...prev, [id]: Math.max(1, Math.min(20, parseInt(val) || 1)) }))
  }

  function handleAdd(creature) {
    addCreatureFromBestiary(creature, getCount(creature.id))
    setCounts(prev => ({ ...prev, [creature.id]: 1 }))
  }

  function handleSaveNew(data) {
    addCreature(data)
    setEditing(null)
  }

  function handleSaveEdit(data) {
    updateCreature(editing.id, data)
    setEditing(null)
  }

  function handleDelete(creature) {
    if (confirmDel === creature.id) {
      deleteCreature(creature.id)
      setConfirmDel(null)
    } else {
      setConfirmDel(creature.id)
    }
  }

  return (
    <div className={styles.panel}>

      {/* Header del panel */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>📖 Bestiario</div>
        <div className={styles.panelHeaderRight}>
          <button className={styles.btnNew} onClick={() => setEditing('new')}>
            + Nueva criatura
          </button>
          <button className={styles.btnClose} onClick={goToCombat} title="Volver a la pestaña Combate">
            ✕
          </button>
        </div>
      </div>

      {/* Formulario de creación / edición */}
      {editing === 'new' && (
        <CreatureForm
          initial={null}
          onSave={handleSaveNew}
          onCancel={() => setEditing(null)}
        />
      )}
      {editing && editing !== 'new' && (
        <CreatureForm
          initial={editing}
          onSave={handleSaveEdit}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* Búsqueda y filtros */}
      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar criatura…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.filterTabs}>
          {TYPE_FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`${styles.filterTab} ${filterType === opt.value ? styles.filterTabActive : ''}`}
              onClick={() => setFilterType(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className={styles.list}>
        {!loaded && (
          <div className={styles.empty}>Cargando bestiario…</div>
        )}

        {loaded && filtered.length === 0 && (
          <div className={styles.empty}>
            {search ? `Sin resultados para "${search}"` : 'No hay criaturas. ¡Creá la primera!'}
          </div>
        )}

        {loaded && filtered.map(cr => (
          <div key={cr.id} className={`${styles.creatureRow} ${styles['type_' + cr.type]}`}>

            <div className={styles.creatureInfo}>
              <div className={styles.creatureName}>
                {cr.name}
                {cr.spellcaster && (
                  <span className={styles.spellTag} title="Lanzador de conjuros">✨</span>
                )}
              </div>
              <div className={styles.creatureMeta}>
                <span className={`${styles.typeBadge} ${styles['badge_' + cr.type]}`}>
                  {TYPE_LABEL[cr.type] || cr.type}
                </span>
                <span className={styles.stat}><span className={styles.statL}>AC</span>{cr.ac}</span>
                <span className={styles.stat}><span className={styles.statL}>HP</span>{cr.hpMax}</span>
                <span className={styles.stat}>
                  <span className={styles.statL}>ini</span>
                  {cr.bonusInit > 0 ? '+' : ''}{cr.bonusInit || 0}
                </span>
                {cr.dc && (
                  <span className={styles.stat}><span className={styles.statL}>DC</span>{cr.dc}</span>
                )}
              </div>
            </div>

            <div className={styles.creatureControls}>
              <div className={styles.addGroup}>
                <button
                  className={styles.countBtn}
                  onClick={() => setCount(cr.id, getCount(cr.id) - 1)}
                  disabled={getCount(cr.id) <= 1}
                >−</button>
                <input
                  type="number" min="1" max="20"
                  className={styles.countInput}
                  value={getCount(cr.id)}
                  onChange={e => setCount(cr.id, e.target.value)}
                />
                <button
                  className={styles.countBtn}
                  onClick={() => setCount(cr.id, getCount(cr.id) + 1)}
                  disabled={getCount(cr.id) >= 20}
                >+</button>
                <button
                  className={styles.btnAddCombat}
                  onClick={() => handleAdd(cr)}
                  title={`Añadir ${getCount(cr.id)} al combate`}
                >
                  ⚔ Añadir
                </button>
              </div>

              <div className={styles.crudGroup}>
                <button
                  className={styles.btnEdit}
                  onClick={() => { setEditing(cr); setConfirmDel(null) }}
                  title="Editar criatura"
                >✏</button>
                <button
                  className={`${styles.btnDelete} ${confirmDel === cr.id ? styles.btnDeleteConfirm : ''}`}
                  onClick={() => handleDelete(cr)}
                  title={confirmDel === cr.id ? 'Click de nuevo para confirmar' : 'Eliminar del bestiario'}
                >
                  {confirmDel === cr.id ? '¿Confirmar?' : '🗑'}
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {loaded && (
        <div className={styles.panelFooter}>
          {filtered.length} {filtered.length === 1 ? 'criatura' : 'criaturas'}
        </div>
      )}
    </div>
  )
}
