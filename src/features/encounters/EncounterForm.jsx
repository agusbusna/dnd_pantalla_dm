/**
 * EncounterForm.jsx — Formulario de creación/edición de encuentros
 *
 * Un encuentro = nombre + notas + lista de entradas (ser + cantidad).
 * Las entradas se pueden armar:
 *   • eligiendo criaturas del bestiario o personajes de la biblioteca
 *   • de un clic, desde el combate actual (agrupa duplicados)
 *
 * Props:
 *   initial   {Object|null}  — encuentro a editar (null = modo creación)
 *   onSave    {Function}     — ({ name, notes, entries }) => void
 *   onCancel  {Function}     — () => void
 */

import { useState } from 'react'
import { useBestiaryContext } from '../../context/BestiaryContext'
import { useCharactersContext } from '../../context/CharactersContext'
import { useCombatContext } from '../../context/CombatContext'
import { entryFrom, entriesFromCombatants, mergeEntry, encounterTotal } from './useEncounters'
import styles from './Encounters.module.css'

const TYPE_LABEL = { enemy: 'Enemigo', ally: 'Aliado', player: 'PJ' }
const MAX_COUNT = 20

function toForm(encounter) {
  if (!encounter) return { name: '', notes: '', entries: [] }
  return {
    name: encounter.name || '',
    notes: encounter.notes || '',
    entries: (encounter.entries || []).map(e => ({ ...e, data: { ...e.data } })),
  }
}

function clampCount(val) {
  return Math.max(1, Math.min(MAX_COUNT, parseInt(val, 10) || 1))
}

export default function EncounterForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => toForm(initial))
  const [selId, setSelId]     = useState('')
  const [selCount, setSelCount] = useState(1)

  const { creatures }    = useBestiaryContext()
  const { characters }   = useCharactersContext()
  const { combatants }   = useCombatContext()

  const isEdit = !!initial
  const total = encounterTotal({ entries: form.entries })
  const hasCombat = combatants.length > 0

  // Opciones del selector: bestiario + personajes (listas COMPLETAS,
  // sin aplicar la búsqueda del panel de la lista principal)
  const options = [
    { group: 'Bestiario', items: creatures.map(c => ({ key: 'b:' + c.id, ref: c })) },
    { group: 'Personajes', items: characters.map(c => ({ key: 'c:' + c.id, ref: c })) },
  ].filter(g => g.items.length > 0)

  const selectedRef = options
    .flatMap(g => g.items)
    .find(o => o.key === selId)?.ref

  function setField(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  function handleAddEntry() {
    if (!selectedRef) return
    const entry = entryFrom(selectedRef)
    entry.count = clampCount(selCount)
    setForm(f => ({ ...f, entries: mergeEntry(f.entries, entry) }))
    setSelId('')
    setSelCount(1)
  }

  function fillFromCombat() {
    if (!hasCombat) return
    setForm(f => ({ ...f, entries: entriesFromCombatants(combatants) }))
  }

  function setEntryCount(idx, val) {
    setForm(f => ({
      ...f,
      entries: f.entries.map((e, i) => (i === idx ? { ...e, count: clampCount(val) } : e)),
    }))
  }

  function removeEntry(idx) {
    setForm(f => ({ ...f, entries: f.entries.filter((_, i) => i !== idx) }))
  }

  function handleSave() {
    if (!form.name.trim() || form.entries.length === 0) return
    onSave({
      name: form.name.trim(),
      notes: form.notes,
      entries: form.entries,
    })
  }

  return (
    <div className={styles.formPanel}>
      <div className={styles.formTitle}>
        {isEdit ? '✏️ Editar encuentro' : '➕ Nuevo encuentro'}
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Nombre *</label>
          <input
            type="text"
            placeholder="Ej: Emboscada del bosque"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            autoFocus
          />
        </div>
        <div className={styles.formFieldWide}>
          <label>Notas</label>
          <input
            type="text"
            placeholder="Ej: Refuerzos en la ronda 3"
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
          />
        </div>
      </div>

      {/* ── Selector de entradas ── */}
      <div className={styles.pickerBar}>
        <select
          className={styles.pickerSelect}
          value={selId}
          onChange={e => setSelId(e.target.value)}
        >
          <option value="">— Elegir criatura o personaje —</option>
          {options.map(g => (
            <optgroup key={g.group} label={g.group}>
              {g.items.map(o => (
                <option key={o.key} value={o.key}>
                  {o.ref.name} (CA {o.ref.ac ?? '?'} · HP {o.ref.hpMax ?? '?'})
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <input
          type="number"
          min="1"
          max={MAX_COUNT}
          className={styles.pickerCount}
          value={selCount}
          onChange={e => setSelCount(e.target.value)}
        />

        <button
          className={styles.btnAddEntry}
          onClick={handleAddEntry}
          disabled={!selectedRef}
        >
          + Agregar
        </button>

        <button
          className={styles.btnFromCombat}
          onClick={fillFromCombat}
          disabled={!hasCombat}
          title="Toma el combate actual y agrupa los duplicados"
        >
          ⚔ Desde combate
        </button>
      </div>

      {/* ── Entradas ── */}
      <div className={styles.entriesBox}>
        {form.entries.length === 0 ? (
          <div className={styles.entriesEmpty}>
            Sin criaturas aún — elegí del bestiario o traé el combate actual.
          </div>
        ) : form.entries.map((e, idx) => (
          <div key={`${e.name}_${idx}`} className={styles.entryRow}>
            <span className={`${styles.entryBadge} ${styles['badge_' + e.type]}`}>
              {TYPE_LABEL[e.type] || e.type}
            </span>
            <span className={styles.entryName}>{e.name}</span>
            <span className={styles.entryStats}>
              CA {e.data.ac} · HP {e.data.hpMax}
              {e.data.dc ? ` · DC ${e.data.dc}` : ''}
            </span>

            <span className={styles.entryCountGroup}>
              <button
                className={styles.countBtn}
                onClick={() => setEntryCount(idx, e.count - 1)}
                disabled={e.count <= 1}
              >−</button>
              <input
                type="number"
                min="1"
                max={MAX_COUNT}
                className={styles.countInput}
                value={e.count}
                onChange={ev => setEntryCount(idx, ev.target.value)}
              />
              <button
                className={styles.countBtn}
                onClick={() => setEntryCount(idx, e.count + 1)}
                disabled={e.count >= MAX_COUNT}
              >+</button>
            </span>

            <button
              className={styles.entryRemove}
              onClick={() => removeEntry(idx)}
              title="Quitar del encuentro"
            >✕</button>
          </div>
        ))}
      </div>

      <div className={styles.formActions}>
        <button
          className={styles.btnSave}
          onClick={handleSave}
          disabled={!form.name.trim() || form.entries.length === 0}
        >
          {isEdit ? '✓ Guardar cambios' : `✓ Guardar encuentro (${total})`}
        </button>
        <button className={styles.btnCancel} onClick={onCancel}>
          Cancelar
        </button>
        {form.entries.length === 0 && (
          <span className={styles.formHint}>Agregá al menos una criatura</span>
        )}
      </div>
    </div>
  )
}
