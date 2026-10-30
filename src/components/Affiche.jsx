export default function Affiche({ label, mention, valeur, children }) {
  return (
    <section className="affiche">
      <p className="affiche-label">
        <span>{label}</span>
        {mention && <span>{mention}</span>}
      </p>
      <p className="affiche-valeur" style={{ '--signes': Math.max(String(valeur).length, 3) }}>
        {valeur}
      </p>
      {children}
    </section>
  )
}
