/**
 * Encounters.jsx — Encuentros guardados (Etapa 4)
 *
 * STUB preparado con la arquitectura correcta.
 *
 * Funcionalidades planificadas:
 *   • Crear encuentros con nombre y lista de criaturas+cantidades
 *   • Guardar/editar/eliminar encuentros
 *   • Cargar encuentro → agrega todas las criaturas al combate activo
 *   • Persistencia en encounters.json (o SQLite en Etapa 6)
 */

import { useState, useEffect } from 'react'
import { loadEncounters, saveEncounters } from '../../lib/storage'

export default function Encounters({ onLoadEncounter }) {
  const [encounters, setEncounters] = useState([])

  useEffect(() => {
    loadEncounters().then(res => {
      if (res.ok && res.data) setEncounters(res.data)
    })
  }, [])

  // Estructura de un encuentro:
  // {
  //   id: string,
  //   name: string,               // 'Emboscada del bosque'
  //   entries: [                  // Lista de criaturas
  //     { creatureId: string, creatureName: string, count: number, ... }
  //   ],
  //   notes: string,
  //   createdAt: ISO string,
  // }

  return (
    <div>
      <p style={{ color: 'var(--text-3)' }}>
        [Etapa 4 — Encuentros guardados — en construcción]
      </p>
      {encounters.map(enc => (
        <div key={enc.id}>
          <strong>{enc.name}</strong>
          <button onClick={() => onLoadEncounter(enc)}>Cargar</button>
        </div>
      ))}
    </div>
  )
}
