import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export const CATEGORIES_PAR_DEFAUT = [
  'Alimentation', 'Transport', 'Logement', 'Loisirs', 'Santé', 'Autre',
]

export const DEVISES = [
  { code: 'MAD', symbole: 'DH' },
  { code: 'XOF', symbole: 'FCFA' },
  { code: 'EUR', symbole: '€' },
  { code: 'USD', symbole: '$' },
]

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user }    = useAuth()
  const isOnline    = useOnlineStatus()
  const prevOnline  = useRef(isOnline)

  const [depenses,         setDepenses]         = useState([])
  const [prets,            setPrets]            = useState([])
  const [recettes,         setRecettes]         = useState([])
  const [categoriesCustom, setCategoriesCustom] = useState([])
  const [devise,           setDevise]           = useState('MAD')
  const [loading,          setLoading]          = useState(true)

  const chargerDonnees = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [depRes, catRes, prefRes, pretRes, recRes] = await Promise.all([
      supabase.from('depenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('heure', { ascending: false }),
      supabase.from('categories')
        .select('*')
        .eq('user_id', user.id),
      supabase.from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('prets')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabase.from('recettes')
        .select('*, ingredients(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    if (depRes.data)  setDepenses(depRes.data)
    if (catRes.data)  setCategoriesCustom(catRes.data.map(c => c.nom))
    if (prefRes.data) setDevise(prefRes.data.devise)
    if (pretRes.data) setPrets(pretRes.data)
    if (recRes.data)  setRecettes(recRes.data)

    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      chargerDonnees()
    } else {
      setDepenses([])
      setPrets([])
      setRecettes([])
      setCategoriesCustom([])
      setDevise('MAD')
      setLoading(false)
    }
  }, [user, chargerDonnees])

  useEffect(() => {
    if (isOnline && !prevOnline.current && user) {
      chargerDonnees()
    }
    prevOnline.current = isOnline
  }, [isOnline, user, chargerDonnees])

  const categories = [
    ...CATEGORIES_PAR_DEFAUT,
    ...categoriesCustom.filter(c => !CATEGORIES_PAR_DEFAUT.includes(c)),
  ]

  const ajouterDepense = async (data) => {
    const { data: row, error } = await supabase
      .from('depenses')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()
    if (!error && row) setDepenses(prev => [row, ...prev])
    return { data: row, error }
  }

  const validerBrouillon = async (id) => {
    const { data: row, error } = await supabase
      .from('depenses')
      .update({ brouillon: false })
      .eq('id', id)
      .select()
      .single()
    if (!error && row) setDepenses(prev => prev.map(d => d.id === id ? row : d))
    return { error }
  }

  const supprimerDepense = async (id) => {
    const { error } = await supabase.from('depenses').delete().eq('id', id)
    if (!error) setDepenses(prev => prev.filter(d => d.id !== id))
    return { error }
  }

  const ajouterCategorie = async (nom) => {
    if (categories.includes(nom)) return { error: { message: 'Catégorie déjà existante' } }
    const { error } = await supabase.from('categories').insert({ nom, user_id: user.id })
    if (!error) setCategoriesCustom(prev => [...prev, nom])
    return { error }
  }

  const supprimerCategorie = async (nom) => {
    const { error } = await supabase.from('categories').delete()
      .eq('user_id', user.id).eq('nom', nom)
    if (!error) setCategoriesCustom(prev => prev.filter(c => c !== nom))
    return { error }
  }

  const mettreAJourDevise = async (nouvelleDevise) => {
    const { error } = await supabase.from('preferences')
      .upsert({ user_id: user.id, devise: nouvelleDevise })
    if (!error) setDevise(nouvelleDevise)
    return { error }
  }

  const ajouterPret = async (data) => {
    const { data: row, error } = await supabase
      .from('prets')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()
    if (!error && row) setPrets(prev => [row, ...prev])
    return { data: row, error }
  }

  const marquerRembourse = async (id) => {
    const { data: row, error } = await supabase
      .from('prets')
      .update({ statut: 'remboursé' })
      .eq('id', id)
      .select()
      .single()
    if (!error && row) setPrets(prev => prev.map(p => p.id === id ? row : p))
    return { error }
  }

  const supprimerPret = async (id) => {
    const { error } = await supabase.from('prets').delete().eq('id', id)
    if (!error) setPrets(prev => prev.filter(p => p.id !== id))
    return { error }
  }

  const ajouterRecette = async (data, ingredients) => {
    const { data: row, error } = await supabase
      .from('recettes')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()
    if (error || !row) return { error }

    if (ingredients.length > 0) {
      const { error: ingErr } = await supabase
        .from('ingredients')
        .insert(ingredients.map(ing => ({ ...ing, recette_id: row.id })))
      if (ingErr) return { error: ingErr }
    }

    const { data: full } = await supabase
      .from('recettes')
      .select('*, ingredients(*)')
      .eq('id', row.id)
      .single()

    setRecettes(prev => [full ?? { ...row, ingredients: [] }, ...prev])
    return { data: row, error: null }
  }

  const modifierRecette = async (id, data, ingredients) => {
    const { error: upErr } = await supabase
      .from('recettes').update(data).eq('id', id)
    if (upErr) return { error: upErr }

    await supabase.from('ingredients').delete().eq('recette_id', id)

    if (ingredients.length > 0) {
      const { error: insErr } = await supabase
        .from('ingredients')
        .insert(ingredients.map(ing => ({ ...ing, recette_id: id })))
      if (insErr) return { error: insErr }
    }

    const { data: full } = await supabase
      .from('recettes')
      .select('*, ingredients(*)')
      .eq('id', id)
      .single()

    if (full) setRecettes(prev => prev.map(r => r.id === id ? full : r))
    return { error: null }
  }

  const supprimerRecette = async (id) => {
    const { error } = await supabase.from('recettes').delete().eq('id', id)
    if (!error) setRecettes(prev => prev.filter(r => r.id !== id))
    return { error }
  }

  const symboleDevise = DEVISES.find(d => d.code === devise)?.symbole ?? devise

  return (
    <AppContext.Provider value={{
      depenses, prets, recettes, categories, categoriesCustom,
      devise, symboleDevise, DEVISES,
      loading,
      chargerDonnees,
      ajouterDepense, validerBrouillon, supprimerDepense,
      ajouterCategorie, supprimerCategorie, mettreAJourDevise,
      ajouterPret, marquerRembourse, supprimerPret,
      ajouterRecette, modifierRecette, supprimerRecette,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
