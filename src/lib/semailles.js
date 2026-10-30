// Un plateau de wari compte 12 trous et 48 graines
export const TROUS   = 12
export const GRAINES = 48

// Regroupe les catégories au-delà de ce que le plateau peut accueillir
export const limiterAuxTrous = (lignes) => {
  if (lignes.length <= TROUS) return lignes
  const surplus = lignes.slice(TROUS - 1)
  const montant = surplus.reduce((s, l) => s + l.montant, 0)
  return [...lignes.slice(0, TROUS - 1), { cat: 'Autres', montant, groupe: true }]
}

// Répartit les 48 graines au plus fort reste ; tout montant reçoit au moins une graine
export const repartirGraines = (montants) => {
  const total = montants.reduce((s, m) => s + m, 0)
  if (total <= 0) return montants.map(() => 0)

  const parts   = montants.map(m => (m / total) * GRAINES)
  const graines = parts.map(Math.floor)
  const ordre   = parts.map((p, i) => [p - graines[i], i]).sort((a, b) => b[0] - a[0])

  let restantes = GRAINES - graines.reduce((s, g) => s + g, 0)
  for (const [, i] of ordre) {
    if (restantes-- <= 0) break
    graines[i]++
  }

  graines.forEach((g, i) => {
    if (g > 0) return
    graines[i] = 1
    graines[graines.indexOf(Math.max(...graines))]--
  })
  return graines
}
