import { useState } from 'react'
import styles from './AddCombatantPanel.module.css'

const DEFAULT = {
  name: '', type: 'enemy', init: '', bonusInit: '',
  ac: '', dc: '', hpMax: '',
  spellcaster: false, spellSlots: { 1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0 }
}

export default function AddCombatantPanel({ onAdd, onCancel }) {
  const [form, setForm] = useState(DEFAULT)

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }
  function setSlot(lv, val) {
    setForm(f => ({ ...f, spellSlots: { ...f.spellSlots, [lv]: Math.max(0, parseInt(val) || 0) } }))
  }

  function handleAdd() {
    if (!form.name.trim()) return
    const slots = {}
    if (form.spellcaster) {
      Object.entries(form.spellSlots).forEach(([k, v]) => { if (v > 0) slots[k] = v })
    }
    onAdd({
      name: form.name.trim(),
      type: form.type,
      init: parseInt(form.init) || 0,
      bonusInit: parseInt(form.bonusInit) || 0,
      ac: parseInt(form.ac) || 0,
      dc: form.dc ? (parseInt(form.dc) || null) : null,
      hpMax: parseInt(form.hpMax) || 0,
      hpLeft: parseInt(form.hpMax) || 0,
      spellcaster: form.spellcaster,
      spellSlots: slots,
      expanded: false,
    })
    setForm(DEFAULT)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>➕ Nuevo participante</div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label>Nombre *</label>
          <input type="text" placeholder="Ej: Goblin Arquero" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label>Tipo</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="player">Jugador (PJ)</option>
            <option value="enemy">Enemigo</option>
            <option value="ally">Aliado / NPC</option>
          </select>
        </div>
        <div className={styles.field}>
          <label>Iniciativa (total)</label>
          <input type="number" placeholder="15" value={form.init} onChange={e => set('init', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label>Bonus iniciativa</label>
          <input type="number" placeholder="2" value={form.bonusInit} onChange={e => set('bonusInit', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label>Clase de Armadura</label>
          <input type="number" placeholder="14" value={form.ac} onChange={e => set('ac', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label>DC de conjuro</label>
          <input type="number" placeholder="—" value={form.dc} onChange={e => set('dc', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label>HP máximo</label>
          <input type="number" placeholder="40" value={form.hpMax} onChange={e => set('hpMax', e.target.value)} />
        </div>
        <div className={`${styles.field} ${styles.checkField}`}>
          <input type="checkbox" id="isc" checked={form.spellcaster} onChange={e => set('spellcaster', e.target.checked)} />
          <label htmlFor="isc" style={{ color: 'var(--text-1)', minWidth: 'auto', cursor: 'pointer' }}>Lanzador de conjuros</label>
        </div>
      </div>

      {form.spellcaster && (
        <div className={styles.spellSection}>
          <div className={styles.spellTitle}>Espacios de conjuro disponibles</div>
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

      <div className={styles.actions}>
        <button className={styles.btnAdd} onClick={handleAdd} disabled={!form.name.trim()}>✓ Agregar al combate</button>
        <button className={styles.btnCancel} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}
