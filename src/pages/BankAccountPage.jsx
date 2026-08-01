import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

const ACCOUNT_TYPES = ['普通', '当座']

export default function BankAccountPage() {
  const { user, profile } = useAuth()

  const [bank, setBank] = useState({ bank_name: '', bank_branch: '', account_type: '普通', account_number: '', account_holder: '' })
  const [bankEditing, setBankEditing] = useState(false)
  const [bankSaving, setBankSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (profile && !loaded) {
      setBank({
        bank_name:      profile.bank_name      || '',
        bank_branch:    profile.bank_branch    || '',
        account_type:   profile.account_type   || '普通',
        account_number: profile.account_number || '',
        account_holder: profile.account_holder || '',
      })
      setLoaded(true)
      if (!profile.bank_name) setBankEditing(true)
    }
  }, [profile, loaded])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const validate = () => {
    const e = {}
    if (!bank.bank_name.trim())    e.bank_name    = '銀行名を入力してください'
    if (!bank.bank_branch.trim())  e.bank_branch  = '支店名を入力してください'
    if (!/^\d{7}$/.test(bank.account_number.trim()))
      e.account_number = '口座番号は7桁の数字で入力してください'
    if (!bank.account_holder.trim()) e.account_holder = '口座名義（カナ）を入力してください'
    return e
  }

  const save = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setBankSaving(true)
    const { error } = await supabase.from('profiles').update({
      bank_name:      bank.bank_name.trim(),
      bank_branch:    bank.bank_branch.trim(),
      account_type:   bank.account_type,
      account_number: bank.account_number.trim(),
      account_holder: bank.account_holder.trim(),
    }).eq('id', user.id)
    setBankSaving(false)
    if (error) { showToast('保存に失敗しました', 'error'); return }
    setBankEditing(false)
    setErrors({})
    showToast('口座情報を保存しました')
  }

  const cancel = () => {
    if (profile) {
      setBank({
        bank_name:      profile.bank_name      || '',
        bank_branch:    profile.bank_branch    || '',
        account_type:   profile.account_type   || '普通',
        account_number: profile.account_number || '',
        account_holder: profile.account_holder || '',
      })
    }
    setErrors({})
    setBankEditing(false)
  }

  return (
    <div style={s.container}>
      {toast && (
        <div style={{ ...s.toast, ...(toast.type === 'error' ? s.toastError : {}) }}>
          {toast.type === 'error' ? '⛔ ' : '✓ '}{toast.msg}
        </div>
      )}

      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>銀行口座管理</h1>
        <p style={s.pageSubtitle}>売上の振込先口座を登録・管理できます</p>
      </div>

      <div style={s.card}>
        <div style={s.cardHeader}>
          <div style={s.cardTitleRow}>
            <span style={s.icon}>🏦</span>
            <div>
              <div style={s.cardTitle}>振込先口座</div>
              <div style={s.cardSub}>売上が発生した際にこの口座へ送金します</div>
            </div>
          </div>
          {!bankEditing && bank.bank_name && (
            <button onClick={() => setBankEditing(true)} style={s.editBtn}>編集</button>
          )}
        </div>

        {!bankEditing ? (
          bank.bank_name ? (
            <div style={s.display}>
              <div style={s.displayRow}>
                <span style={s.displayLabel}>銀行名</span>
                <span style={s.displayVal}>{bank.bank_name}　{bank.bank_branch}支店</span>
              </div>
              <div style={s.displayRow}>
                <span style={s.displayLabel}>口座種別</span>
                <span style={s.displayVal}>{bank.account_type}</span>
              </div>
              <div style={s.displayRow}>
                <span style={s.displayLabel}>口座番号</span>
                <span style={s.displayVal}>{'*'.repeat(4)}{bank.account_number.slice(-3)}</span>
              </div>
              <div style={s.displayRow}>
                <span style={s.displayLabel}>名義（カナ）</span>
                <span style={s.displayVal}>{bank.account_holder}</span>
              </div>
            </div>
          ) : (
            <div style={s.empty}>
              <div style={s.emptyIcon}>🏦</div>
              <p style={s.emptyText}>まだ振込先口座が登録されていません</p>
              <button onClick={() => setBankEditing(true)} style={s.registerBtn}>口座を登録する</button>
            </div>
          )
        ) : (
          <div style={s.form}>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>銀行名 <span style={s.required}>必須</span></label>
                <input
                  type="text"
                  value={bank.bank_name}
                  onChange={e => { setBank(p => ({ ...p, bank_name: e.target.value })); setErrors(p => ({ ...p, bank_name: '' })) }}
                  placeholder="例：三菱UFJ銀行"
                  style={{ ...s.input, ...(errors.bank_name ? s.inputError : {}) }}
                />
                {errors.bank_name && <span style={s.error}>{errors.bank_name}</span>}
              </div>
              <div style={s.field}>
                <label style={s.label}>支店名 <span style={s.required}>必須</span></label>
                <input
                  type="text"
                  value={bank.bank_branch}
                  onChange={e => { setBank(p => ({ ...p, bank_branch: e.target.value })); setErrors(p => ({ ...p, bank_branch: '' })) }}
                  placeholder="例：渋谷支店"
                  style={{ ...s.input, ...(errors.bank_branch ? s.inputError : {}) }}
                />
                {errors.bank_branch && <span style={s.error}>{errors.bank_branch}</span>}
              </div>
            </div>

            <div style={s.row}>
              <div style={{ ...s.field, maxWidth: 140 }}>
                <label style={s.label}>口座種別</label>
                <select
                  value={bank.account_type}
                  onChange={e => setBank(p => ({ ...p, account_type: e.target.value }))}
                  style={s.input}
                >
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>口座番号（7桁）<span style={s.required}>必須</span></label>
                <input
                  type="text"
                  value={bank.account_number}
                  onChange={e => { setBank(p => ({ ...p, account_number: e.target.value.replace(/\D/g, '').slice(0, 7) })); setErrors(p => ({ ...p, account_number: '' })) }}
                  placeholder="1234567"
                  maxLength={7}
                  inputMode="numeric"
                  style={{ ...s.input, ...(errors.account_number ? s.inputError : {}), letterSpacing: '0.15em' }}
                />
                {errors.account_number && <span style={s.error}>{errors.account_number}</span>}
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>口座名義（カナ） <span style={s.required}>必須</span></label>
              <input
                type="text"
                value={bank.account_holder}
                onChange={e => { setBank(p => ({ ...p, account_holder: e.target.value })); setErrors(p => ({ ...p, account_holder: '' })) }}
                placeholder="例：ヤマダ タロウ"
                style={{ ...s.input, ...(errors.account_holder ? s.inputError : {}) }}
              />
              {errors.account_holder && <span style={s.error}>{errors.account_holder}</span>}
            </div>

            <div style={s.note}>
              ⚠ 口座番号・名義は正確に入力してください。誤った情報による振込ミスは対応できません。
            </div>

            <div style={s.actions}>
              <button onClick={save} disabled={bankSaving} style={{ ...s.saveBtn, opacity: bankSaving ? 0.7 : 1 }}>
                {bankSaving ? '保存中...' : '保存する'}
              </button>
              {bank.bank_name && (
                <button onClick={cancel} style={s.cancelBtn}>キャンセル</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  container: { maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' },
  toast: { position: 'fixed', top: 24, right: 24, zIndex: 999, padding: '12px 20px', borderRadius: 10, background: 'rgba(36,56,166,0.08)', border: '1px solid rgba(36,56,166,0.25)', color: '#2438A6', fontSize: 13, fontWeight: 600 },
  toastError: { background: 'rgba(232,84,47,0.08)', border: '1px solid rgba(232,84,47,0.25)', color: '#E8542F' },
  pageHeader: { marginBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: 800, color: '#101B3E', letterSpacing: '-0.5px', marginBottom: 6, fontFamily: "'Sora', sans-serif" },
  pageSubtitle: { fontSize: 14, color: '#5A6180' },
  card: { background: '#fff', border: '1px solid #D8DCE9', borderRadius: 16, padding: '24px' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  cardTitleRow: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  icon: { fontSize: 22, lineHeight: 1, marginTop: 2 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#101B3E', marginBottom: 3 },
  cardSub: { fontSize: 12, color: '#8A90A8' },
  editBtn: { padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#2438A6', background: 'rgba(36,56,166,0.07)', border: '1px solid rgba(36,56,166,0.2)', cursor: 'pointer', flexShrink: 0 },
  display: { display: 'flex', flexDirection: 'column', gap: 10, background: '#F6F7F4', borderRadius: 10, padding: '16px' },
  displayRow: { display: 'flex', gap: 12, fontSize: 13 },
  displayLabel: { color: '#8A90A8', width: 100, flexShrink: 0 },
  displayVal: { color: '#101B3E', fontWeight: 600 },
  empty: { textAlign: 'center', padding: '32px 0 8px' },
  emptyIcon: { fontSize: 36, marginBottom: 12, opacity: 0.3 },
  emptyText: { fontSize: 13, color: '#8A90A8', marginBottom: 16 },
  registerBtn: { padding: '10px 28px', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', background: '#2438A6', border: 'none', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 140 },
  label: { fontSize: 12, fontWeight: 600, color: '#5A6180', display: 'flex', alignItems: 'center', gap: 6 },
  required: { fontSize: 10, color: '#E8542F', background: 'rgba(232,84,47,0.08)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid #D8DCE9', fontSize: 14, color: '#101B3E', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
  inputError: { borderColor: '#E8542F' },
  error: { fontSize: 11, color: '#E8542F' },
  note: { fontSize: 11, color: '#d97706', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.18)', borderRadius: 8, padding: '9px 12px', lineHeight: 1.6 },
  actions: { display: 'flex', gap: 10, paddingTop: 4 },
  saveBtn: { padding: '10px 28px', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', background: '#2438A6', border: 'none', cursor: 'pointer' },
  cancelBtn: { padding: '10px 20px', borderRadius: 9, fontSize: 13, color: '#5A6180', background: 'transparent', border: '1px solid #D8DCE9', cursor: 'pointer' },
}
