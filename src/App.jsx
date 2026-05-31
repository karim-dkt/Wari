import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import Auth from './components/Auth'
import Navigation from './components/Navigation'
import Brouillon from './components/Brouillon'
import Depenses from './components/Depenses'
import Parametres from './components/Parametres'

export default function App() {
  const { user, loading } = useAuth()
  const isOnline          = useOnlineStatus()
  const [onglet, setOnglet] = useState('brouillon')

  if (loading) {
    return (
      <div className="splash">
        <span className="logo">Wari</span>
      </div>
    )
  }

  if (!user) return <Auth />

  return (
    <AppProvider>
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">Wari</h1>
          {!isOnline && <span className="offline-badge">Hors ligne</span>}
        </header>
        <main className="app-main">
          {onglet === 'brouillon'   && <Brouillon />}
          {onglet === 'depenses'    && <Depenses />}
          {onglet === 'parametres'  && <Parametres />}
        </main>
        <Navigation onglet={onglet} setOnglet={setOnglet} />
      </div>
    </AppProvider>
  )
}
