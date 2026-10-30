import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { sommeMontants } from '../lib/montants'
import { limiterAuxTrous, repartirGraines } from '../lib/semailles'
import Affiche from './Affiche'
import Plateau from './Plateau'

function DetailDrawer({ depense, onClose, onSupprimer, symboleDevise }) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <span className="tag">{depense.categorie}</span>
          <button className="btn-icon" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <div className="drawer-montant">
          {Number(depense.montant).toLocaleString('fr-FR')} {symboleDevise}
        </div>
        {depense.description && (
          <div className="drawer-detail">
            <span className="drawer-label">Description</span>
            <span className="drawer-value">{depense.description}</span>
          </div>
        )}
        <div className="drawer-detail">
          <span className="drawer-label">Date</span>
          <span className="drawer-value">{depense.date}</span>
        </div>
        <div className="drawer-detail">
          <span className="drawer-label">Heure</span>
          <span className="drawer-value">{depense.heure?.slice(0, 5)}</span>
        </div>
        <button
          className="btn-danger"
          style={{ marginTop: '1rem', width: '100%' }}
          onClick={() => { if (onSupprimer(depense.id)) onClose() }}
        >
          Supprimer cette dépense
        </button>
      </div>
    </div>
  )
}

export default function Depenses() {
  const { depenses, supprimerDepense, symboleDevise } = useApp()
  const [dateDebut,       setDateDebut]       = useState('')
  const [dateFin,         setDateFin]         = useState('')
  const [categorieFiltre, setCategorieFiltre] = useState('')
  const [selectee,        setSelectee]        = useState(null)

  const enregistrees = depenses.filter(d => !d.brouillon)

  const filtreesDate = enregistrees.filter(d => {
    if (dateDebut && d.date < dateDebut) return false
    if (dateFin   && d.date > dateFin)   return false
    return true
  })

  const filtrees = categorieFiltre
    ? filtreesDate.filter(d => d.categorie === categorieFiltre)
    : filtreesDate

  const total = sommeMontants(filtrees)

  const totauxParCategorie = filtreesDate.reduce((acc, d) => {
    acc[d.categorie] = (acc[d.categorie] || 0) + Number(d.montant)
    return acc
  }, {})

  const categoriesDispo = Object.keys(totauxParCategorie).sort()

  const trous = limiterAuxTrous(
    Object.entries(totauxParCategorie)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, montant]) => ({ cat, montant }))
  )
  const graines = repartirGraines(trous.map(t => t.montant))

  const choisirTrou = (i) => {
    if (!trous[i].groupe) setCategorieFiltre(trous[i].cat)
  }

  const supprimer = (id) => {
    if (!confirm('Supprimer cette dépense ?')) return false
    supprimerDepense(id)
    return true
  }

  const effacerFiltres = () => { setDateDebut(''); setDateFin(''); setCategorieFiltre('') }
  const aFiltres = dateDebut || dateFin || categorieFiltre

  return (
    <div className="page">
      <Affiche
        label={categorieFiltre ? `Total · ${categorieFiltre}` : 'Total'}
        mention={symboleDevise}
        valeur={total.toLocaleString('fr-FR')}
      >
        {trous.length > 0 && !categorieFiltre && (
          <Plateau trous={graines} onChoisir={choisirTrou} />
        )}
      </Affiche>

      {trous.length > 0 && !categorieFiltre && (
        <section className="section">
          <h2 className="section-title">48 graines réparties par catégorie</h2>
          <ol className="legende">
            {trous.map((t, i) => (
              <li key={t.cat}>
                <button
                  className="legende-item"
                  onClick={() => choisirTrou(i)}
                  disabled={t.groupe}
                >
                  <span className="legende-graines">{graines[i]}</span>
                  <span className="legende-cat">{t.cat}</span>
                  <span className="legende-val">{t.montant.toLocaleString('fr-FR')}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Filtrer</h2>
          {aFiltres && (
            <button className="btn-ghost" onClick={effacerFiltres}>Effacer</button>
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
        {categoriesDispo.length > 1 && (
          <div className="field">
            <label>Catégorie</label>
            <select value={categorieFiltre} onChange={e => setCategorieFiltre(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {categoriesDispo.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
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
              <li
                key={d.id}
                className="item-depense item-depense-cliquable"
                onClick={() => setSelectee(d)}
              >
                <div className="item-info">
                  <span className="tag">{d.categorie}</span>
                  {d.description && (
                    <span className="item-description">{d.description}</span>
                  )}
                  <span className="item-date">{d.date} · {d.heure?.slice(0, 5)}</span>
                </div>
                <div className="item-right">
                  <span className="item-montant">
                    {Number(d.montant).toLocaleString('fr-FR')} {symboleDevise}
                  </span>
                  <button
                    className="btn-icon"
                    onClick={e => { e.stopPropagation(); supprimer(d.id) }}
                    title="Supprimer"
                  >✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectee && (
        <DetailDrawer
          depense={selectee}
          onClose={() => setSelectee(null)}
          onSupprimer={supprimer}
          symboleDevise={symboleDevise}
        />
      )}
    </div>
  )
}
