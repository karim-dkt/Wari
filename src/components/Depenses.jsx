import { useState } from 'react'
import { useApp } from '../contexts/AppContext'

const COULEURS = ['#6C63FF','#FF6584','#43B97F','#F9A825','#29B6F6','#FF7043','#AB47BC','#26A69A']

function PieChart({ donnees, total, symbole }) {
  if (!donnees.length) return null

  const cx = 80, cy = 80, r = 60, ri = 34

  const arcs = donnees.length === 1
    ? [{ ...donnees[0], type: 'full', couleur: COULEURS[0] }]
    : (() => {
        let angle = -Math.PI / 2
        return donnees.map((d, i) => {
          const portion = d.montant / total
          const a0 = angle
          const a1 = angle + portion * 2 * Math.PI
          angle = a1
          const c0 = Math.cos(a0), s0 = Math.sin(a0)
          const c1 = Math.cos(a1), s1 = Math.sin(a1)
          const grand = portion > 0.5 ? 1 : 0
          const path = `M${cx+r*c0} ${cy+r*s0} A${r} ${r} 0 ${grand} 1 ${cx+r*c1} ${cy+r*s1} L${cx+ri*c1} ${cy+ri*s1} A${ri} ${ri} 0 ${grand} 0 ${cx+ri*c0} ${cy+ri*s0}Z`
          return { ...d, type: 'arc', path, couleur: COULEURS[i % COULEURS.length] }
        })
      })()

  return (
    <div className="pie-wrapper">
      <svg viewBox="0 0 160 160" className="pie-svg">
        {arcs.map(a =>
          a.type === 'full'
            ? <circle key={a.cat} cx={cx} cy={cy} r={(r+ri)/2} fill="none" stroke={a.couleur} strokeWidth={r-ri} />
            : <path key={a.cat} d={a.path} fill={a.couleur} />
        )}
        <text x="80" y="76" textAnchor="middle" fill="#f9fafb" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          {total.toLocaleString('fr-FR')}
        </text>
        <text x="80" y="92" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="sans-serif">
          {symbole}
        </text>
      </svg>
      <div className="pie-legende">
        {arcs.map(a => (
          <div key={a.cat} className="pie-legende-item">
            <span className="pie-dot" style={{ background: a.couleur }} />
            <span className="pie-cat">{a.cat}</span>
            <span className="pie-val">{a.montant.toLocaleString('fr-FR')} {symbole}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

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
          {Number(depense.montant).toLocaleString('fr-FR')} {depense.devise}
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
        <div className="drawer-detail">
          <span className="drawer-label">Devise</span>
          <span className="drawer-value">{depense.devise}</span>
        </div>
        <button
          className="btn-danger"
          style={{ marginTop: '1rem', width: '100%' }}
          onClick={() => { onSupprimer(depense.id); onClose() }}
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

  const total = filtrees.reduce((s, d) => s + Number(d.montant), 0)

  const totauxParCategorie = filtreesDate.reduce((acc, d) => {
    acc[d.categorie] = (acc[d.categorie] || 0) + Number(d.montant)
    return acc
  }, {})

  const totalGlobal    = filtreesDate.reduce((s, d) => s + Number(d.montant), 0)
  const categoriesDispo = Object.keys(totauxParCategorie).sort()

  const donneesPie = Object.entries(totauxParCategorie)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, montant]) => ({ cat, montant }))

  const effacerFiltres = () => { setDateDebut(''); setDateFin(''); setCategorieFiltre('') }
  const aFiltres = dateDebut || dateFin || categorieFiltre

  return (
    <div className="page">
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
        <div className="total-card">
          <div className="total-label">Total{categorieFiltre ? ` · ${categorieFiltre}` : ''}</div>
          <div className="total-montant">{total.toLocaleString('fr-FR')} {symboleDevise}</div>
        </div>

        {donneesPie.length > 1 && !categorieFiltre && (
          <PieChart donnees={donneesPie} total={totalGlobal} symbole={symboleDevise} />
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
                    onClick={e => { e.stopPropagation(); supprimerDepense(d.id) }}
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
          onSupprimer={supprimerDepense}
          symboleDevise={symboleDevise}
        />
      )}
    </div>
  )
}
