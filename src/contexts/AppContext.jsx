import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { dateLocale } from '../lib/dates'
import { resteDu } from '../lib/montants'

export const CATEGORIES_PAR_DEFAUT = [
  'Alimentation', 'Transport', 'Logement', 'Loisirs', 'Santé', 'Autre',
]

export const DEVISES = [
  { code: 'MAD', symbole: 'DH' },
  { code: 'XOF', symbole: 'FCFA' },
  { code: 'EUR', symbole: '€' },
  { code: 'USD', symbole: '$' },
]

const TAILLE_PAGE = 1000

// Supabase plafonne chaque réponse : on enchaîne les pages jusqu'à tout récupérer
const chargerToutesLesLignes = async (requete) => {
  const lignes = []
  for (;;) {
    const { data, error } = await requete().range(lignes.length, lignes.length + TAILLE_PAGE - 1)
    if (error) return { data: null, error }
    lignes.push(...data)
    if (data.length < TAILLE_PAGE) return { data: lignes, error: null }
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user }   = useAuth()
  const isOnline   = useOnlineStatus()
  const prevOnline = useRef(isOnline)

  const [depenses,         setDepenses]         = useState([])
  const [prets,            setPrets]            = useState([])
  const [paiementsPret,    setPaiementsPret]    = useState([])
  const [recettes,         setRecettes]         = useState([])
  const [categoriesCustom, setCategoriesCustom] = useState([])
  const [devise,           setDevise]           = useState('MAD')
  const [loading,          setLoading]          = useState(true)
  const [erreur,           setErreur]           = useState('')

  const chargerDonnees = useCallback(async () => {
    if (!user) return

    const [depRes, catRes, prefRes, pretRes, recRes, paiRes] = await Promise.all([
      chargerToutesLesLignes(() => supabase.from('depenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('heure', { ascending: false })
        .order('id')),
      supabase.from('categories')
        .select('*')
        .eq('user_id', user.id),
      supabase.from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      chargerToutesLesLignes(() => supabase.from('prets')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('id')),
      chargerToutesLesLignes(() => supabase.from('recettes')
        .select('*, ingredients(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .order('id')),
      chargerToutesLesLignes(() => supabase.from('paiements_pret')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('id')),
    ])

    const echec = [depRes, catRes, prefRes, pretRes, recRes, paiRes].find(r => r.error)
    setErreur(echec ? `Chargement incomplet : ${echec.error.message}` : '')

    if (depRes.data)  setDepenses(depRes.data)
    if (catRes.data)  setCategoriesCustom(catRes.data.map(c => c.nom))
    if (prefRes.data) setDevise(prefRes.data.devise)
    if (pretRes.data) setPrets(pretRes.data)
    if (recRes.data)  setRecettes(recRes.data)
    if (paiRes.data)  setPaiementsPret(paiRes.data)

    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      chargerDonnees()
    } else {
      setDepenses([])
      setPrets([])
      setPaiementsPret([])
      setRecettes([])
      setCategoriesCustom([])
      setDevise('MAD')
      setErreur('')
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

  const signaler = (error) => {
    if (error) setErreur(`Action impossible : ${error.message}`)
    return { error }
  }

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
    return signaler(error)
  }

  const supprimerDepense = async (id) => {
    const { error } = await supabase.from('depenses').delete().eq('id', id)
    if (!error) setDepenses(prev => prev.filter(d => d.id !== id))
    return signaler(error)
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
    return signaler(error)
  }

  const renommerCategorie = async (ancienNom, nouveauNom) => {
    const trim = nouveauNom.trim()
    if (!trim || trim === ancienNom) return { error: null }
    if (categories.includes(trim)) return { error: { message: 'Cette catégorie existe déjà' } }
    const { error } = await supabase.from('categories')
      .update({ nom: trim })
      .eq('user_id', user.id)
      .eq('nom', ancienNom)
    if (error) return { error }
    const { error: depErr } = await supabase.from('depenses')
      .update({ categorie: trim })
      .eq('user_id', user.id)
      .eq('categorie', ancienNom)
    if (depErr) {
      await supabase.from('categories')
        .update({ nom: ancienNom })
        .eq('user_id', user.id)
        .eq('nom', trim)
      return { error: depErr }
    }
    setCategoriesCustom(prev => prev.map(c => c === ancienNom ? trim : c))
    setDepenses(prev => prev.map(d => d.categorie === ancienNom ? { ...d, categorie: trim } : d))
    return { error: null }
  }

  const mettreAJourDevise = async (nouvelleDevise) => {
    const { error } = await supabase.from('preferences')
      .upsert({ user_id: user.id, devise: nouvelleDevise })
    if (!error) setDevise(nouvelleDevise)
    return signaler(error)
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

  const changerStatutPret = async (id, statut) => {
    const { data: row, error } = await supabase
      .from('prets')
      .update({ statut })
      .eq('id', id)
      .select()
      .single()
    if (!error && row) setPrets(prev => prev.map(p => p.id === id ? row : p))
    return signaler(error)
  }

  // Le reste dû est enregistré comme paiement pour que l'historique reste juste
  const marquerRembourse = async (id) => {
    const pret    = prets.find(p => p.id === id)
    const restant = resteDu(pret.montant, paiementsPret.filter(p => p.pret_id === id))
    if (restant > 0) {
      const { data: row, error } = await supabase
        .from('paiements_pret')
        .insert({ pret_id: id, user_id: user.id, montant: restant, date: dateLocale(), note: 'Solde' })
        .select()
        .single()
      if (error) return signaler(error)
      setPaiementsPret(prev => [row, ...prev])
    }
    return changerStatutPret(id, 'remboursé')
  }

  const supprimerPret = async (id) => {
    const { error } = await supabase.from('prets').delete().eq('id', id)
    if (!error) {
      setPrets(prev => prev.filter(p => p.id !== id))
      setPaiementsPret(prev => prev.filter(p => p.pret_id !== id))
    }
    return signaler(error)
  }

  const ajouterPaiementPret = async (pretId, montant, date, note) => {
    const { data: row, error } = await supabase
      .from('paiements_pret')
      .insert({ pret_id: pretId, user_id: user.id, montant: Number(montant), date, note: note || null })
      .select()
      .single()
    if (error || !row) return { data: null, error }
    setPaiementsPret(prev => [row, ...prev])
    const { data: tous } = await supabase
      .from('paiements_pret').select('montant').eq('pret_id', pretId)
    if (tous) {
      const pret = prets.find(p => p.id === pretId)
      if (pret && pret.statut === 'en_attente' && resteDu(pret.montant, tous) === 0) {
        await changerStatutPret(pretId, 'remboursé')
      }
    }
    return { data: row, error: null }
  }

  const supprimerPaiementPret = async (id) => {
    const { error } = await supabase.from('paiements_pret').delete().eq('id', id)
    if (error) return signaler(error)
    const paiement = paiementsPret.find(p => p.id === id)
    const restants = paiementsPret.filter(p => p.pret_id === paiement.pret_id && p.id !== id)
    setPaiementsPret(prev => prev.filter(p => p.id !== id))
    const pret = prets.find(p => p.id === paiement.pret_id)
    if (pret.statut === 'remboursé' && resteDu(pret.montant, restants) > 0) {
      return changerStatutPret(pret.id, 'en_attente')
    }
    return { error: null }
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
      if (ingErr) {
        await supabase.from('recettes').delete().eq('id', row.id)
        return { error: ingErr }
      }
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

    // Les anciens ingrédients ne sont supprimés qu'une fois les nouveaux enregistrés
    const anciensIds = recettes.find(r => r.id === id)?.ingredients.map(i => i.id) ?? []

    if (ingredients.length > 0) {
      const { error: insErr } = await supabase
        .from('ingredients')
        .insert(ingredients.map(ing => ({ ...ing, recette_id: id })))
      if (insErr) return { error: insErr }
    }

    if (anciensIds.length > 0) {
      const { error: delErr } = await supabase
        .from('ingredients').delete().in('id', anciensIds)
      if (delErr) return { error: delErr }
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
    return signaler(error)
  }

  const symboleDevise = DEVISES.find(d => d.code === devise)?.symbole ?? devise

  return (
    <AppContext.Provider value={{
      depenses, prets, paiementsPret, recettes, categories, categoriesCustom,
      devise, symboleDevise, DEVISES,
      loading, erreur, effacerErreur: () => setErreur(''),
      chargerDonnees,
      ajouterDepense, validerBrouillon, supprimerDepense,
      ajouterCategorie, supprimerCategorie, renommerCategorie, mettreAJourDevise,
      ajouterPret, marquerRembourse, rouvrirPret: (id) => changerStatutPret(id, 'en_attente'), supprimerPret,
      ajouterPaiementPret, supprimerPaiementPret,
      ajouterRecette, modifierRecette, supprimerRecette,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
