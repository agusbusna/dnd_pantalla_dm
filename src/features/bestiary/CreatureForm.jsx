/**
 * CreatureForm.jsx — Formulario para crear y editar criaturas del bestiario
 *
 * Props:
 *   initial   {Object|null}  — datos iniciales para edición (null = modo creación)
 *   onSave    {Function}     — (data) => void
 *   onCancel  {Function}     — () => void
 */

import { useState } from 'react'
import styles from './Bestiary.module.css'

const EMPTY = {
  name: '', type: 'enemy',
  ac: '', hpMax: '', bonusInit: '', dc: '',
  spellcaster: false,
  spellSlots: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
}

function toForm(creature) {
  if (!creature) return EMPTY
  return {
    name:       creature.name       ?? '',
    type:       creature.type       ?? 'enemy',
    ac:         creature.ac         ?? '',
    hpMax:      creature.hpMax      ?? '',
    bonusInit:  creature.bonusInit  ?? '',
    dc:         creature.dc         ?? '',
    spellcaster: creature.spellcaster ?? false,
    spellSlots: { 1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0, ...creature.spellSlots },
  }
}

export default function CreatureForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => toForm(initial))

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  function setSlot(lv, val) {
    setForm(f => ({
      ...f,
      spellSlots: { ...f.spellSlots, [lv]: Math.max(0, parseInt(val) || 0) }
    }))
  }

  function handleSave() {
    if (!form.name.trim()) return
    const slots = {}
    if (form.spellcaster) {
      Object.entries(form.spellSlots).forEach(([k, v]) => { if (v > 0) slots[k] = v })
    }
    onSave({
      name:       form.name.trim(),
      type:       form.type,
      ac:         parseInt(form.ac)        || 0,
      hpMax:      parseInt(form.hpMax)     || 0,
      bonusInit:  parseInt(form.bonusInit) || 0,
      dc:         form.dc !== '' ? (parseInt(form.dc) || null) : null,
      spellcaster: form.spellcaster,
      spellSlots: slots,
    })
  }

  const isEdit = !!initial

  return (
    <div className={styles.formPanel}>
      <div className={styles.formTitle}>
        {isEdit ? '✏️ Editar criatura' : '➕ Nueva criatura'}
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Nombre *</label>
          <input
            type="text" placeholder="Ej: Goblin Arquero"
            value={form.name} onChange={e => set('name', e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.formField}>
          <label>Tipo</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="enemy">Enemigo</option>
            <option value="ally">Aliado / NPC</option>
            <option value="player">Jugador (PJ)</option>
          </select>
        </div>

        <div className={styles.formField}>
          <label>AC</label>
          <input type="number" placeholder="14"
            value={form.ac} onChange={e => set('ac', e.target.value)} />
        </div>

        <div className={styles.formField}>
          <label>HP máximo</label>
          <input type="number" placeholder="20"
            value={form.hpMax} onChange={e => set('hpMax', e.target.value)} />
        </div>

        <div className={styles.formField}>
          <label>Bonus iniciativa</label>
          <input type="number" placeholder="2"
            value={form.bonusInit} onChange={e => set('bonusInit', e.target.value)} />
        </div>

        <div className={styles.formField}>
          <label>DC de conjuro</label>
          <input type="number" placeholder="—"
            value={form.dc} onChange={e => set('dc', e.target.value)} />
        </div>

        <div className={`${styles.formField} ${styles.checkField}`}>
          <input type="checkbox" id="form-sc"
            checked={form.spellcaster}
            onChange={e => set('spellcaster', e.target.checked)} />
          <label htmlFor="form-sc" className={styles.checkLabel}>
            Lanzador de conjuros
          </label>
        </div>
      </div>

      {form.spellcaster && (
        <div className={styles.spellSection}>
          <div className={styles.spellTitle}>Espacios de conjuro</div>
          <div className={styles.spellGrid}>
            {[1,2,3,4,5,6,7,8,9].map(lv => (
              <div key={lv} className={styles.spellField}>
                <label>Niv {lv}</label>
                <input
                  type="number" min="0" max="4"
                  value={form.spellSlots[lv] || 0}
                  onChange={e => setSlot(lv, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.formActions}>
        <button
          className={styles.btnSave}
          onClick={handleSave}
          disabled={!form.name.trim()}
        >
          {isEdit ? '✓ Guardar cambios' : '✓ Agregar al bestiario'}
        </button>
        <button className={styles.btnCancel} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
