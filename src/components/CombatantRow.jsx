/**
 * CombatantRow.jsx
 *
 * Cambios respecto a la versión anterior:
 *   • Recibe isFirst, isLast, onMoveUp, onMoveDown como props
 *   • Botones ↑ ↓ en el header de la fila para reordenamiento manual
 *   • El badge de iniciativa muestra un indicador visual cuando hay orden manual
 *   • Acciones rápidas de daño/curación en la tarjeta COMPRIMIDA: campo de
 *     cantidad + botones 💥/💚 junto al HP, sin abrir el detalle
 */

import { useState } from 'react'
import styles from './CombatantRow.module.css'

const CONDITIONS = [
  'Cegado','Encantado','Asustado','Aferrado','Incapacitado',
  'Invisible','Paralizado','Petrificado','Envenenado','Derribado',
  'Restringido','Aturdido','Inconsciente','Concentración','Maldito'
]

function hpPct(c) {
  if (!c.hpMax) return 100
  return Math.max(0, Math.min(100, Math.round(c.hpLeft / c.hpMax * 100)))
}

function hpColor(pct) {
  if (pct > 60) return '#27ae60'
  if (pct > 30) return '#e67e22'
  return '#c0392b'
}

export default function CombatantRow({
  combatant: c,
  isActive,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  const [dmgVal, setDmgVal] = useState('')
  const [healVal, setHealVal] = useState('')
  const [quickVal, setQuickVal] = useState('')  // cantidad rápida (tarjeta comprimida)
  const [condSel, setCondSel] = useState('')

  const pct = hpPct(c)
  const col = hpColor(pct)
  const hasManualOrder = c.order !== undefined

  /** Baja HP (mínimo 0); al llegar a 0 marca muerte. */
  function dealDamage(v) {
    const newHp = Math.max(0, c.hpLeft - v)
    onUpdate({ hpLeft: newHp, dead: newHp === 0 ? true : c.dead })
  }

  /** Sube HP (máximo hpMax) y revierte la muerte. */
  function healAmount(v) {
    const newHp = Math.min(c.hpMax || 9999, c.hpLeft + v)
    onUpdate({ hpLeft: newHp, dead: false })
  }

  function applyDmg() {
    const v = parseInt(dmgVal)
    if (!v || v <= 0) return
    dealDamage(v)
    setDmgVal('')
  }

  function applyHeal() {
    const v = parseInt(healVal)
    if (!v || v <= 0) return
    healAmount(v)
    setHealVal('')
  }

  /** 💥/💚 del header: un mismo campo de cantidad para ambas acciones. */
  function applyQuick(kind) {
    const v = parseInt(quickVal)
    if (!v || v <= 0) return
    if (kind === 'dmg') dealDamage(v)
    else healAmount(v)
    setQuickVal('')
  }

  function addCond() {
    if (!condSel || c.conditions.includes(condSel)) return
    onUpdate({ conditions: [...c.conditions, condSel] })
    setCondSel('')
  }

  function removeCond(cond) {
    onUpdate({ conditions: c.conditions.filter(x => x !== cond) })
  }

  function toggleSlot(level, idx) {
    const used = c.spellUsed[level] || 0
    const total = c.spellSlots[level] || 0
    const newUsed = idx < used ? idx : Math.min(total, idx + 1)
    onUpdate({ spellUsed: { ...c.spellUsed, [level]: newUsed } })
  }

  return (
    <div className={`${styles.row} ${isActive ? styles.active : ''} ${c.dead ? styles.dead : ''}`}>

      {/* ── Header ── */}
      <div className={styles.header} onClick={() => onUpdate({ expanded: !c.expanded })}>

        {/* Controles de reordenamiento — no propagan el click al header */}
        <div className={styles.orderControls} onClick={e => e.stopPropagation()}>
          <button
            className={styles.orderBtn}
            onClick={onMoveUp}
            disabled={isFirst}
            title="Subir en el orden de iniciativa"
          >
            ↑
          </button>
          <button
            className={styles.orderBtn}
            onClick={onMoveDown}
            disabled={isLast}
            title="Bajar en el orden de iniciativa"
          >
            ↓
          </button>
        </div>

        {/* Badge de iniciativa */}
        <div
          className={`${styles.initBadge} ${styles['type_' + c.type]} ${hasManualOrder ? styles.initManual : ''}`}
          title={hasManualOrder ? 'Orden manual activo' : `Iniciativa: ${c.init}`}
        >
          {c.init}
        </div>

        {/* Nombre y condiciones */}
        <div className={styles.nameBlock}>
          <div className={styles.name}>
            {c.name}
            {isActive && <span className={styles.activeDot} title="Turno activo" />}
            {c.dead && <span className={styles.deadTag}>☠</span>}
          </div>
          {c.conditions.length > 0 && (
            <div className={styles.condSummary}>{c.conditions.join(' · ')}</div>
          )}
        </div>

        {/* HP + acciones rápidas (tarjeta comprimida) */}
        <div className={styles.hpBlock}>
          <div className={styles.hpText}>
            <span style={{ color: col }}>{c.hpLeft}</span>
            <span className={styles.hpMax}>/{c.hpMax || '?'}</span>

            {/* Daño/curación sin expandir — no debe abrir la tarjeta */}
            <div className={styles.quickBar} onClick={e => e.stopPropagation()}>
              <input
                type="number" min="1" placeholder="Nº"
                className={styles.quickInput}
                value={quickVal}
                onChange={e => setQuickVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyQuick('dmg')}
                title="Cantidad rápida — Enter aplica daño"
                aria-label="Cantidad de daño o curación"
              />
              <button
                className={styles.quickDmg}
                onClick={() => applyQuick('dmg')}
                title="Aplicar daño"
              >
                💥
              </button>
              <button
                className={styles.quickHeal}
                onClick={() => applyQuick('heal')}
                title="Aplicar curación"
              >
                💚
              </button>
            </div>
          </div>
          <div className={styles.hpBarBg}>
            <div className={styles.hpBarFill} style={{ width: `${pct}%`, background: col }} />
          </div>
        </div>

        {/* Chips de stats */}
        <div className={styles.chips}>
          <div className={styles.chip}><span className={styles.chipL}>AC</span>{c.ac}</div>
          {c.dc  && <div className={styles.chip}><span className={styles.chipL}>DC</span>{c.dc}</div>}
          {c.bonusInit !== 0 && (
            <div className={styles.chip}>
              <span className={styles.chipL}>+ini</span>
              {c.bonusInit > 0 ? '+' : ''}{c.bonusInit}
            </div>
          )}
        </div>

        <div className={styles.caret}>{c.expanded ? '▲' : '▼'}</div>
      </div>

      {/* ── Detalle expandido ── */}
      {c.expanded && (
        <div className={styles.detail}>
          <div className={styles.detailGrid}>

            {/* HP control */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>Puntos de vida</div>
              <div className={styles.fieldRow}>
                <label>HP máx.</label>
                <input
                  type="number" value={c.hpMax || ''} placeholder="0" style={{ width: 70 }}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 0
                    onUpdate({ hpMax: v, hpLeft: c.hpLeft === 0 ? v : c.hpLeft })
                  }}
                />
              </div>
              <div className={styles.fieldRow}>
                <label>HP actual</label>
                <input
                  type="number" value={c.hpLeft || ''} placeholder="0" style={{ width: 70 }}
                  onChange={e => onUpdate({ hpLeft: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className={styles.dmgRow}>
                <input
                  type="number" placeholder="Daño" min="0" value={dmgVal} style={{ width: 80 }}
                  onChange={e => setDmgVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyDmg()}
                />
                <button className={styles.btnDmg} onClick={applyDmg}>💥 Daño</button>
              </div>
              <div className={styles.dmgRow}>
                <input
                  type="number" placeholder="Curación" min="0" value={healVal} style={{ width: 80 }}
                  onChange={e => setHealVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyHeal()}
                />
                <button className={styles.btnHeal} onClick={applyHeal}>💚 Curar</button>
              </div>
            </div>

            {/* Stats */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>Stats</div>
              {[
                ['Iniciativa', 'init',      true],
                ['AC',         'ac',        true],
                ['DC',         'dc',        false],
                ['Bon. ini.',  'bonusInit', true],
              ].map(([label, field, req]) => (
                <div className={styles.fieldRow} key={field}>
                  <label>{label}</label>
                  <input
                    type="number" value={c[field] ?? ''} placeholder={req ? '0' : '—'} style={{ width: 70 }}
                    onChange={e => {
                      const v = e.target.value === '' ? null : parseInt(e.target.value) || 0
                      onUpdate({ [field]: v })
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Conditions */}
            <div className={`${styles.card} ${styles.fullWidth}`}>
              <div className={styles.cardTitle}>Condiciones</div>
              <div className={styles.condWrap}>
                {c.conditions.length === 0
                  ? <span className={styles.noConditions}>Sin condiciones activas</span>
                  : c.conditions.map(cd => (
                      <button key={cd} className={styles.condTag} onClick={() => removeCond(cd)}>
                        {cd} ✕
                      </button>
                    ))
                }
              </div>
              <div className={styles.condAdd}>
                <select value={condSel} onChange={e => setCondSel(e.target.value)}>
                  <option value="">— agregar condición —</option>
                  {CONDITIONS.map(cd => <option key={cd} value={cd}>{cd}</option>)}
                </select>
                <button className={styles.btnSmall} onClick={addCond}>+ Agregar</button>
              </div>
            </div>

            {/* Spell slots */}
            {c.spellcaster && Object.keys(c.spellSlots).length > 0 && (
              <div className={`${styles.card} ${styles.fullWidth}`}>
                <div className={styles.cardTitle}>
                  Espacios de conjuro
                  <button className={styles.slotReset} onClick={() => onUpdate({ spellUsed: {} })}>
                    ↺ Descanso largo
                  </button>
                </div>
                <div className={styles.slotGrid}>
                  {Object.entries(c.spellSlots).map(([lv, total]) => {
                    if (!total) return null
                    const used = c.spellUsed[lv] || 0
                    return (
                      <div key={lv} className={styles.slotCol}>
                        <div className={styles.slotLvl}>Niv {lv}</div>
                        <div className={styles.slotCount}>{total - used}/{total}</div>
                        <div className={styles.pips}>
                          {Array.from({ length: total }, (_, i) => (
                            <button
                              key={i}
                              className={`${styles.pip} ${i < used ? styles.pipUsed : styles.pipAvail}`}
                              onClick={() => toggleSlot(lv, i)}
                              title={i < used ? 'Usado — click para restaurar' : 'Disponible — click para usar'}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={c.dead ? styles.btnRevive : styles.btnKill}
              onClick={() => onUpdate({ dead: !c.dead, ...(c.dead ? { hpLeft: Math.max(1, c.hpLeft) } : {}) })}
            >
              {c.dead ? '💛 Revivir' : '☠ Derrotar'}
            </button>
            <button
              className={styles.btnRemove}
              onClick={() => window.confirm(`¿Eliminar a ${c.name} del combate?`) && onRemove()}
            >
              🗑 Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
