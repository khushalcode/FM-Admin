'use client'

/**
 * Supabase Auth context — Food Munch Admin
 *
 * Uses Supabase Auth for authentication. When Supabase is not configured
 * (no env vars), falls back to a localStorage-based mock that accepts
 * demo credentials:
 *   admin@freshcart.com / DemoPass123!
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { AppUser } from '@/lib/types'

const DEMO_EMAIL = 'admin@freshcart.com'
const DEMO_PASSWORD = 'DemoPass123!'
const MOCK_SESSION_KEY = 'food-munch-mock-session'

interface AuthContextValue {
  user: AppUser | null
  session: Session | null
  loading: boolean
  isMockMode: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const mockUser = (email: string): AppUser => ({
  id: `mock_${btoa(email).slice(0, 16)}`,
  firebase_uid: `mock_${btoa(email).slice(0, 16)}`,
  email,
  full_name: email.split('@')[0].replace(/\b\w/g, (c) => c.toUpperCase()),
  role: 'admin',
  is_active: true,
  created_at: new Date().toISOString(),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const isMockMode = !isSupabaseConfigured

  useEffect(() => {
    if (isMockMode) {
      // Mock mode: read session from localStorage
      try {
        const raw = window.localStorage.getItem(MOCK_SESSION_KEY)
        if (raw) {
          const u = JSON.parse(raw) as AppUser
          setUser(u)
        }
      } catch {}
      setLoading(false)
      return
    }

    // Real Supabase mode
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session?.user) {
          fetchProfile(session.user)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [isMockMode])

  const fetchProfile = async (authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !data) {
        const fallbackUser: AppUser = {
          id: authUser.id,
          firebase_uid: authUser.id,
          email: authUser.email || '',
          phone: authUser.phone || undefined,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          role: (authUser.user_metadata?.role as any) || 'admin',
          avatar_url: authUser.user_metadata?.avatar_url || undefined,
          is_active: true,
          created_at: authUser.created_at || new Date().toISOString(),
        }
        setUser(fallbackUser)
      } else {
        setUser(data as AppUser)
      }
    } catch (e) {
      console.error('[auth] profile fetch failed:', e)
      setUser({
        id: authUser.id,
        firebase_uid: authUser.id,
        email: authUser.email || '',
        full_name: authUser.email?.split('@')[0] || 'User',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const signIn = useCallback(async (email: string, password: string) => {
    if (isMockMode) {
      // Mock auth: accept any email/password, but highlight demo creds
      const u = mockUser(email)
      setUser(u)
      try { window.localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(u)) } catch {}
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message || null }
  }, [isMockMode])

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: string) => {
    if (isMockMode) {
      const u = { ...mockUser(email), full_name: fullName, role: role as any }
      setUser(u)
      try { window.localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(u)) } catch {}
      return { error: null }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } }
    })
    return { error: error?.message || null }
  }, [isMockMode])

  const signInWithGoogle = useCallback(async () => {
    if (isMockMode) {
      const u = mockUser('admin@freshcart.com')
      setUser(u)
      try { window.localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(u)) } catch {}
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    return { error: error?.message || null }
  }, [isMockMode])

  const signOut = useCallback(async () => {
    if (isMockMode) {
      setUser(null)
      try { window.localStorage.removeItem(MOCK_SESSION_KEY) } catch {}
      return
    }
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }, [isMockMode])

  const resetPassword = useCallback(async (email: string) => {
    if (isMockMode) return { error: null }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    })
    return { error: error?.message || null }
  }, [isMockMode])

  const value: AuthContextValue = {
    user,
    session,
    loading,
    isMockMode,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { DEMO_EMAIL, DEMO_PASSWORD }
