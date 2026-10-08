/**
 * Encounters.jsx — Página de encuentros guardados (Etapa 4)
 *
 * Funcionalidades:
 *   • Crear encuentros: nombre + notas + lista de seres con cantidades
 *     (desde el bestiario/personajes, o capturando el combate actual)
 *   • Editar y eliminar encuentros (eliminar con doble click para confirmar)
 *   • Cargar encuentro → añade todas las criaturas al combate activo de una
 *     sola vez (update atómico, ids sin pisarse)
 *   • Búsqueda por nombre o notas
 *
 * No recibe props: todo sale de los contextos
 * (Encounters, Combat y UI).
 * Se muestra como pestaña completa: el combate no aparece debajo.
 */

import { useState } from 'react'
import { useEncountersContext } from '../../context/EncountersContext'
import { useCombatContext } from '../../context/CombatContext'
import { useUIContext } from '../../context/UIContext'
import { encounterTotal } from './useEncounters'
import EncounterForm from './EncounterForm'
import styles from './Encounters.module.css'

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })
  } catch {
    return ''
  }
}

export default function Encounters() {
  const {
    filtered, loaded,
    search, setSearch,
    addEncounter, updateEncounter, deleteEncounter,
  } = useEncountersContext()

  const { addCreatures } = useCombatContext()
  const { goToCombat } = useUIContext()

  const [editing, setEditing]       = useState(null)   // encounter | 'new' | null
  const [confirmDel, setConfirmDel] = useState(null)   // encounter id

  function handleSaveNew(data) {
    addEncounter(data)
    setEditing(null)
  }

  function handleSaveEdit(data) {
    updateEncounter(editing.id, data)
    setEditing(null)
  }

  function handleLoad(encounter) {
    const total = encounterTotal(encounter)
    const ok = window.confirm(
      `¿Cargar "${encounter.name}" al combate actual?\n` +
      `Se añadirán ${total} ${total === 1 ? 'criatura' : 'criaturas'}.`
    )
    if (!ok) return

    // Una sola llamada atómica: los ids se asignan en el mismo update
    addCreatures(
      encounter.entries.map(e => ({
        creature: { name: e.name, type: e.type, ...e.data },
        count: e.count,
      }))
    )
  }

  function handleDelete(encounter) {
    if (confirmDel === encounter.id) {
      deleteEncounter(encounter.id)
      setConfirmDel(null)
    } else {
      setConfirmDel(encounter.id)
    }
  }

  return (
    <div className={styles.panel}>

      {/* ── Header ── */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>📋 Encuentros guardados</div>
        <div className={styles.panelHeaderRight}>
          <button className={styles.btnNew} onClick={() => setEditing('new')}>
            + Nuevo encuentro
          </button>
          <button className={styles.btnClose} onClick={goToCombat} title="Volver a la pestaña Combate">
            ✕
          </button>
        </div>
      </div>

      {/* ── Formulario ── */}
      {editing === 'new' && (
        <EncounterForm initial={null} onSave={handleSaveNew} onCancel={() => setEditing(null)} />
      )}
      {editing && editing !== 'new' && (
        <EncounterForm initial={editing} onSave={handleSaveEdit} onCancel={() => setEditing(null)} />
      )}

      {/* ── Búsqueda ── */}
      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar encuentro por nombre o nota…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Lista ── */}
      <div className={styles.list}>
        {!loaded && <div className={styles.empty}>Cargando encuentros…</div>}

        {loaded && filtered.length === 0 && (
          <div className={styles.empty}>
            {search
              ? `Sin resultados para "${search}"`
              : 'No hay encuentros guardados. ¡Creá el primero!'}
          </div>
        )}

        {loaded && filtered.map(enc => {
          const total = encounterTotal(enc)
          return (
            <div key={enc.id} className={styles.encRow}>

              <div className={styles.encInfo} onClick={() => setEditing(enc)} title="Click para editar">
                <div className={styles.encName}>
                  {enc.name}
                  <span className={styles.encDate}>{formatDate(enc.updatedAt || enc.createdAt)}</span>
                </div>

                <div className={styles.encEntries}>
                  {enc.entries.map((e, i) => (
                    <span key={`${e.name}_${i}`} className={`${styles.entryChip} ${styles['chip_' + e.type]}`}>
                      {e.count}× {e.name}
                    </span>
                  ))}
                </div>

                {enc.notes && <div className={styles.encNotes}>{enc.notes}</div>}
              </div>

              <div className={styles.encControls}>
                <span className={styles.encTotal}>{total}</span>
                <button
                  className={styles.btnLoad}
                  onClick={() => handleLoad(enc)}
                  title="Cargar este encuentro al combate actual"
                >
                  ⚔ Cargar
                </button>
                <button
                  className={styles.btnEdit}
                  onClick={() => { setEditing(enc); setConfirmDel(null) }}
                  title="Editar"
                >✏</button>
                <button
                  className={`${styles.btnDelete} ${confirmDel === enc.id ? styles.btnDeleteConfirm : ''}`}
                  onClick={() => handleDelete(enc)}
                  title={confirmDel === enc.id ? 'Click para confirmar' : 'Eliminar'}
                >
                  {confirmDel === enc.id ? '¿Confirmar?' : '🗑'}
                </button>
              </div>

            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      {loaded && (
        <div className={styles.panelFooter}>
          {filtered.length} {filtered.length === 1 ? 'encuentro' : 'encuentros'}
        </div>
      )}
    </div>
  )
}
