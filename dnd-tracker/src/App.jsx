/**
 * App.jsx — Layout principal del Combat Tracker
 *
 * Etapa 2: agrega botón "📖 Bestiario" en el header y panel de bestiario
 * que se abre/cierra igual que el panel de Añadir.
 */

import { useState } from 'react'
import { useCombat } from './hooks/useCombat'
import Bestiary from './features/bestiary/Bestiary'
import CombatantRow from './components/CombatantRow'
import AddCombatantPanel from './components/AddCombatantPanel'
import RoundBanner from './components/RoundBanner'
import styles from './App.module.css'

export default function App() {
  const [showAdd, setShowAdd]           = useState(false)
  const [showBestiary, setShowBestiary] = useState(false)

  const {
    sortedList,
    round,
    activeTurn,
    saveStatus,
    nextTurn,
    prevTurn,
    updateCombatant,
    removeCombatant,
    addCombatant,
    addCreatureFromBestiary,
    moveCombatantInOrder,
    resetOrder,
    rollInitiative,
    resetCombat,
  } = useCombat()

  const hasManualOrder = sortedList.some(c => c.order !== undefined)

  function handleAdd(data) {
    addCombatant(data)
    setShowAdd(false)
  }

  function handleAddFromBestiary(creature, count) {
    addCreatureFromBestiary(creature, count)
    // No cerramos el bestiario para que el DM pueda seguir añadiendo
  }

  function handleReset() {
    if (!window.confirm('¿Reiniciar el combate? Se restaurará el HP y se borrarán condiciones.')) return
    resetCombat()
  }

  function toggleBestiary() {
    setShowBestiary(v => !v)
    if (showAdd) setShowAdd(false)  // cierra el panel de añadir si estaba abierto
  }

  function toggleAdd() {
    setShowAdd(v => !v)
    if (showBestiary) setShowBestiary(false)  // cierra el bestiario si estaba abierto
  }

  return (
    <div className={styles.layout}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>⚔ Combat Tracker</h1>
          <span className={styles.subtitle}>D&D 5e — Pantalla del DM</span>
        </div>

        <div className={styles.headerCenter}>
          <RoundBanner round={round} />
        </div>

        <div className={styles.headerRight}>
          {saveStatus && (
            <span className={styles.saveStatus} data-status={saveStatus}>
              {saveStatus === 'saved' ? '✓ Guardado' : '✗ Error'}
            </span>
          )}

          {hasManualOrder && (
            <button
              className={styles.btnWarn}
              onClick={resetOrder}
              title="Volver al ordenamiento automático por iniciativa"
            >
              ↺ Orden
            </button>
          )}

          <button className={styles.btnGhost} onClick={rollInitiative} title="Tirar iniciativa para todos">
            🎲 Iniciativa
          </button>
          <button className={styles.btnGhost} onClick={handleReset} title="Reiniciar combate">
            ↺ Reiniciar
          </button>
          <button
            className={showBestiary ? styles.btnGold : styles.btnGhost}
            onClick={toggleBestiary}
            title="Biblioteca de criaturas"
          >
            📖 Bestiario
          </button>
          <button className={styles.btnGold} onClick={toggleAdd}>
            {showAdd ? '✕ Cancelar' : '+ Añadir'}
          </button>
        </div>
      </header>

      {/* ── Barra de turno ── */}
      <div className={styles.turnBar}>
        <button className={styles.turnBtn} onClick={prevTurn}>‹ Anterior</button>
        <div className={styles.turnInfo}>
          {sortedList[activeTurn] && (
            <>
              <span className={styles.turnLabel}>Turno de</span>
              <span className={styles.turnName}>{sortedList[activeTurn].name}</span>
            </>
          )}
        </div>
        <button className={styles.turnBtnPrimary} onClick={nextTurn}>Siguiente turno ›</button>
      </div>

      {/* ── Main ── */}
      <main className={styles.main}>

        {showBestiary && (
          <Bestiary
            onAddToCombat={handleAddFromBestiary}
            onClose={() => setShowBestiary(false)}
          />
        )}

        {showAdd && (
          <AddCombatantPanel onAdd={handleAdd} onCancel={() => setShowAdd(false)} />
        )}

        {sortedList.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>⚔</span>
            <p>No hay participantes en el combate.</p>
            <button className={styles.btnGold} onClick={() => setShowAdd(true)}>
              Añadir combatiente
            </button>
          </div>
        ) : (
          <section className={styles.group}>
            {sortedList.map((c, idx) => (
              <CombatantRow
                key={c.id}
                combatant={c}
                isActive={idx === activeTurn}
                isFirst={idx === 0}
                isLast={idx === sortedList.length - 1}
                onUpdate={(patch) => updateCombatant(c.id, patch)}
                onRemove={() => removeCombatant(c.id)}
                onMoveUp={() => moveCombatantInOrder(c.id, -1)}
                onMoveDown={() => moveCombatantInOrder(c.id, +1)}
              />
            ))}
          </section>
        )}
      </main>

    </div>
  )
}
