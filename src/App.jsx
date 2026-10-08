/**
 * App.jsx — Layout principal (solo render)
 *
 * La app es una interfaz de pestañas: cada pestaña renderiza SU contenido
 * a completo y nunca se mezcla con el combate:
 *   • Combate     → barra de turnos + lista de combatientes (+ "Añadir")
 *   • Encuentros  → solo la página de encuentros
 *   • Personajes  → solo la página de personajes
 *   • Bestiario   → solo la página de bestiario
 *
 * Toda la salida vive en contextos (`src/context/`), así no se drilean props:
 *   • useUIContext()     → pestaña activa + formulario "Añadir"
 *   • useCombatContext() → combate activo (ronda, turnos, combatientes)
 *
 * Los componentes hijos (CombatantRow, AddCombatantPanel…) siguen siendo
 * prop-driven: los contextos los consume solo el nivel de página.
 */

import { PAGES, useUIContext } from './context/UIContext'
import { useCombatContext } from './context/CombatContext'
import Bestiary from './features/bestiary/Bestiary'
import Characters from './features/characters/Characters'
import Encounters from './features/encounters/Encounters'
import CombatantRow from './components/CombatantRow'
import AddCombatantPanel from './components/AddCombatantPanel'
import RoundBanner from './components/RoundBanner'
import styles from './App.module.css'

/** Pestañas de navegación (siempre visibles en el header). */
const TABS = [
  { id: PAGES.combat,     icon: '⚔', label: 'Combate' },
  { id: PAGES.encounters, icon: '📋', label: 'Encuentros' },
  { id: PAGES.characters, icon: '🧙', label: 'Personajes' },
  { id: PAGES.bestiary,   icon: '📖', label: 'Bestiario' },
]

export default function App() {
  const { page, isCombat, addOpen, goTo, openAdd, toggleAdd, closeAdd } = useUIContext()

  const {
    sortedList, round, activeTurn, saveStatus,
    nextTurn, prevTurn,
    updateCombatant, removeCombatant, addCombatant,
    moveCombatantInOrder, resetOrder,
    rollInitiative, resetCombat,
  } = useCombatContext()

  const hasCombat = sortedList.length > 0
  const hasManualOrder = sortedList.some(c => c.order !== undefined)

  function handleAdd(data) {
    addCombatant(data)
    closeAdd()
  }

  function handleReset() {
    if (!window.confirm('¿Reiniciar el combate? Se restaurará el HP y se borrarán condiciones.')) return
    resetCombat()
  }

  return (
    <div className={styles.layout}>

      {/* ── Header: título + pestañas + acciones ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>⚔ Combat Tracker</h1>
          <span className={styles.subtitle}>D&D 5e — Pantalla del DM</span>
        </div>

        <div className={styles.headerCenter}>
          {isCombat && <RoundBanner round={round} />}
        </div>

        <div className={styles.headerRight}>
          {isCombat && saveStatus && (
            <span className={styles.saveStatus} data-status={saveStatus}>
              {saveStatus === 'saved' ? '✓ Guardado' : '✗ Error'}
            </span>
          )}

          <nav className={styles.tabs}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={page === tab.id ? styles.btnGold : styles.btnGhost}
                onClick={() => goTo(tab.id)}
                aria-current={page === tab.id ? 'page' : undefined}
                title={tab.id === PAGES.combat
                  ? 'Ver el tracker de combate'
                  : `Pestaña ${tab.label}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          {isCombat && hasManualOrder && (
            <button className={styles.btnWarn} onClick={resetOrder} title="Volver al orden por iniciativa">
              ↺ Orden
            </button>
          )}
          {isCombat && (
            <button className={styles.btnGhost} onClick={rollInitiative}>🎲 Iniciativa</button>
          )}
          {isCombat && (
            <button className={styles.btnGhost} onClick={handleReset}>↺ Reiniciar</button>
          )}

          <button
            className={styles.btnGold}
            onClick={toggleAdd}
            title="Añadir combatiente al combate"
          >
            {isCombat && addOpen ? '✕ Cancelar' : '+ Añadir'}
          </button>
        </div>
      </header>

      {/* ── Barra de turno (solo pestaña Combate) ── */}
      {isCombat && (
        <div className={styles.turnBar}>
          <button className={styles.turnBtn} onClick={prevTurn} disabled={!hasCombat}>
            ‹ Anterior
          </button>
          <div className={styles.turnInfo}>
            {sortedList[activeTurn] && (
              <>
                <span className={styles.turnLabel}>Turno de</span>
                <span className={styles.turnName}>{sortedList[activeTurn].name}</span>
              </>
            )}
          </div>
          <button className={styles.turnBtnPrimary} onClick={nextTurn} disabled={!hasCombat}>
            Siguiente turno ›
          </button>
        </div>
      )}

      {/* ── Main: UNA pestaña visible por vez, a completo ── */}
      <main className={styles.main}>

        {isCombat ? (
          <>
            {addOpen && (
              <AddCombatantPanel onAdd={handleAdd} onCancel={closeAdd} />
            )}

            {!hasCombat ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>⚔</span>
                <p>No hay participantes en el combate.</p>
                <button className={styles.btnGold} onClick={openAdd}>
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
          </>
        ) : page === PAGES.encounters ? (
          <Encounters />
        ) : page === PAGES.characters ? (
          <Characters />
        ) : (
          <Bestiary />
        )}
      </main>
    </div>
  )
}
