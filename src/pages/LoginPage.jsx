import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn, user, profile } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // profile がロードされてからロールに応じてリダイレクト
  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') navigate('/admin', { replace: true })
      else navigate('/', { replace: true })
    }
  }, [user, profile])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn({ email, password })
      // navigate はuseEffectで profile ロード後に行う
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoIcon}>⬡</div>
          <span style={s.logoText}>Ichib<span style={s.accent}>A</span></span>
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
  page: { minHeight: '100vh', background: '#F6F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card: { width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #D8DCE9', borderRadius: 20, padding: '40px 36px', boxShadow: '0 4px 24px rgba(16,27,62,0.08)' },
  logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 },
  logoIcon: { width: 36, height: 36, background: '#2438A6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 900 },
  logoText: { fontSize: 22, fontWeight: 800, color: '#101B3E', fontFamily: "'Sora', sans-serif" },
  accent: { color: '#E8542F' },
  title: { fontSize: 22, fontWeight: 700, color: '#101B3E', textAlign: 'center', margin: '0 0 6px', fontFamily: "'Sora', sans-serif" },
  subtitle: { fontSize: 13, color: '#5A6180', textAlign: 'center', margin: '0 0 28px' },
  errorBox: { background: 'rgba(232,84,47,0.06)', border: '1px solid rgba(232,84,47,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#E8542F', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: '#5A6180' },
  input: { width: '100%', background: '#F6F7F4', border: '1px solid #D8DCE9', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#101B3E', outline: 'none', boxSizing: 'border-box' },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 },
  submitBtn: { width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#fff', background: '#2438A6', border: 'none', cursor: 'pointer', marginTop: 4 },
  footer: { fontSize: 13, color: '#5A6180', textAlign: 'center', marginTop: 24 },
  link: { color: '#2438A6', textDecoration: 'none', fontWeight: 600 },
}
