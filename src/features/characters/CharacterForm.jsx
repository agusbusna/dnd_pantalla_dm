/**
 * CharacterForm.jsx — Formulario para crear y editar personajes/aliados
 *
 * Campos:
 *   Base:    nombre, tipo, AC, HP máx, bonus iniciativa, DC, spellcaster, spell slots
 *   Extra:   clase, nivel, STR, DEX, CON, INT, WIS, CHA
 *
 * El bonus de iniciativa se puede sincronizar al modificador de DEX con un botón.
 */

import { useState } from 'react'
import { abilityMod } from './useCharacters'
import styles from './Characters.module.css'

const EMPTY = {
  name: '', type: 'player', clase: '', nivel: 1,
  ac: '', hpMax: '', bonusInit: '', dc: '',
  spellcaster: false,
  spellSlots: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
}

const ABILITIES = [
  { key: 'str', label: 'FUE' },
  { key: 'dex', label: 'DES' },
  { key: 'con', label: 'CON' },
  { key: 'int', label: 'INT' },
  { key: 'wis', label: 'SAB' },
  { key: 'cha', label: 'CAR' },
]

function toForm(ch) {
  if (!ch) return EMPTY
  return {
    name:       ch.name       ?? '',
    type:       ch.type       ?? 'player',
    clase:      ch.clase      ?? '',
    nivel:      ch.nivel      ?? 1,
    ac:         ch.ac         ?? '',
    hpMax:      ch.hpMax      ?? '',
    bonusInit:  ch.bonusInit  ?? '',
    dc:         ch.dc         ?? '',
    spellcaster: ch.spellcaster ?? false,
    spellSlots: { 1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0, ...ch.spellSlots },
    str: ch.str ?? 10, dex: ch.dex ?? 10, con: ch.con ?? 10,
    int: ch.int ?? 10, wis: ch.wis ?? 10, cha: ch.cha ?? 10,
  }
}

export default function CharacterForm({ initial, onSave, onCancel }) {
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

  // Sincroniza bonusInit con el modificador de DEX actual
  function syncInitFromDex() {
    setForm(f => ({ ...f, bonusInit: abilityMod(f.dex) }))
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
      clase:      form.clase.trim(),
      nivel:      parseInt(form.nivel) || 1,
      ac:         parseInt(form.ac)        || 0,
      hpMax:      parseInt(form.hpMax)     || 0,
      bonusInit:  parseInt(form.bonusInit) || 0,
      dc:         form.dc !== '' ? (parseInt(form.dc) || null) : null,
      spellcaster: form.spellcaster,
      spellSlots: slots,
      str: parseInt(form.str) || 10,
      dex: parseInt(form.dex) || 10,
      con: parseInt(form.con) || 10,
      int: parseInt(form.int) || 10,
      wis: parseInt(form.wis) || 10,
      cha: parseInt(form.cha) || 10,
    })
  }

  const isEdit = !!initial
  const dexMod = abilityMod(parseInt(form.dex) || 10)

  return (
    <div className={styles.formPanel}>
      <div className={styles.formTitle}>
        {isEdit ? '✏️ Editar personaje' : '➕ Nuevo personaje / aliado'}
      </div>

      {/* ── Datos base ── */}
      <div className={styles.formSection}>Identidad</div>
      <div className={styles.formGrid}>
        <div className={`${styles.formField} ${styles.fieldWide}`}>
          <label>Nombre *</label>
          <input
            type="text" placeholder="Ej: Lyra Escudodemármol"
            value={form.name} onChange={e => set('name', e.target.value)}
            autoFocus
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="player">Jugador (PJ)</option>
            <option value="ally">Aliado / NPC</option>
          </select>
        </div>
        <div className={styles.formField}>
          <label>Clase</label>
          <input type="text" placeholder="Ej: Paladín"
            value={form.clase} onChange={e => set('clase', e.target.value)} />
        </div>
        <div className={styles.formField}>
          <label>Nivel</label>
          <input type="number" min="1" max="20" placeholder="1"
            value={form.nivel} onChange={e => set('nivel', e.target.value)} />
        </div>
      </div>

      {/* ── Stats de combate ── */}
      <div className={styles.formSection}>Combate</div>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>AC</label>
          <input type="number" placeholder="14"
            value={form.ac} onChange={e => set('ac', e.target.value)} />
        </div>
        <div className={styles.formField}>
          <label>HP máximo</label>
          <input type="number" placeholder="40"
            value={form.hpMax} onChange={e => set('hpMax', e.target.value)} />
        </div>
        <div className={styles.formField}>
          <label>
            Bonus ini.
            <button
              type="button"
              className={styles.syncBtn}
              onClick={syncInitFromDex}
              title={`Usar mod. DES (${dexMod >= 0 ? '+' : ''}${dexMod})`}
            >
              ↺ DES
            </button>
          </label>
          <input type="number" placeholder="2"
            value={form.bonusInit} onChange={e => set('bonusInit', e.target.value)} />
        </div>
        <div className={styles.formField}>
          <label>DC conjuro</label>
          <input type="number" placeholder="—"
            value={form.dc} onChange={e => set('dc', e.target.value)} />
        </div>
        <div className={`${styles.formField} ${styles.checkField}`}>
          <input type="checkbox" id="ch-sc"
            checked={form.spellcaster}
            onChange={e => set('spellcaster', e.target.checked)} />
          <label htmlFor="ch-sc" className={styles.checkLabel}>Lanzador de conjuros</label>
        </div>
      </div>

      {/* ── Puntuaciones de habilidad ── */}
      <div className={styles.formSection}>Puntuaciones de habilidad</div>
      <div className={styles.abilityGrid}>
        {ABILITIES.map(({ key, label }) => {
          const score = parseInt(form[key]) || 10
          const mod   = abilityMod(score)
          return (
            <div key={key} className={styles.abilityField}>
              <label>{label}</label>
              <input
                type="number" min="1" max="30"
                value={form[key]}
                onChange={e => set(key, e.target.value)}
              />
              <span className={styles.abilityMod}>
                {mod >= 0 ? '+' : ''}{mod}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Spell slots ── */}
      {form.spellcaster && (
        <div className={styles.spellSection}>
          <div className={styles.formSection}>Espacios de conjuro</div>
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
          {isEdit ? '✓ Guardar cambios' : '✓ Agregar a la biblioteca'}
        </button>
        <button className={styles.btnCancel} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}
