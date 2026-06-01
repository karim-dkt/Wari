import { useState } from 'react'
import { useApp } from '../contexts/AppContext'

const TAGS   = ['Soirée', 'Midi', 'Rapide', 'Rassasiant']
const UNITES = ['pièce', 'g', 'kg', 'ml', 'cl', 'L', 'c. à soupe', 'c. à café']

const ingVide = () => ({ nom: '', quantite: '', unite: 'pièce', prix: '' })

export default function FormRecette({ recette, onCancel, onSave }) {
  const { ajouterRecette, modifierRecette, symboleDevise } = useApp()
  const isEdit = !!recette

  const [form, setForm] = useState({
    nom:               recette?.nom               ?? '',
    tags:              recette?.tags              ?? [],
    temps_preparation: recette?.temps_preparation ?? '',
    instructions:      recette?.instructions      ?? '',
  })

  const [ingredients, setIngredients] = useState(
    recette?.ingredients?.length
      ? recette.ingredients.map(i => ({
          nom:      i.nom,
          quantite: i.quantite,
          unite:    i.unite,
          prix:     i.prix != null ? String(i.prix) : '',
        }))
      : [ingVide()]
  )

  const [loading, setLoading] = useState(false)
  const [erreur,  setErreur]  = useState('')

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }))
  }

  const majIngredient = (idx, champ, valeur) =>
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [champ]: valeur } : ing))

  const ajouterLigne   = () => setIngredients(prev => [...prev, ingVide()])
  const supprimerLigne = (idx) => setIngredients(prev => prev.filter((_, i) => i !== idx))

  const aUnPrix    = ingredients.some(i => i.prix)
  const totalEstime = ingredients.reduce((s, i) => s + (i.prix ? Number(i.prix) : 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nom.trim()) { setErreur('Le nom de la recette est requis.'); return }

    setLoading(true)
    setErreur('')

    const data = {
      nom:               form.nom.trim(),
      tags:              form.tags,
      temps_preparation: form.temps_preparation ? Number(form.temps_preparation) : null,
      instructions:      form.instructions.trim() || null,
    }

    const ings = ingredients
      .filter(i => i.nom.trim())
      .map(i => ({
        nom:      i.nom.trim(),
        quantite: i.quantite.trim() || '1',
        unite:    i.unite,
        prix:     i.prix ? Number(i.prix) : null,
      }))

    const { error } = isEdit
      ? await modifierRecette(recette.id, data, ings)
      : await ajouterRecette(data, ings)

    if (error) { setErreur(error.message) } else { onSave() }
    setLoading(false)
  }

  return (
    <div className="page">
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            {isEdit ? 'Modifier la recette' : 'Nouvelle recette'}
          </h2>
          <button className="btn-ghost" onClick={onCancel}>Annuler</button>
        </div>

        <form className="form-depense" onSubmit={handleSubmit}>
          <div className="field">
            <label>Nom de la recette</label>
            <input
              type="text"
              placeholder="Ex. Pasta Carbonara"
              value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              autoFocus
            />
          </div>

          <div className="field">
            <label>Tags</label>
            <div className="tags-select">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-toggle${form.tags.includes(tag) ? ' active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="field" style={{ maxWidth: '180px' }}>
            <label>Temps de préparation (min)</label>
            <input
              type="number"
              min="1"
              placeholder="20"
              value={form.temps_preparation}
              onChange={e => setForm(f => ({ ...f, temps_preparation: e.target.value }))}
            />
          </div>

          <div className="field">
            <label>Ingrédients</label>
            <div className="ingredients-liste">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="ingredient-entry">
                  <div className="ingredient-row-top">
                    <input
                      type="text"
                      placeholder="Nom de l'ingrédient"
                      value={ing.nom}
                      onChange={e => majIngredient(idx, 'nom', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => supprimerLigne(idx)}
                      disabled={ingredients.length === 1}
                      title="Supprimer"
                    >✕</button>
                  </div>
                  <div className="ingredient-row-bottom">
                    <input
                      type="text"
                      placeholder="Qté"
                      value={ing.quantite}
                      onChange={e => majIngredient(idx, 'quantite', e.target.value)}
                    />
                    <select
                      value={ing.unite}
                      onChange={e => majIngredient(idx, 'unite', e.target.value)}
                    >
                      {UNITES.map(u => <option key={u}>{u}</option>)}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Prix (opt.)"
                      value={ing.prix}
                      onChange={e => majIngredient(idx, 'prix', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn-ghost"
              onClick={ajouterLigne}
              style={{ alignSelf: 'flex-start', marginTop: '0.375rem' }}
            >
              + Ajouter un ingrédient
            </button>

            {aUnPrix && (
              <div className="ingredient-total-bar">
                <span>Total estimé</span>
                <strong>{totalEstime.toLocaleString('fr-FR')} {symboleDevise}</strong>
              </div>
            )}
          </div>

          <div className="field">
            <label>Instructions (optionnel)</label>
            <textarea
              placeholder="Décris les étapes de préparation…"
              value={form.instructions}
              onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
              rows={4}
            />
          </div>

          {erreur && <p className="erreur">{erreur}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Créer la recette'}
          </button>
        </form>
      </section>
    </div>
  )
}
