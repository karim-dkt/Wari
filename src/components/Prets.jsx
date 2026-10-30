import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { dateLocale } from '../lib/dates'
import { resteDu, sommeMontants } from '../lib/montants'
import Affiche from './Affiche'

const STATUTS = { 'remboursé': 'Remboursé', en_attente: 'En attente' }
const GRAINES_PRET = 12

// Une graine par douzième du prêt : la première dès le premier paiement,
// la dernière seulement quand tout est remboursé
function Semis({ progression }) {
  const pleines = progression >= 100
    ? GRAINES_PRET
    : Math.min(GRAINES_PRET - 1, Math.ceil((progression / 100) * GRAINES_PRET))

  return (
    <div
      className="semis"
      role="progressbar"
      aria-label="Part remboursée"
      aria-valuenow={Math.round(progression)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: GRAINES_PRET }, (_, i) => (
        <span key={i} className={i < pleines ? 'pleine' : undefined} />
      ))}
    </div>
  )
}

// Le reste dû est enregistré comme paiement : on le fait confirmer
const confirmerSolde = (restant, symbole) => confirm(
  restant > 0
    ? `Solder ce prêt ? Un paiement de ${restant.toLocaleString('fr-FR')} ${symbole} sera enregistré.`
    : 'Marquer ce prêt comme remboursé ?'
)

