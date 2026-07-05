import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setLoading(true)
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    let { data } = await supabase.from('profiles').select('*').eq('id', userId).single()

    if (!data) {
      const { data: userData } = await supabase.auth.getUser()
      const username =
        userData?.user?.user_metadata?.username ||
        userData?.user?.email?.split('@')[0] ||
        'user'
      // ignoreDuplicates: true で既存のrole(admin等)を上書きしない
      const { data: created } = await supabase
        .from('profiles')
        .upsert({ id: userId, username, role: 'user' }, { onConflict: 'id', ignoreDuplicates: true })
        .select()
        .single()
      data = created
    }

    console.log('[Auth] profile loaded:', data?.username, 'role:', data?.role)
    setProfile(data)
    setLoading(false)
  }

  async function signUp({ email, password, username }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, role: 'user' } },
    })
    if (error) throw error
    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
