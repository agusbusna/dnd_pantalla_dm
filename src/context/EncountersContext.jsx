/**
 * EncountersContext.jsx — Estado global de los encuentros guardados (Etapa 4)
 *
 * El provider usa el hook `features/encounters/useEncounters.js` (lógica + CRUD).
 * Al vivir en el árbol raíz, los encuentros quedan cargados aunque el panel
 * esté cerrado: no se relee localStorage cada vez que se abre.
 */

import { createContext, useContext } from 'react'
import { useEncounters as useEncountersImpl } from '../features/encounters/useEncounters'

const EncountersContext = createContext(null)

export function EncountersProvider({ children }) {
  const encounters = useEncountersImpl()
  return <EncountersContext.Provider value={encounters}>{children}</EncountersContext.Provider>
}

export function useEncountersContext() {
  const ctx = useContext(EncountersContext)
  if (!ctx) throw new Error('useEncountersContext debe usarse dentro de <EncountersProvider>')
  return ctx
}
