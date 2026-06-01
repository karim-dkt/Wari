import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import FormRecette from './FormRecette'

function coutTotal(ingredients) {
  const total = (ingredients ?? []).reduce((s, i) => s + (i.prix ? Number(i.prix) : 0), 0)
  return total > 0 ? total : null
}

export default function Recettes() {
  const { recettes, supprimerRecette, symboleDevise } = useApp()
  const [modeForm,        setModeForm]        = useState(null)
  const [recetteDetail,   setRecetteDetail]   = useState(null)

  const cuisinerAleatoire = () => {
    if (!recettes.length) return
    setRecetteDetail(recettes[Math.floor(Math.random() * recettes.length)])
  }

  const handleSupprimer = async (id) => {
    await supprimerRecette(id)
    setRecetteDetail(null)
  }

  if (modeForm === 'ajout') {
    return (
      <FormRecette
        onCancel={() => setModeForm(null)}
        onSave={() => setModeForm(null)}
      />
    )
  }

  if (modeForm && typeof modeForm === 'object') {
    return (
      <FormRecette
        recette={modeForm}
        onCancel={() => setModeForm(null)}
        onSave={() => { setModeForm(null); setRecetteDetail(null) }}
      />
    )
  }

  return (
    <div className="page">
      {recettes.length > 0 && (
        <button className="btn-aleatoire" onClick={cuisinerAleatoire}>
          🎲 Je cuisine ça ce soir
        </button>
      )}

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            {recettes.length} recette{recettes.length !== 1 ? 's' : ''}
          </h2>
          <button className="btn-primary" onClick={() => setModeForm('ajout')}>
            + Ajouter
          </button>
        </div>

        {recettes.length === 0 ? (
          <div className="vide">
            <p>Aucune recette pour l'instant.</p>
            <button
              className="btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => setModeForm('ajout')}
            >
              Ajouter ma première recette
            </button>
          </div>
        ) : (
          <div className="recettes-liste">
            {recettes.map(r => {
              const cout = coutTotal(r.ingredients)
              return (
                <div
                  key={r.id}
                  className="recette-card"
                  onClick={() => setRecetteDetail(r)}
                >
                  <div className="recette-nom">{r.nom}</div>
                  {r.tags?.length > 0 && (
                    <div className="recette-tags">
                      {r.tags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                  )}
                  <div className="recette-meta">
                    {r.temps_preparation && <span>⏱ {r.temps_preparation} min</span>}
                    {cout !== null && (
                      <span>~{cout.toLocaleString('fr-FR')} {symboleDevise}</span>
                    )}
                    {(r.ingredients ?? []).length > 0 && (
                      <span>
                        {r.ingredients.length} ingrédient{r.ingredients.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {recetteDetail && (
        <div
          className="drawer-overlay"
          onClick={e => { if (e.target === e.currentTarget) setRecetteDetail(null) }}
        >
          <div className="drawer">
            <div className="drawer-handle" />
            <div className="drawer-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.25 }}>
                {recetteDetail.nom}
              </h2>
              <button className="btn-icon" onClick={() => setRecetteDetail(null)}>✕</button>
            </div>

            {recetteDetail.tags?.length > 0 && (
              <div className="recette-tags" style={{ marginBottom: '0.75rem' }}>
                {recetteDetail.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            )}

            {recetteDetail.temps_preparation && (
              <div className="drawer-detail">
                <span className="drawer-label">Préparation</span>
                <span className="drawer-value">{recetteDetail.temps_preparation} min</span>
              </div>
            )}

            {(recetteDetail.ingredients ?? []).length > 0 && (
              <>
                <div className="drawer-detail" style={{ paddingBottom: '0.375rem' }}>
                  <span className="drawer-label">Ingrédients</span>
                </div>
                <div className="ingredients-detail">
                  {recetteDetail.ingredients.map(ing => (
                    <div key={ing.id} className="ingredient-detail-row">
                      <span>{ing.nom}</span>
                      <span className="ingredient-detail-qte">
                        {ing.quantite} {ing.unite}
                        {ing.prix ? ` · ~${Number(ing.prix).toLocaleString('fr-FR')} ${symboleDevise}` : ''}
                      </span>
                    </div>
                  ))}
                </div>

                {coutTotal(recetteDetail.ingredients) !== null && (
                  <div className="drawer-detail">
                    <span className="drawer-label">Coût estimé</span>
                    <span className="drawer-value" style={{ fontWeight: 700 }}>
                      ~{coutTotal(recetteDetail.ingredients).toLocaleString('fr-FR')} {symboleDevise}
                    </span>
                  </div>
                )}
              </>
            )}

            {recetteDetail.instructions && (
              <div
                className="drawer-detail"
                style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}
              >
                <span className="drawer-label">Instructions</span>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {recetteDetail.instructions}
                </p>
              </div>
            )}

            <div className="form-actions" style={{ marginTop: '1.25rem' }}>
              <button
                className="btn-ghost"
                style={{ flex: 1 }}
                onClick={() => { setModeForm(recetteDetail); setRecetteDetail(null) }}
              >
                Modifier
              </button>
              <button
                className="btn-danger"
                onClick={() => handleSupprimer(recetteDetail.id)}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
