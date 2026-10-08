/**
 * AppProviders.jsx — Compone todos los contextos de la app
 *
 * Se monta una sola vez, en `main.jsx`, por encima de <App />.
 * El orden no importa: ningún provider lee de otro — los puentes entre
 * dominios (ej.: "cargar encuentro en el combate") se hacen en las páginas,
 * que consumen varios contextos a la vez.
 *
 *   UIProvider           → pestaña activa + sub-vista "Añadir"
 *   CombatProvider       → combate activo (ronda, turnos, combatientes)
 *   BestiaryProvider     → biblioteca de criaturas
 *   CharactersProvider   → biblioteca de PJs y aliados
 *   EncountersProvider   → encuentros guardados
 */

import { UIProvider } from './UIContext'
import { CombatProvider } from './CombatContext'
import { BestiaryProvider } from './BestiaryContext'
import { CharactersProvider } from './CharactersContext'
import { EncountersProvider } from './EncountersContext'

export default function AppProviders({ children }) {
  return (
    <UIProvider>
      <CombatProvider>
        <BestiaryProvider>
          <CharactersProvider>
            <EncountersProvider>
              {children}
            </EncountersProvider>
          </CharactersProvider>
        </BestiaryProvider>
      </CombatProvider>
    </UIProvider>
  )
}
