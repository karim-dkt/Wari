import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { CATEGORIES_PAR_DEFAUT } from '../contexts/AppContext'

export default function Parametres() {
  const { signOut, user }   = useAuth()
  const {
    devise, DEVISES, mettreAJourDevise,
    categoriesCustom, ajouterCategorie, supprimerCategorie,
  } = useApp()

  const [nouvelleCategorie, setNouvelleCategorie] = useState('')
  const [erreur,            setErreur]            = useState('')

  const handleAjouter = async (e) => {
    e.preventDefault()
    setErreur('')
    const nom = nouvelleCategorie.trim()
    if (!nom) return
    const { error } = await ajouterCategorie(nom)
    if (error) setErreur(error.message)
    else setNouvelleCategorie('')
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
                <span>{cat}</span>
                <button className="btn-icon" onClick={() => supprimerCategorie(cat)}>✕</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="vide" style={{ padding: '0.5rem 0' }}>Aucune catégorie personnalisée.</p>
        )}

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
