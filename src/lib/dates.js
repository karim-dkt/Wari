// Date du jour dans le fuseau de l'appareil (toISOString renverrait la date UTC)
export const dateLocale = () => {
  const d = new Date()
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mois}-${jour}`
}
