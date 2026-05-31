import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode,       setMode]       = useState('connexion')
  const [email,      setEmail]      = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur,     setErreur]     = useState('')
  const [message,    setMessage]    = useState('')
  const [loading,    setLoading]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    setMessage('')
    setLoading(true)

    if (mode === 'connexion') {
      const { error } = await signIn(email, motDePasse)
      if (error) setErreur(error.message)
    } else {
      const { error } = await signUp(email, motDePasse)
      if (error) setErreur(error.message)
      else setMessage('Compte créé ! Vérifiez votre email pour confirmer.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-logo">Wari</h1>
        <p className="auth-subtitle">Suivi de dépenses personnelles</p>

        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === 'connexion' ? ' active' : ''}`}
            onClick={() => { setMode('connexion'); setErreur(''); setMessage('') }}
          >Connexion</button>
          <button
            className={`auth-tab${mode === 'inscription' ? ' active' : ''}`}
            onClick={() => { setMode('inscription'); setErreur(''); setMessage('') }}
          >Inscription</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              value={motDePasse}
              onChange={e => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
            />
          </div>

          {erreur  && <p className="erreur">{erreur}</p>}
          {message && <p className="succes">{message}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Chargement…' : mode === 'connexion' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  )
}
