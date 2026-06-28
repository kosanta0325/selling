import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn({ email, password })
      navigate('/')
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoIcon}>⬡</div>
          <span style={s.logoText}>AI<span style={s.accent}>Market</span></span>
        </div>
        <h1 style={s.title}>ログイン</h1>
        <p style={s.subtitle}>アカウントにサインインしてください</p>
        {error && <div style={s.errorBox}>{error}</div>}
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>メールアドレス</label>
            <input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div style={s.field}>
            <label style={s.label}>パスワード</label>
            <div style={s.passWrap}>
              <input style={{ ...s.input, paddingRight: 44 }} type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPass(v => !v)}>{showPass ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <button type="submit" style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        <p style={s.footer}>アカウントをお持ちでない方は <Link to="/signup" style={s.link}>新規登録</Link></p>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #05050f 0%, #0d0d1f 50%, #05050f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card: { width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, padding: '40px 36px', boxShadow: '0 0 60px rgba(139,92,246,0.08)' },
  logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 },
  logoIcon: { width: 36, height: 36, background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 900, boxShadow: '0 0 20px rgba(139,92,246,0.4)' },
  logoText: { fontSize: 22, fontWeight: 800, color: '#e2e8f0' },
  accent: { background: 'linear-gradient(90deg, #a78bfa, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  title: { fontSize: 22, fontWeight: 700, color: '#e2e8f0', textAlign: 'center', margin: '0 0 6px' },
  subtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', margin: '0 0 28px' },
  errorBox: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: '#94a3b8' },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 },
  submitBtn: { width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', cursor: 'pointer', marginTop: 4, boxShadow: '0 0 20px rgba(139,92,246,0.3)' },
  footer: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 24 },
  link: { color: '#a78bfa', textDecoration: 'none', fontWeight: 600 },
}
