import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { CATEGORIES_PAR_DEFAUT } from '../contexts/AppContext'

export default function Parametres() {
  const { signOut, user } = useAuth()
  const {
    devise, DEVISES, mettreAJourDevise,
    categoriesCustom, ajouterCategorie, supprimerCategorie, renommerCategorie,
  } = useApp()

  const [nouvelleCategorie, setNouvelleCategorie] = useState('')
  const [erreur,            setErreur]            = useState('')
  const [editingCat,        setEditingCat]        = useState(null)
  const [editNom,           setEditNom]           = useState('')
  const [editErreur,        setEditErreur]        = useState('')

  const handleAjouter = async (e) => {
    e.preventDefault()
    setErreur('')
    const nom = nouvelleCategorie.trim()
    if (!nom) return
    const { error } = await ajouterCategorie(nom)
    if (error) setErreur(error.message)
    else setNouvelleCategorie('')
  }

  const handleCommencerEdition = (cat) => {
    setEditingCat(cat)
    setEditNom(cat)
    setEditErreur('')
  }

  const handleRenommer = async (e) => {
    e.preventDefault()
    setEditErreur('')
    const { error } = await renommerCategorie(editingCat, editNom)
    if (error) setEditErreur(error.message)
    else setEditingCat(null)
  }

  return (
    <div className="page">
      <section className="section">
        <h2 className="section-title">Compte</h2>
        <p className="user-email">{user.email}</p>
        <button className="btn-danger" onClick={signOut}>Se déconnecter</button>
      </section>

      <section className="section">
        <h2 className="section-title">Devise</h2>
        <div className="devise-grid">
          {DEVISES.map(d => (
            <button
              key={d.code}
              className={`devise-btn${devise === d.code ? ' active' : ''}`}
              onClick={() => mettreAJourDevise(d.code)}
            >
              <span className="devise-code">{d.code}</span>
              <span className="devise-symbole">{d.symbole}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Catégories personnalisées</h2>

        {categoriesCustom.length > 0 ? (
          <div className="categories-list">
            {categoriesCustom.map(cat => (
              <div key={cat} className="categorie-item">
                {editingCat === cat ? (
                  <form onSubmit={handleRenommer} className="categorie-edit-form">
                    <input
                      value={editNom}
                      onChange={e => setEditNom(e.target.value)}
                      autoFocus
                      maxLength={50}
                    />
                    <button type="submit" className="btn-icon success" title="Valider">✓</button>
                    <button type="button" className="btn-icon" onClick={() => setEditingCat(null)} title="Annuler">✕</button>
                  </form>
                ) : (
                  <>
                    <span>{cat}</span>
                    <div className="item-actions">
                      <button className="btn-icon edit" onClick={() => handleCommencerEdition(cat)} title="Renommer">✏</button>
                      <button className="btn-icon" onClick={() => supprimerCategorie(cat)} title="Supprimer">✕</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="vide" style={{ padding: '0.5rem 0' }}>Aucune catégorie personnalisée.</p>
        )}

        {editErreur && <p className="erreur">{editErreur}</p>}

        <form onSubmit={handleAjouter} className="form-row">
          <input
            type="text"
            value={nouvelleCategorie}
            onChange={e => setNouvelleCategorie(e.target.value)}
            placeholder="Nouvelle catégorie…"
            maxLength={50}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary">Ajouter</button>
        </form>
        {erreur && <p className="erreur">{erreur}</p>}

        <div>
          <p className="section-title" style={{ marginBottom: '0.5rem' }}>
            Catégories par défaut
          </p>
          <div className="categories-list">
            {CATEGORIES_PAR_DEFAUT.map(cat => (
              <div key={cat} className="categorie-item disabled">
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
