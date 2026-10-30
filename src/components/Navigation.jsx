const TABS = [
  { id: 'brouillon',  label: 'Brouillon' },
  { id: 'depenses',   label: 'Dépenses' },
  { id: 'prets',      label: 'Prêts' },
  { id: 'recettes',   label: 'Recettes' },
  { id: 'parametres', label: 'Réglages' },
]

export default function Navigation({ onglet, setOnglet }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`nav-item${onglet === tab.id ? ' active' : ''}`}
          data-onglet={tab.id}
          aria-current={onglet === tab.id ? 'page' : undefined}
          onClick={() => setOnglet(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
