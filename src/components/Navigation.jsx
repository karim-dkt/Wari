const TABS = [
  { id: 'brouillon',  label: 'Brouillon',   icon: '✏️' },
  { id: 'depenses',   label: 'Dépenses',    icon: '📋' },
  { id: 'parametres', label: 'Paramètres',  icon: '⚙️' },
]

export default function Navigation({ onglet, setOnglet }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`nav-item${onglet === tab.id ? ' active' : ''}`}
          onClick={() => setOnglet(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
