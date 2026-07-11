import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const passwordRules = [
    { test: pw => pw.length >= 8,          label: '8文字以上' },
    { test: pw => /[A-Z]/.test(pw),        label: '大文字を含む' },
    { test: pw => /[0-9]/.test(pw),        label: '数字を含む' },
    { test: pw => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw), label: '記号を含む（例: !@#$）' },
  ]
  const passOk = passwordRules.every(r => r.test(password))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!passOk) { setError('パスワードが要件を満たしていません'); return }
    if (password !== confirm) { setError('パスワードが一致しません'); return }
    setLoading(true)
    try {
      await signUp({ email, password, username })
      setDone(true)
    } catch (err) {
      setError(err.message || '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}><div style={s.logoIcon}>⬡</div><span style={s.logoText}>AI<span style={s.accent}>Market</span></span></div>
        <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>✉️</div>
        <h2 style={s.title}>確認メールを送信しました</h2>
        <p style={{ fontSize: 14, color: '#5A6180', textAlign: 'center', lineHeight: 1.7, marginBottom: 28 }}>
          <strong style={{ color: '#2438A6' }}>{email}</strong> に確認メールを送りました。メール内のリンクをクリックして登録を完了してください。
        </p>
        <Link to="/login" style={{ display: 'block', textAlign: 'center', color: '#2438A6', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>ログインページへ →</Link>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}><div style={s.logoIcon}>⬡</div><span style={s.logoText}>AI<span style={s.accent}>Market</span></span></div>
        <h1 style={s.title}>アカウント登録</h1>
        <p style={s.subtitle}>無料でアカウントを作成できます</p>
        {error && <div style={s.errorBox}>{error}</div>}
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>ユーザー名</label>
            <input style={s.input} type="text" placeholder="username" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
          </div>
          <div style={s.field}>
            <label style={s.label}>メールアドレス</label>
            <input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div style={s.field}>
            <label style={s.label}>パスワード</label>
            <div style={s.passWrap}>
              <input style={{ ...s.input, paddingRight: 44 }} type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPass(v => !v)}>{showPass ? '🙈' : '👁️'}</button>
            </div>
            {password.length > 0 && (
              <div style={s.rules}>
                {passwordRules.map(r => (
                  <div key={r.label} style={{ fontSize: 12, color: r.test(password) ? '#2438A6' : '#8A90A8', transition: 'color 0.2s' }}>
                    {r.test(password) ? '✓' : '○'} {r.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={s.field}>
            <label style={s.label}>パスワード（確認）</label>
            <input style={s.input} type={showPass ? 'text' : 'password'} placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
          </div>
          <button type="submit" style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? '登録中...' : 'アカウントを作成'}
          </button>
        </form>
        <p style={s.footer}>すでにアカウントをお持ちの方は <Link to="/login" style={s.link}>ログイン</Link></p>
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
  accent: { color: '#2438A6' },
  title: { fontSize: 22, fontWeight: 700, color: '#101B3E', textAlign: 'center', margin: '0 0 6px', fontFamily: "'Sora', sans-serif" },
  subtitle: { fontSize: 13, color: '#5A6180', textAlign: 'center', margin: '0 0 28px' },
  errorBox: { background: 'rgba(232,84,47,0.06)', border: '1px solid rgba(232,84,47,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#E8542F', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: '#5A6180' },
  input: { width: '100%', background: '#F6F7F4', border: '1px solid #D8DCE9', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#101B3E', outline: 'none', boxSizing: 'border-box' },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 },
  rules: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, padding: '10px 12px', background: '#F6F7F4', borderRadius: 8, border: '1px solid #D8DCE9' },
  submitBtn: { width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#fff', background: '#2438A6', border: 'none', cursor: 'pointer', marginTop: 4 },
  footer: { fontSize: 13, color: '#5A6180', textAlign: 'center', marginTop: 24 },
  link: { color: '#2438A6', textDecoration: 'none', fontWeight: 600 },
}
