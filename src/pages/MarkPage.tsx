import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'

export default function MarkPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  
  const [lecture, setLecture] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) { setError('Токен не найден'); return }
    fetch(`/api/Attendance/session/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error('Сессия закрыта или не существует')
        return r.json()
      })
      .then(setLecture)
      .catch((e) => setError(e.message))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError('')
    setLoading(true)
    
    try {
      await api.markAttendance({
        token,
        lastName,
        firstName,
        middleName,
        groupName,
        email
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (error) return <div className="mark-page"><div className="mark-card error"><h2>Ошибка</h2><p>{error}</p></div></div>
  if (!lecture) return <div className="mark-page"><div className="mark-card">Загрузка...</div></div>

  if (success) {
    return (
      <div className="mark-page">
        <div className="mark-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2>Вы отмечены!</h2>
          <p className="muted">Ваше присутствие на лекции "{lecture.title}" успешно зафиксировано.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mark-page">
      <div className="mark-card">
        <h1>Подтвердите присутствие</h1>
        <p className="muted" style={{ marginBottom: '24px' }}>{lecture.title}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label>Фамилия</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
            <div>
              <label>Имя</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </div>
          </div>
          
          <label>Отчество (опционально)</label>
          <input value={middleName} onChange={e => setMiddleName(e.target.value)} />

          <label>Группа (опционально)</label>
          <input value={groupName} onChange={e => setGroupName(e.target.value)} />

          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />

          {error && <div className="error">{error}</div>}
          
          <button type="submit" className="primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
            {loading ? 'Отправка...' : 'Отметиться на лекции'}
          </button>
        </form>
      </div>
    </div>
  )
}