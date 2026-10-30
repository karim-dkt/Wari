// Calculs en centimes pour éviter les erreurs d'arrondi (0.7 + 0.1 !== 0.8)
const centimes = (montant) => Math.round(Number(montant) * 100)

export const sommeMontants = (lignes) =>
  lignes.reduce((s, l) => s + centimes(l.montant), 0) / 100

export const resteDu = (montant, paiements) =>
  Math.max(0, centimes(montant) - centimes(sommeMontants(paiements))) / 100
