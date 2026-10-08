/**
 * CharactersContext.jsx — Estado global de la biblioteca de personajes
 *
 * El provider usa el hook `features/characters/useCharacters.js` (lógica + CRUD).
 * Al vivir en el árbol raíz, la biblioteca queda cargada aunque el panel
 * esté cerrado: no se relee localStorage cada vez que se abre.
 */

import { createContext, useContext } from 'react'
import { useCharacters as useCharactersImpl } from '../features/characters/useCharacters'

const CharactersContext = createContext(null)

export function CharactersProvider({ children }) {
  const characters = useCharactersImpl()
  return <CharactersContext.Provider value={characters}>{children}</CharactersContext.Provider>
}

export function useCharactersContext() {
  const ctx = useContext(CharactersContext)
  if (!ctx) throw new Error('useCharactersContext debe usarse dentro de <CharactersProvider>')
  return ctx
}
