import { useState } from 'react'
import { useApp } from '../contexts/AppContext'

function PretDrawer({ pretId, prets, paiementsPret, onClose, onAjouterPaiement, onSupprimerPaiement, onRembourse, symbole }) {
  const pret     = prets.find(p => p.id === pretId)
  const paiements = paiementsPret.filter(p => p.pret_id === pretId)

  const today = new Date().toISOString().slice(0, 10)
  const [form,    setForm]    = useState({ montant: '', date: today, note: '' })
  const [loading, setLoading] = useState(false)
  const [erreur,  setErreur]  = useState('')

  if (!pret) return null

  const totalPaye  = paiements.reduce((s, p) => s + Number(p.montant), 0)
  const restant    = Math.max(0, Number(pret.montant) - totalPaye)
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
              {pret.statut === 'remboursé' ? '✓ Remboursé' : '⏳ En attente'}
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

        <div className="pret-progress">
          <div className="pret-progress-bar" style={{ width: `${progression}%` }} />
        </div>

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
                <button className="btn-icon" onClick={() => onSupprimerPaiement(p.id)} title="Supprimer">✕</button>
              </div>
            ))}
          </div>
        )}

        {pret.statut === 'en_attente' && (
          <button
            className="btn-danger"
            style={{ marginTop: '1rem', width: '100%' }}
            onClick={() => { onRembourse(pret.id); onClose() }}
          >
            Marquer comme remboursé
          </button>
        )}
      </div>
    </div>
  )
}

export default function Prets() {
  const {
    prets, paiementsPret,
    ajouterPret, marquerRembourse, supprimerPret,
    ajouterPaiementPret, supprimerPaiementPret,
    symboleDevise,
  } = useApp()

  const today = new Date().toISOString().slice(0, 10)
  const [form,           setForm]           = useState({ personne: '', montant: '', date: today, description: '' })
  const [loading,        setLoading]        = useState(false)
  const [erreur,         setErreur]         = useState('')
  const [pretSelectionne, setPretSelectionne] = useState(null)

  const enAttente = prets.filter(p => p.statut === 'en_attente')

  const totalRestant = enAttente.reduce((s, p) => {
    const paye = paiementsPret
      .filter(pp => pp.pret_id === p.id)
      .reduce((a, pp) => a + Number(pp.montant), 0)
    return s + Math.max(0, Number(p.montant) - paye)
  }, 0)

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
      <section className="section">
        <div className="total-card">
          <div className="total-label">Total restant à recevoir</div>
          <div className="total-montant">
            {totalRestant.toLocaleString('fr-FR')} {symboleDevise}
          </div>
        </div>
        {enAttente.length !== prets.length && (
          <p className="prets-summary">
            {prets.length - enAttente.length} prêt{prets.length - enAttente.length > 1 ? 's' : ''} remboursé{prets.length - enAttente.length > 1 ? 's' : ''}
          </p>
        )}
      </section>

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
              const paye    = paiementsPret.filter(pp => pp.pret_id === p.id).reduce((s, pp) => s + Number(pp.montant), 0)
              const restant = Math.max(0, Number(p.montant) - paye)
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
                        {p.statut === 'remboursé' ? '✓ Remboursé' : '⏳ En attente'}
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
                          onClick={e => { e.stopPropagation(); marquerRembourse(p.id) }}
                          title="Marquer comme remboursé"
                        >✓</button>
                      )}
                      <button
                        className="btn-icon"
                        onClick={e => { e.stopPropagation(); supprimerPret(p.id) }}
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
          symbole={symboleDevise}
        />
      )}
    </div>
  )
}
