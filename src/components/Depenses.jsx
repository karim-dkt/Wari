import { useState } from 'react'
import { useApp } from '../contexts/AppContext'

export default function Depenses() {
  const { depenses, supprimerDepense, symboleDevise } = useApp()
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin,   setDateFin]   = useState('')

  const enregistrees = depenses.filter(d => !d.brouillon)

  const filtrees = enregistrees.filter(d => {
    if (dateDebut && d.date < dateDebut) return false
    if (dateFin   && d.date > dateFin)   return false
    return true
  })

  const total = filtrees.reduce((s, d) => s + Number(d.montant), 0)

  const totauxParCategorie = filtrees.reduce((acc, d) => {
    acc[d.categorie] = (acc[d.categorie] || 0) + Number(d.montant)
    return acc
  }, {})

  const effacerFiltre = () => { setDateDebut(''); setDateFin('') }

  return (
    <div className="page">
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Filtrer par date</h2>
          {(dateDebut || dateFin) && (
            <button className="btn-ghost" onClick={effacerFiltre}>Effacer</button>
          )}
        </div>
        <div className="form-row">
          <div className="field">
            <label>Du</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
          </div>
          <div className="field">
            <label>Au</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="total-card">
          <div className="total-label">Total</div>
          <div className="total-montant">{total.toLocaleString('fr-FR')} {symboleDevise}</div>
        </div>

        {Object.keys(totauxParCategorie).length > 1 && (
          <div className="categories-totaux">
            {Object.entries(totauxParCategorie)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, montant]) => (
                <div key={cat} className="categorie-total">
                  <span>{cat}</span>
                  <span>{montant.toLocaleString('fr-FR')} {symboleDevise}</span>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">
          {filtrees.length} dépense{filtrees.length !== 1 ? 's' : ''}
        </h2>

        {filtrees.length === 0 ? (
          <p className="vide">
            {enregistrees.length === 0
              ? 'Aucune dépense enregistrée.'
              : 'Aucune dépense sur cette période.'}
          </p>
        ) : (
          <ul className="liste-depenses">
            {filtrees.map(d => (
              <li key={d.id} className="item-depense">
                <div className="item-info">
                  <span className="tag">{d.categorie}</span>
                  {d.description && <span className="item-description">{d.description}</span>}
                  <span className="item-date">{d.date} · {d.heure?.slice(0, 5)}</span>
                </div>
                <div className="item-right">
                  <span className="item-montant">
                    {Number(d.montant).toLocaleString('fr-FR')} {symboleDevise}
                  </span>
                  <button
                    className="btn-icon"
                    onClick={() => supprimerDepense(d.id)}
                    title="Supprimer"
                  >✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
