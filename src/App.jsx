/**
 * App.jsx — Etapa 3: agrega panel de Personajes y Aliados
 */

import { useState } from 'react'
import { useCombat } from './hooks/useCombat'
import Bestiary from './features/bestiary/Bestiary'
import Characters from './features/characters/Characters'
import CombatantRow from './components/CombatantRow'
import AddCombatantPanel from './components/AddCombatantPanel'
import RoundBanner from './components/RoundBanner'
import styles from './App.module.css'

// Solo un panel puede estar abierto a la vez
const PANELS = { none: 'none', add: 'add', bestiary: 'bestiary', characters: 'characters' }

export default function App() {
  const [openPanel, setOpenPanel] = useState(PANELS.none)

  const {
    sortedList, round, activeTurn, saveStatus,
    nextTurn, prevTurn,
    updateCombatant, removeCombatant, addCombatant,
    addCreatureFromBestiary,
    moveCombatantInOrder, resetOrder,
    rollInitiative, resetCombat,
  } = useCombat()

  const hasManualOrder = sortedList.some(c => c.order !== undefined)

  function toggle(panel) {
    setOpenPanel(prev => prev === panel ? PANELS.none : panel)
  }

  function handleAdd(data) {
    addCombatant(data)
    setOpenPanel(PANELS.none)
  }

  function handleReset() {
    if (!window.confirm('¿Reiniciar el combate? Se restaurará el HP y se borrarán condiciones.')) return
    resetCombat()
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
            <button className={styles.btnWarn} onClick={resetOrder} title="Volver al orden por iniciativa">
              ↺ Orden
            </button>
          )}
          <button className={styles.btnGhost} onClick={rollInitiative}>🎲 Iniciativa</button>
          <button className={styles.btnGhost} onClick={handleReset}>↺ Reiniciar</button>
          <button
            className={openPanel === PANELS.characters ? styles.btnGold : styles.btnGhost}
            onClick={() => toggle(PANELS.characters)}
            title="Biblioteca de personajes y aliados"
          >
            🧙 Personajes
          </button>
          <button
            className={openPanel === PANELS.bestiary ? styles.btnGold : styles.btnGhost}
            onClick={() => toggle(PANELS.bestiary)}
            title="Biblioteca de criaturas"
          >
            📖 Bestiario
          </button>
          <button
            className={styles.btnGold}
            onClick={() => toggle(PANELS.add)}
          >
            {openPanel === PANELS.add ? '✕ Cancelar' : '+ Añadir'}
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

        {openPanel === PANELS.characters && (
          <Characters
            onAddToCombat={addCreatureFromBestiary}
            onClose={() => setOpenPanel(PANELS.none)}
          />
        )}

        {openPanel === PANELS.bestiary && (
          <Bestiary
            onAddToCombat={addCreatureFromBestiary}
            onClose={() => setOpenPanel(PANELS.none)}
          />
        )}

        {openPanel === PANELS.add && (
          <AddCombatantPanel
            onAdd={handleAdd}
            onCancel={() => setOpenPanel(PANELS.none)}
          />
        )}

        {sortedList.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>⚔</span>
            <p>No hay participantes en el combate.</p>
            <button className={styles.btnGold} onClick={() => setOpenPanel(PANELS.add)}>
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
