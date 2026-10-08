/**
 * BestiaryContext.jsx — Estado global del bestiario
 *
 * El provider usa el hook `features/bestiary/useBestiary.js` (lógica + CRUD).
 * Al vivir en el árbol raíz, la biblioteca queda cargada aunque el panel
 * esté cerrado: no se relee localStorage cada vez que se abre.
 */

import { createContext, useContext } from 'react'
import { useBestiary as useBestiaryImpl } from '../features/bestiary/useBestiary'

const BestiaryContext = createContext(null)

export function BestiaryProvider({ children }) {
  const bestiary = useBestiaryImpl()
  return <BestiaryContext.Provider value={bestiary}>{children}</BestiaryContext.Provider>
}

export function useBestiaryContext() {
  const ctx = useContext(BestiaryContext)
  if (!ctx) throw new Error('useBestiaryContext debe usarse dentro de <BestiaryProvider>')
  return ctx
}
