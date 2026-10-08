/**
 * CombatContext.jsx — Estado global del combate activo
 *
 * El provider internamente usa el hook `hooks/useCombat.js`, que sigue siendo
 * la única fuente de verdad de la lógica de combate. El contexto solo la
 * distribuye a las páginas que la necesiten (App, y cualquier página que
 * quiera añadir criaturas al combate).
 */

import { createContext, useContext } from 'react'
import { useCombat } from '../hooks/useCombat'

const CombatContext = createContext(null)

export function CombatProvider({ children, combatId = 'default' }) {
  const combat = useCombat(combatId)
  return <CombatContext.Provider value={combat}>{children}</CombatContext.Provider>
}

export function useCombatContext() {
  const ctx = useContext(CombatContext)
  if (!ctx) throw new Error('useCombatContext debe usarse dentro de <CombatProvider>')
  return ctx
}
