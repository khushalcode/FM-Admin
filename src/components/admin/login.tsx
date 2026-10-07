'use client'

import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Info } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { signIn, signInWithGoogle, isMockMode } = useAuth()
  const [email, setEmail] = useState('admin@freshcart.com')
  const [password, setPassword] = useState('DemoPass123!')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error)
      } else {
        onLogin()
      }
    } catch (err: any) {
      setError(err?.message || 'Sign in failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error)
        setLoading(false)
      }
      // OAuth redirect will handle the rest
    } catch (err: any) {
      setError(err?.message || 'Google sign in failed')
      setLoading(false)
    } finally {
      // Don't set loading false here for OAuth — it redirects
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side — premium hero */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, white 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, white 0%, transparent 50%)`,
        }} />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <img src="/food-munch-logo.jpg" alt="Food Munch" className="h-11 w-11 rounded-xl object-cover" />
            <div>
              <p className="text-lg font-bold tracking-tight">Food Munch</p>
              <p className="text-xs text-emerald-100">Admin Console</p>
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Run your food<br />delivery platform<br />with confidence.
            </h1>
            <p className="text-emerald-100 text-sm leading-relaxed max-w-md">
              One unified dashboard for orders, products, stores, vendors, delivery partners, and customers. Built on Next.js, Supabase, and Firebase.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Stores', value: '6+' },
              { label: 'Products', value: '27+' },
              { label: 'Orders/day', value: '180+' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-emerald-100 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/food-munch-logo.jpg" alt="Food Munch" className="h-11 w-11 rounded-xl object-cover" />
            <div>
              <p className="text-lg font-bold tracking-tight text-foreground">Food Munch</p>
              <p className="text-xs text-muted-foreground">Admin Console</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your admin account to continue
            </p>
          </div>

          {isMockMode && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700">
                <p className="font-semibold">Mock Auth Mode</p>
                <p className="mt-0.5">Supabase credentials not set. Any email/password works. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> env vars to enable real Supabase auth.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
                  placeholder="admin@freshcart.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-muted-foreground">Password</label>
                <button type="button" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-ring/30" />
              Keep me signed in for 30 days
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-60"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {isMockMode && (
            <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Demo credentials:</strong> admin@freshcart.com / DemoPass123!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supabase Auth activates when you add real env vars.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
