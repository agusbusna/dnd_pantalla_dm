/**
 * sort.js — Ordenamiento del tracker de combate
 *
 * Lógica:
 *   1. Si un combatiente tiene `order` definido, se usa ese valor numérico.
 *   2. Si no tiene `order`, se ordena por iniciativa descendente.
 *   3. Empate en iniciativa → desempate por bonusInit descendente.
 *   4. Empate total → mantener orden de inserción (id ascendente).
 *
 * Cuando el DM usa ↑ ↓, se asigna `order` explícito a todos los combatientes
 * del array ordenado actual, y luego se intercambian los valores de los
 * combatientes afectados. Esto preserva el orden visual sin tocar la iniciativa.
 */

export function sortedCombatants(list) {
  return [...list].sort((a, b) => {
    // Si ambos tienen orden manual, usarlo directamente
    const aHasOrder = a.order !== undefined && a.order !== null
    const bHasOrder = b.order !== undefined && b.order !== null

    if (aHasOrder && bHasOrder) return a.order - b.order

    // Si solo uno tiene orden manual, ese va primero (caso de transición)
    if (aHasOrder) return -1
    if (bHasOrder) return 1

    // Orden natural: iniciativa descendente
    if (b.init !== a.init) return b.init - a.init

    // Desempate por modificador de iniciativa
    if ((b.bonusInit || 0) !== (a.bonusInit || 0)) {
      return (b.bonusInit || 0) - (a.bonusInit || 0)
    }

    // Mantener orden de inserción si todo empata
    return a.id - b.id
  })
}

/**
 * Asigna `order` a todos los combatientes según su posición actual en la lista
 * ordenada. Necesario antes de cualquier reordenamiento manual.
 */
export function stampOrders(sortedList) {
  return sortedList.map((c, idx) => ({ ...c, order: idx }))
}

/**
 * Mueve un combatiente hacia arriba (-1) o abajo (+1) en la lista ordenada.
 * Retorna un nuevo array de combatientes con `order` actualizado.
 *
 * @param {Array}  combatants  - Lista completa de combatientes (sin ordenar)
 * @param {number} id          - ID del combatiente a mover
 * @param {number} direction   - -1 (arriba) o +1 (abajo)
 * @returns {Array}            - Nueva lista con orders actualizados
 */
export function moveCombatant(combatants, id, direction) {
  // Primero obtenemos la lista ordenada y le asignamos orders si no los tiene
  const sorted = sortedCombatants(combatants)
  const withOrders = stampOrders(sorted)

  const idx = withOrders.findIndex(c => c.id === id)
  const targetIdx = idx + direction

  // No se puede mover fuera de los límites
  if (targetIdx < 0 || targetIdx >= withOrders.length) return combatants

  // Intercambiar orders entre el combatiente y su vecino
  const aOrder = withOrders[idx].order
  const bOrder = withOrders[targetIdx].order

  // Construir nuevo array completo con orders actualizados
  return combatants.map(c => {
    const match = withOrders.find(w => w.id === c.id)
    if (!match) return c
    if (c.id === withOrders[idx].id) return { ...c, order: bOrder }
    if (c.id === withOrders[targetIdx].id) return { ...c, order: aOrder }
    return { ...c, order: match.order }
  })
}

/**
 * Elimina los orders manuales de todos los combatientes,
 * restaurando el ordenamiento automático por iniciativa.
 */
export function clearOrders(combatants) {
  return combatants.map(c => {
    const { order, ...rest } = c
    return rest
  })
}