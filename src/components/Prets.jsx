import { useState } from 'react'
import { useApp } from '../contexts/AppContext'

export default function Prets() {
  const { prets, ajouterPret, marquerRembourse, supprimerPret, symboleDevise } = useApp()

  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm]     = useState({ personne: '', montant: '', date: today, description: '' })
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur]   = useState('')

  const enAttente      = prets.filter(p => p.statut === 'en_attente')
  const totalEnAttente = enAttente.reduce((s, p) => s + Number(p.montant), 0)

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
    if (error) {
      setErreur(error.message)
    } else {
      setForm({ personne: '', montant: '', date: today, description: '' })
    }
    setLoading(false)
  }

  return (
    <div className="page">

      <section className="section">
        <div className="total-card">
          <div className="total-label">Total en attente</div>
          <div className="total-montant">
            {totalEnAttente.toLocaleString('fr-FR')} {symboleDevise}
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
                type="number"
                min="0.01"
                step="any"
                placeholder="0"
                value={form.montant}
                onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Description (optionnel)</label>
            <input
              type="text"
              placeholder="Motif du prêt…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
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
            {prets.map(p => (
              <li
                key={p.id}
                className={`item-depense${p.statut === 'remboursé' ? ' pret-rembourse' : ''}`}
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
                  <div className="item-actions">
                    {p.statut === 'en_attente' && (
                      <button
                        className="btn-icon success"
                        onClick={() => marquerRembourse(p.id)}
                        title="Marquer comme remboursé"
                      >✓</button>
                    )}
                    <button
                      className="btn-icon"
                      onClick={() => supprimerPret(p.id)}
                      title="Supprimer"
                    >✕</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  )
}
