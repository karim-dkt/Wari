import { useApp } from '../contexts/AppContext'
import FormDepense from './FormDepense'

export default function Brouillon() {
  const { depenses, ajouterDepense, validerBrouillon, supprimerDepense, symboleDevise } = useApp()

  const brouillons = depenses.filter(d => d.brouillon)
  const sousTotal  = brouillons.reduce((s, d) => s + Number(d.montant), 0)

  const ajouterEnBrouillon = (data) => ajouterDepense({ ...data, brouillon: true })
  const enregistrer        = (data) => ajouterDepense({ ...data, brouillon: false })

  return (
    <div className="page">
      <section className="section">
        <h2 className="section-title">Nouvelle entrée</h2>
        <FormDepense
          onSubmit={ajouterEnBrouillon}
          submitLabel="Ajouter au brouillon"
          onSave={enregistrer}
          saveLabel="Enregistrer"
        />
      </section>

      {brouillons.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Brouillon ({brouillons.length})</h2>
            <p className="sous-total">
              Sous-total&nbsp;: <strong>{sousTotal.toLocaleString('fr-FR')} {symboleDevise}</strong>
            </p>
          </div>

          <ul className="liste-depenses">
            {brouillons.map(d => (
              <li key={d.id} className="item-depense brouillon">
                <div className="item-info">
                  <span className="tag">{d.categorie}</span>
                  {d.description && <span className="item-description">{d.description}</span>}
                  <span className="item-date">{d.date} · {d.heure?.slice(0, 5)}</span>
                </div>
                <div className="item-right">
                  <span className="item-montant">
                    {Number(d.montant).toLocaleString('fr-FR')} {symboleDevise}
                  </span>
                  <div className="item-actions">
                    <button
                      className="btn-icon success"
                      onClick={() => validerBrouillon(d.id)}
                      title="Valider la dépense"
                    >✓</button>
                    <button
                      className="btn-icon"
                      onClick={() => supprimerDepense(d.id)}
                      title="Supprimer"
                    >✕</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {brouillons.length === 0 && (
        <p className="vide">Aucun brouillon. Ajoutez une entrée ci-dessus.</p>
      )}
    </div>
  )
}
