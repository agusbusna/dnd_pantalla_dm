/**
 * UIContext.jsx — Navegación de pestañas/páginas de la app
 *
 * La app es una interfaz de pestañas: UN solo contenido visible a la vez y
 * cada pestaña se muestra a completo, sin el combate debajo:
 *
 *   • PAGES.combat      → tracker de combate (+ formulario "Añadir")
 *   • PAGES.encounters  → encuentros guardados
 *   • PAGES.characters  → biblioteca de personajes
 *   • PAGES.bestiary    → biblioteca de criaturas
 *
 * El formulario "Añadir" es una sub-vista del combate (addOpen), no una
 * pestaña: vive sobre la pestaña Combate y se cierra al navegar a otra.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/** Identificadores de las pestañas. */
export const PAGES = {
  combat:     'combat',
  characters: 'characters',
  bestiary:   'bestiary',
  encounters: 'encounters',
}

const UIContext = createContext(null)

/**
 * @param {{children: any, initialPage?: string}} props
 *   `initialPage` permite abrir directo en una pestaña distinta del combate
 *   (tests, deep-links).
 */
export function UIProvider({ children, initialPage = PAGES.combat }) {
  const [page, setPage]       = useState(initialPage)
  const [addOpen, setAddOpen] = useState(false)

  /** Navega a una pestaña. Salir del combate cierra el formulario "Añadir". */
  const goTo = useCallback((next) => {
    setPage(next)
    if (next !== PAGES.combat) setAddOpen(false)
  }, [])

  /** Vuelve a la pestaña del combate. */
  const goToCombat = useCallback(() => goTo(PAGES.combat), [goTo])

  /** Abre el formulario "Añadir" (siempre en la pestaña Combate). */
  const openAdd = useCallback(() => {
    setPage(PAGES.combat)
    setAddOpen(true)
  }, [])

  /** Cierra el formulario "Añadir". */
  const closeAdd = useCallback(() => setAddOpen(false), [])

  /**
   * Abre/cierra el formulario "Añadir". Pidiéndolo desde otra pestaña navega
   * al combate con el formulario abierto (nunca se cierra desde otro lado).
   */
  const toggleAdd = useCallback(() => {
    setPage(PAGES.combat)
    setAddOpen(prev => !prev)
  }, [])

  const value = useMemo(
    () => ({
      page,
      isCombat: page === PAGES.combat,
      addOpen,
      goTo,
      goToCombat,
      openAdd,
      closeAdd,
      toggleAdd,
    }),
    [page, addOpen, goTo, goToCombat, openAdd, closeAdd, toggleAdd]
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUIContext() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUIContext debe usarse dentro de <UIProvider>')
  return ctx
}
