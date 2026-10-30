import { TROUS } from '../lib/semailles'

const COLONNES = TROUS / 2
const PAS      = 100
const R_TROU   = 45
const R_GRAINE = 5
const MIN_RAYONS = 10
const ANGLE_OR = Math.PI * (3 - Math.sqrt(5))

// Le jeu se sème dans le sens inverse des aiguilles d'une montre :
// rangée du bas de gauche à droite, puis rangée du haut de droite à gauche
const positionTrou = (i) => (i < COLONNES
  ? { cx: PAS * (i + 0.5),                  cy: PAS * 1.5 }
  : { cx: PAS * (TROUS - i - 0.5),          cy: PAS * 0.5 })

// Spirale de tournesol : les graines se serrent à mesure que le trou se remplit
const positionGraine = (n, nombre) => {
  const rayon = (R_TROU - R_GRAINE - 1) * Math.sqrt((n + 0.5) / Math.max(nombre, MIN_RAYONS))
  return { x: rayon * Math.cos(n * ANGLE_OR), y: rayon * Math.sin(n * ANGLE_OR) }
}

export default function Plateau({ trous, onChoisir }) {
  let semees = 0

  return (
    <svg className="plateau" viewBox={`0 0 ${PAS * COLONNES} ${PAS * 2}`} aria-hidden="true">
      {Array.from({ length: TROUS }, (_, i) => {
        const { cx, cy } = positionTrou(i)
        const graines    = trous[i] ?? 0
        const choisir    = graines > 0 && onChoisir ? () => onChoisir(i) : undefined
        return (
          <g key={i} onClick={choisir} className={choisir ? 'trou-actif' : undefined}>
            <circle className="trou" cx={cx} cy={cy} r={R_TROU} />
            {Array.from({ length: graines }, (_, n) => {
              const { x, y } = positionGraine(n, graines)
              return (
                <circle
                  key={n}
                  className="graine"
                  cx={cx + x}
                  cy={cy + y}
                  r={R_GRAINE}
                  style={{ '--rang': semees++ }}
                />
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