function PretDrawer({ pretId, prets, paiementsPret, onClose, onAjouterPaiement, onSupprimerPaiement, onRembourse, onRouvrir, symbole }) {
  const pret     = prets.find(p => p.id === pretId)
  const paiements = paiementsPret.filter(p => p.pret_id === pretId)

  const today = dateLocale()
  const [form,    setForm]    = useState({ montant: '', date: today, note: '' })
  const [loading, setLoading] = useState(false)
  const [erreur,  setErreur]  = useState('')

  if (!pret) return null

  const totalPaye  = sommeMontants(paiements)
  const restant    = resteDu(pret.montant, paiements)
  const progression = Math.min(100, (totalPaye / Number(pret.montant)) * 100)

  const handleAjouter = async (e) => {
    e.preventDefault()
    if (!form.montant || !form.date) { setErreur('Montant et date requis.'); return }
    if (Number(form.montant) <= 0)   { setErreur('Le montant doit être positif.'); return }
    if (Number(form.montant) > restant) {
      setErreur(`Maximum ${restant.toLocaleString('fr-FR')} ${symbole}.`)
      return
    }
    setLoading(true)
    setErreur('')
    const { error } = await onAjouterPaiement(pret.id, Number(form.montant), form.date, form.note.trim() || null)
    if (error) setErreur(error.message)
    else setForm({ montant: '', date: today, note: '' })
    setLoading(false)
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="tag">{pret.personne}</span>
            <span className={`pret-statut${pret.statut === 'remboursé' ? ' rembourse' : ' en-attente'}`}>
              {STATUTS[pret.statut]}
            </span>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="pret-montants">
          <div>
            <div className="drawer-label">Prêté</div>
            <div className="pret-montant-val">{Number(pret.montant).toLocaleString('fr-FR')} {symbole}</div>
          </div>
          <div>
            <div className="drawer-label">Remboursé</div>
            <div className="pret-montant-val" style={{ color: 'var(--success)' }}>
              {totalPaye.toLocaleString('fr-FR')} {symbole}
            </div>
          </div>
          <div>
            <div className="drawer-label">Restant</div>
            <div className="pret-montant-val" style={{ color: restant > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {restant.toLocaleString('fr-FR')} {symbole}
            </div>
          </div>
        </div>

        <Semis progression={progression} />

        {pret.description && (
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
            {pret.description}
          </p>
        )}

        {pret.statut === 'en_attente' && restant > 0 && (
          <form onSubmit={handleAjouter} className="pret-paiement-form">
            <p className="section-title">Ajouter un paiement</p>
            <div className="form-row">
              <div className="field">
                <label>Montant</label>
                <input
                  type="number" min="0.01" step="any" placeholder="0"
                  value={form.montant}
                  onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Date</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label>Note (optionnel)</label>
              <input type="text" placeholder="Remarque…" value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            {erreur && <p className="erreur">{erreur}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enregistrement…' : 'Enregistrer le paiement'}
            </button>
          </form>
        )}

        {paiements.length > 0 && (
          <div className="pret-historique">
            <p className="section-title" style={{ marginBottom: '0.5rem' }}>
              Historique · {paiements.length} paiement{paiements.length > 1 ? 's' : ''}
            </p>
            {paiements.map(p => (
              <div key={p.id} className="pret-paiement-item">
                <div>
                  <div className="item-montant">{Number(p.montant).toLocaleString('fr-FR')} {symbole}</div>
                  <div className="item-date">{p.date}{p.note ? ` · ${p.note}` : ''}</div>
                </div>
                <button className="btn-icon" onClick={() => { if (confirm('Supprimer ce paiement ?')) onSupprimerPaiement(p.id) }} title="Supprimer">✕</button>
              </div>
            ))}
          </div>
        )}

        {pret.statut === 'en_attente' && (
          <button
            className="btn-danger"
            style={{ marginTop: '1rem', width: '100%' }}
            onClick={() => {
              if (!confirmerSolde(restant, symbole)) return
              onRembourse(pret.id)
              onClose()
            }}
          >
            Marquer comme remboursé
          </button>
        )}

        {pret.statut === 'remboursé' && restant > 0 && (
          <button
            className="btn-ghost"
            style={{ marginTop: '1rem', width: '100%' }}
            onClick={() => onRouvrir(pret.id)}
          >
            Rouvrir ce prêt
          </button>
        )}
      </div>
    </div>
  )
}

export default function Prets() {
  const {
    prets, paiementsPret,
    ajouterPret, marquerRembourse, rouvrirPret, supprimerPret,
    ajouterPaiementPret, supprimerPaiementPret,
    symboleDevise,
  } = useApp()

  const today = dateLocale()
  const [form,           setForm]           = useState({ personne: '', montant: '', date: today, description: '' })
  const [loading,        setLoading]        = useState(false)
  const [erreur,         setErreur]         = useState('')
  const [pretSelectionne, setPretSelectionne] = useState(null)

  const enAttente = prets.filter(p => p.statut === 'en_attente')

  const paiementsDe = (id) => paiementsPret.filter(pp => pp.pret_id === id)

  const totalRestant = sommeMontants(
    enAttente.map(p => ({ montant: resteDu(p.montant, paiementsDe(p.id)) }))
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.personne.trim() || !form.montant || !form.date) {
      setErreur('Personne, montant et date sont requis.')
      return
    }
    setLoading(true)
    setErreur('')
    const { error } = await ajouterPret({
      personne:    form.personne.trim(),
      montant:     Number(form.montant),
      date:        form.date,
      description: form.description.trim() || null,
      statut:      'en_attente',
    })
    if (error) setErreur(error.message)
    else setForm({ personne: '', montant: '', date: today, description: '' })
    setLoading(false)
  }

  return (
    <div className="page">
      <Affiche
        label="Reste à recevoir"
        mention={symboleDevise}
        valeur={totalRestant.toLocaleString('fr-FR')}
      >
        {enAttente.length !== prets.length && (
          <p className="prets-summary">
            {prets.length - enAttente.length} prêt{prets.length - enAttente.length > 1 ? 's' : ''} remboursé{prets.length - enAttente.length > 1 ? 's' : ''}
          </p>
        )}
      </Affiche>

      <section className="section">
        <h2 className="section-title">Nouveau prêt</h2>
        <form className="form-depense" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>Personne</label>
              <input
                type="text"
                placeholder="Nom de l'emprunteur"
                value={form.personne}
                onChange={e => setForm(f => ({ ...f, personne: e.target.value }))}
              />
            </div>
            <div className="field" style={{ maxWidth: '140px' }}>
              <label>Montant</label>
              <input
                type="number" min="0.01" step="any" placeholder="0"
                value={form.montant}
                onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="field">
            <label>Description (optionnel)</label>
            <input type="text" placeholder="Motif du prêt…" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          {erreur && <p className="erreur">{erreur}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Ajouter le prêt'}
          </button>
        </form>
      </section>

      <section className="section">
        <h2 className="section-title">
          {prets.length} prêt{prets.length !== 1 ? 's' : ''}
        </h2>

        {prets.length === 0 ? (
          <p className="vide">Aucun prêt enregistré.</p>
        ) : (
          <ul className="liste-depenses">
            {prets.map(p => {
              const paye    = sommeMontants(paiementsDe(p.id))
              const restant = resteDu(p.montant, paiementsDe(p.id))
              return (
                <li
                  key={p.id}
                  className={`item-depense item-depense-cliquable${p.statut === 'remboursé' ? ' pret-rembourse' : ''}`}
                  onClick={() => setPretSelectionne(p.id)}
                >
                  <div className="item-info">
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="tag">{p.personne}</span>
                      <span className={`pret-statut${p.statut === 'remboursé' ? ' rembourse' : ' en-attente'}`}>
                        {STATUTS[p.statut]}
                      </span>
                    </div>
                    {p.description && <span className="item-description">{p.description}</span>}
                    <span className="item-date">{p.date}</span>
                  </div>
                  <div className="item-right">
                    <span className="item-montant">
                      {Number(p.montant).toLocaleString('fr-FR')} {symboleDevise}
                    </span>
                    {p.statut === 'en_attente' && paye > 0 && (
                      <span className="pret-restant">
                        Restant : {restant.toLocaleString('fr-FR')} {symboleDevise}
                      </span>
                    )}
                    <div className="item-actions">
                      {p.statut === 'en_attente' && (
                        <button
                          className="btn-icon success"
                          onClick={e => { e.stopPropagation(); if (confirmerSolde(restant, symboleDevise)) marquerRembourse(p.id) }}
                          title="Marquer comme remboursé"
                        >✓</button>
                      )}
                      <button
                        className="btn-icon"
                        onClick={e => { e.stopPropagation(); if (confirm('Supprimer ce prêt et ses paiements ?')) supprimerPret(p.id) }}
                        title="Supprimer"
                      >✕</button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {pretSelectionne && (
        <PretDrawer
          pretId={pretSelectionne}
          prets={prets}
          paiementsPret={paiementsPret}
          onClose={() => setPretSelectionne(null)}
          onAjouterPaiement={ajouterPaiementPret}
          onSupprimerPaiement={supprimerPaiementPret}
          onRembourse={marquerRembourse}
          onRouvrir={rouvrirPret}
          symbole={symboleDevise}
        />
      )}
    </div>
  )
}
