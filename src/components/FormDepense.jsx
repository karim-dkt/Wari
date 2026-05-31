import { useState } from 'react'
import { useApp } from '../contexts/AppContext'

const todayStr = () => new Date().toISOString().split('T')[0]
const nowStr   = () => new Date().toTimeString().slice(0, 5)

export default function FormDepense({
  onSubmit,
  submitLabel = 'Ajouter',
  onSave,
  saveLabel = 'Enregistrer',
}) {
  const { categories, symboleDevise, devise } = useApp()

  const [montant,     setMontant]     = useState('')
  const [description, setDescription] = useState('')
  const [categorie,   setCategorie]   = useState('')
  const [date,        setDate]        = useState(todayStr)
  const [heure,       setHeure]       = useState(nowStr)
  const [erreur,      setErreur]      = useState('')
  const [loadingType, setLoadingType] = useState(null)

  const loading = loadingType !== null

  const buildData = () => ({
    montant: Number(montant),
    description,
    categorie: categorie || 'Autre',
    date,
    heure,
    devise,
  })

  const validate = () => {
    const val = Number(montant)
    if (!montant || isNaN(val) || val <= 0) {
      setErreur('Veuillez saisir un montant valide.')
      return false
    }
    return true
  }

  const reset = () => {
    setMontant('')
    setDescription('')
    setCategorie('')
    setDate(todayStr())
    setHeure(nowStr())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    if (!validate()) return
    setLoadingType('draft')
    const { error } = await onSubmit(buildData())
    if (error) {
      setErreur(error.message)
    } else {
      reset()
    }
    setLoadingType(null)
  }

  const handleSave = async () => {
    setErreur('')
    if (!validate()) return
    setLoadingType('save')
    const { error } = await onSave(buildData())
    if (error) {
      setErreur(error.message)
    } else {
      reset()
    }
    setLoadingType(null)
  }

  return (
    <form onSubmit={handleSubmit} className="form-depense">
      <div className="form-row">
        <div className="field">
          <label>Montant ({symboleDevise})</label>
          <input
            type="number"
            value={montant}
            onChange={e => setMontant(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            inputMode="decimal"
          />
        </div>
        <div className="field">
          <label>Catégorie</label>
          <select value={categorie} onChange={e => setCategorie(e.target.value)}>
            <option value="">Sélectionner…</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Description</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optionnel)"
          maxLength={200}
        />
      </div>

      <div className="form-row">
        <div className="field">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Heure</label>
          <input
            type="time"
            value={heure}
            onChange={e => setHeure(e.target.value)}
            required
          />
        </div>
      </div>

      {erreur && <p className="erreur">{erreur}</p>}

      <div className={onSave ? 'form-actions' : ''}>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loadingType === 'draft' ? 'Ajout…' : submitLabel}
        </button>
        {onSave && (
          <button type="button" className="btn-primary" onClick={handleSave} disabled={loading}>
            {loadingType === 'save' ? 'Enreg…' : saveLabel}
          </button>
        )}
      </div>
    </form>
  )
}
