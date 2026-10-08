/**
 * Characters.jsx — Panel de biblioteca de personajes y aliados
 *
 * No recibe props: todo sale de los contextos
 * (Characters → lista/CRUD, Combat → añadir al combate, UI → pestaña activa).
 * Se muestra como pestaña completa: el combate no aparece debajo.
 */

import { useState } from 'react'
import { useCharactersContext } from '../../context/CharactersContext'
import { useCombatContext } from '../../context/CombatContext'
import { useUIContext } from '../../context/UIContext'
import { abilityMod } from './useCharacters'
import CharacterForm from './CharacterForm'
import styles from './Characters.module.css'

const TYPE_LABEL  = { player: 'PJ', ally: 'Aliado' }
const FILTER_OPTS = [
  { value: 'all',    label: 'Todos' },
  { value: 'player', label: 'PJs' },
  { value: 'ally',   label: 'Aliados' },
]
const ABILITIES = ['str','dex','con','int','wis','cha']
const ABILITY_LABELS = { str:'FUE', dex:'DES', con:'CON', int:'INT', wis:'SAB', cha:'CAR' }

export default function Characters() {
  const {
    filtered, loaded,
    search, setSearch,
    filterType, setFilterType,
    addCharacter, updateCharacter, deleteCharacter,
  } = useCharactersContext()

  const { addCreatureFromBestiary } = useCombatContext()
  const { goToCombat } = useUIContext()

  const [editing, setEditing]       = useState(null)   // character | 'new' | null
  const [confirmDel, setConfirmDel] = useState(null)
  const [expanded, setExpanded]     = useState(null)   // id del personaje expandido

  function handleSaveNew(data) {
    addCharacter(data)
    setEditing(null)
  }

  function handleSaveEdit(data) {
    updateCharacter(editing.id, data)
    setEditing(null)
  }

  function handleDelete(ch) {
    if (confirmDel === ch.id) {
      deleteCharacter(ch.id)
      setConfirmDel(null)
    } else {
      setConfirmDel(ch.id)
    }
  }

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
  }

  return (
    <div className={styles.panel}>

      {/* ── Header ── */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>🧙 Personajes y Aliados</div>
        <div className={styles.panelHeaderRight}>
          <button className={styles.btnNew} onClick={() => setEditing('new')}>
            + Nuevo
          </button>
          <button className={styles.btnClose} onClick={goToCombat} title="Volver a la pestaña Combate">✕</button>
        </div>
      </div>

      {/* ── Formulario ── */}
      {editing === 'new' && (
        <CharacterForm initial={null} onSave={handleSaveNew} onCancel={() => setEditing(null)} />
      )}
      {editing && editing !== 'new' && (
        <CharacterForm initial={editing} onSave={handleSaveEdit} onCancel={() => setEditing(null)} />
      )}

      {/* ── Búsqueda y filtros ── */}
      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar por nombre o clase…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.filterTabs}>
          {FILTER_OPTS.map(opt => (
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

      {/* ── Lista ── */}
      <div className={styles.list}>
        {!loaded && <div className={styles.empty}>Cargando…</div>}

        {loaded && filtered.length === 0 && (
          <div className={styles.empty}>
            {search ? `Sin resultados para "${search}"` : 'No hay personajes. ¡Creá el primero!'}
          </div>
        )}

        {loaded && filtered.map(ch => {
          const isExpanded = expanded === ch.id
          return (
            <div key={ch.id} className={`${styles.charRow} ${styles['type_' + ch.type]}`}>

              {/* Fila principal */}
              <div className={styles.charMain}>

                {/* Info */}
                <div className={styles.charInfo} onClick={() => toggleExpand(ch.id)} style={{ cursor: 'pointer' }}>
                  <div className={styles.charName}>
                    {ch.name}
                    <span className={`${styles.typeBadge} ${styles['badge_' + ch.type]}`}>
                      {TYPE_LABEL[ch.type] || ch.type}
                    </span>
                    {ch.spellcaster && <span className={styles.spellTag} title="Lanzador de conjuros">✨</span>}
                  </div>
                  <div className={styles.charMeta}>
                    {ch.clase && <span className={styles.metaItem}>{ch.clase}</span>}
                    {ch.nivel && <span className={styles.metaItem}>Niv {ch.nivel}</span>}
                    <span className={styles.stat}><span className={styles.statL}>AC</span>{ch.ac}</span>
                    <span className={styles.stat}><span className={styles.statL}>HP</span>{ch.hpMax}</span>
                    <span className={styles.stat}>
                      <span className={styles.statL}>ini</span>
                      {ch.bonusInit > 0 ? '+' : ''}{ch.bonusInit || 0}
                    </span>
                    {ch.dc && <span className={styles.stat}><span className={styles.statL}>DC</span>{ch.dc}</span>}
                  </div>
                </div>

                {/* Controles */}
                <div className={styles.charControls}>
                  <button
                    className={styles.btnAddCombat}
                    onClick={() => addCreatureFromBestiary(ch, 1)}
                    title="Añadir al combate"
                  >
                    ⚔ Añadir
                  </button>
                  <button
                    className={styles.btnEdit}
                    onClick={() => { setEditing(ch); setConfirmDel(null) }}
                    title="Editar"
                  >✏</button>
                  <button
                    className={`${styles.btnDelete} ${confirmDel === ch.id ? styles.btnDeleteConfirm : ''}`}
                    onClick={() => handleDelete(ch)}
                    title={confirmDel === ch.id ? 'Click para confirmar' : 'Eliminar'}
                  >
                    {confirmDel === ch.id ? '¿Confirmar?' : '🗑'}
                  </button>
                  <button
                    className={styles.btnExpand}
                    onClick={() => toggleExpand(ch.id)}
                    title={isExpanded ? 'Ocultar atributos' : 'Ver atributos'}
                  >
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* Atributos expandidos */}
              {isExpanded && (
                <div className={styles.abilityRow}>
                  {ABILITIES.map(key => {
                    const score = ch[key] || 10
                    const mod   = abilityMod(score)
                    return (
                      <div key={key} className={styles.abilityChip}>
                        <span className={styles.abilityLabel}>{ABILITY_LABELS[key]}</span>
                        <span className={styles.abilityScore}>{score}</span>
                        <span className={styles.abilityModDisplay}>
                          {mod >= 0 ? '+' : ''}{mod}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

            </div>
          )
        })}
      </div>

      {/* Footer */}
      {loaded && (
        <div className={styles.panelFooter}>
          {filtered.length} {filtered.length === 1 ? 'personaje' : 'personajes'}
        </div>
      )}
    </div>
  )
}
