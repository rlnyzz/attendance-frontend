import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'

type Participant = {
  id: string
  lastName: string
  firstName: string
  middleName?: string
  groupName?: string
  email?: string
}

type AttendanceRecord = {
  id: string
  lastName: string
  firstName: string
  middleName?: string
  groupName?: string
  email: string
  markedAt: string
}

type LectureDetail = {
  id: string
  title: string
  description?: string
  startsAt: string
  endsAt: string
  status: string
  isSessionOpen: boolean
  attendanceCount: number
  participantsCount: number
}

export default function LectureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const location = useLocation()
  
  const [lecture, setLecture] = useState<LectureDetail | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // Состояние для ошибки
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [isQrVisible, setIsQrVisible] = useState(false)
  const [qrSrc, setQrSrc] = useState<string>('')
  const [isFullScreenQr, setIsFullScreenQr] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) {
        setError('ID лекции не указан в URL')
        setLoading(false)
        return
    }
    
    const loadData = async () => {
      try {
        const lec = await api.getLecture(id)
        if (!lec) throw new Error('Бэкенд вернул пустой ответ')
        
        const parts = await api.getParticipants(id).catch(() => [])
        const status = await api.sessionStatus(id).catch(() => null)
        const att = await api.getAttendance(id).catch(() => [])
        
        setLecture({ ...lec, isSessionOpen: status?.isOpen || false })
        setParticipants(parts || [])
        setAttendance(att || [])
        
        if (status?.isOpen) {
          setIsQrVisible(true)
          setSessionSeconds(status.secondsLeft)
          api.fetchQrBlob(id).then(setQrSrc).catch(console.error)
        }
      } catch (e: any) {
        console.error('Ошибка загрузки лекции:', e)
        setError(e.message || 'Не удалось загрузить лекцию')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [id])

  // Таймер сессии
  useEffect(() => {
    if (!lecture?.isSessionOpen) return
    const t = setInterval(async () => {
      try {
        const s = await api.sessionStatus(lecture.id)
        setSessionSeconds(s.secondsLeft)
        if (s.secondsLeft <= 0) {
            setLecture(prev => prev ? { ...prev, isSessionOpen: false } : null)
            setIsQrVisible(false)
            setIsFullScreenQr(false)
        }
      } catch (e) {}
    }, 1000)
    return () => clearInterval(t)
  }, [lecture])

  // Обновление списка отметившихся
  useEffect(() => {
    if (!id || !lecture) return
    const t = setInterval(async () => {
      try {
        const att = await api.getAttendance(id)
        setAttendance(att || [])
        if (att.length !== lecture.attendanceCount) {
           setLecture(prev => prev ? { ...prev, attendanceCount: att.length } : null)
        }
      } catch (e) {}
    }, 5000)
    return () => clearInterval(t)
  }, [id, lecture])

  const openSession = async () => {
    if (!id) return
    try {
      await api.openSession(id)
      const status = await api.sessionStatus(id)
      setLecture(prev => prev ? { ...prev, isSessionOpen: status.isOpen } : null)
      setIsQrVisible(status.isOpen)
      setSessionSeconds(status.secondsLeft)
      if (status.isOpen) {
        api.fetchQrBlob(id).then(setQrSrc).catch(console.error)
      }
    } catch (e: any) {
      alert(e.message)
    }
  }

  const closeSession = async () => {
    if (!id) return
    try {
      await api.closeSession(id)
      setLecture(prev => prev ? { ...prev, isSessionOpen: false } : null)
      setIsQrVisible(false)
      setQrSrc('')
      setIsFullScreenQr(false)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const finishLecture = async () => {
    if (!id) return
    if (!confirm('Вы уверены, что хотите завершить лекцию? Студенты больше не смогут отметиться.')) return
    try {
      await api.closeSession(id)
      setLecture(prev => prev ? { ...prev, isSessionOpen: false } : null)
      setIsQrVisible(false)
      setIsFullScreenQr(false)
      setQrSrc('')
      alert('Лекция завершена. Отметки закрыты.')
    } catch (e: any) {
      alert('Ошибка: ' + e.message)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    
    try {
      const result = await api.importParticipants(id, file)
      alert(`Импорт завершен. Добавлено: ${result.added}, Пропущено: ${result.skipped}`)
      const parts = await api.getParticipants(id)
      setParticipants(parts || [])
    } catch (e: any) {
      alert('Ошибка импорта: ' + e.message)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const exportCsv = () => {
    if (!id) return
    window.open(`/api/Lecture/${id}/attendance/export`, '_blank')
  }

  const fio = user ? `${user.lastName} ${user.firstName}` : 'Преподаватель'
  const initials = user ? `${user.lastName[0]}${user.firstName[0]}` : 'ПР'

  // Если идет загрузка
  if (loading) return (
    <div className="app-layout">
        <div className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <h2>Загрузка данных лекции...</h2>
        </div>
    </div>
  )

  // Если произошла ошибка
  if (error) return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">РТУ МИРЭА</div>
        <nav>
          <Link to="/">Обзор</Link>
          <Link to="/lectures" className="active">Лекции</Link>
          <Link to="/students">Студенты</Link>
          <Link to="/settings">Настройки</Link>
        </nav>
      </aside>
      <main className="main">
        <div className="card" style={{ textAlign: 'center', padding: '40px', marginTop: '40px' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Лекция не найдена</h2>
          <p className="muted" style={{ marginBottom: '24px' }}>{error}</p>
          <button className="primary" onClick={() => navigate('/lectures')}>Вернуться к лекциям</button>
        </div>
      </main>
    </div>
  )

  if (!lecture) return null

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">РТУ МИРЭА</div>
        <nav>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Обзор</Link>
          <Link to="/lectures" className={location.pathname.startsWith('/lectures') ? 'active' : ''}>Лекции</Link>
          <Link to="/students" className={location.pathname === '/students' ? 'active' : ''}>Студенты</Link>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Настройки</Link>
        </nav>

        <div className="user-profile" onClick={logout} title="Выйти">
          <div className="avatar">{initials}</div>
          <div className="info">
            <div className="name">{fio}</div>
            <div className="role">Преподаватель</div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="page-header">
          <div>
            <button className="secondary" style={{ marginBottom: '16px', padding: '6px 12px' }} onClick={() => navigate('/lectures')}>
              &larr; Назад к лекциям
            </button>
            <h1>{lecture.title}</h1>
            <p className="muted">
              {new Date(lecture.startsAt).toLocaleString('ru-RU')} — {new Date(lecture.endsAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </header>

        <div className="grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section className="card">
              <div className="card-header">
                <h2>Участники ({participants.length})</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                  <button className="secondary" onClick={() => fileInputRef.current?.click()}>Загрузить CSV</button>
                </div>
              </div>
              {participants.length === 0 ? (
                <p className="muted">Список участников пуст.</p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {participants.map(p => (
                    <div key={p.id} className="lecture-item" style={{ padding: '12px 0' }}>
                      <div className="content">
                        <div className="title">{p.lastName} {p.firstName} {p.middleName}</div>
                        <div className="meta">{p.groupName && <span>Группа: {p.groupName}</span>}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card">
              <div className="card-header">
                <h2>Отметившиеся ({attendance.length})</h2>
                {lecture.isSessionOpen && <span className="status-badge active">Обновляется...</span>}
              </div>
              {attendance.length === 0 ? (
                <p className="muted">Пока никто не отметился.</p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {attendance.map(a => (
                    <div key={a.id} className="lecture-item" style={{ padding: '12px 0' }}>
                      <div className="content">
                        <div className="title">{a.lastName} {a.firstName} {a.middleName}</div>
                        <div className="meta">
                          {a.groupName && <span>Группа: {a.groupName}</span>}
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(a.markedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section className="card qr-card">
              <h2>Управление отметкой</h2>
              {lecture.isSessionOpen ? (
                <>
                  <div className="badge" style={{ marginTop: '16px' }}>● Сессия открыта</div>
                  {isQrVisible && (
                    <div className="qr-wrapper" style={{ marginTop: '16px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setIsFullScreenQr(true)}>
                      {qrSrc ? <img src={qrSrc} alt="QR-код" style={{ width: '250px', height: '250px', display: 'block', margin: '0 auto' }} /> : <div style={{ width: '250px', height: '250px', background: '#f1f5f9', borderRadius: '8px', margin: '0 auto' }} />}
                    </div>
                  )}
                  <div className="timer" style={{ marginTop: '16px' }}>Осталось: {Math.floor(sessionSeconds / 60)}:{String(sessionSeconds % 60).padStart(2, '0')}</div>
                  <button className="secondary" onClick={closeSession} style={{ width: '100%', marginTop: '16px' }}>Завершить отметку</button>
                </>
              ) : (
                <>
                  <p className="muted" style={{ marginTop: '16px', marginBottom: '16px' }}>{lecture.status === 'Finished' ? 'Лекция завершена.' : 'Сессия закрыта.'}</p>
                  {lecture.status !== 'Finished' && <button className="primary" onClick={openSession} style={{ width: '100%', marginBottom: '8px' }}>Открыть сессию (QR)</button>}
                  <button className="secondary" onClick={finishLecture} style={{ width: '100%' }}>Завершить лекцию</button>
                </>
              )}
            </section>

            <section className="card">
              <h2>Статистика</h2>
              <div style={{ marginTop: '16px', fontSize: '14px', lineHeight: '2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Отметилось:</span>
                  <strong>{attendance.length} чел.</strong>
                </div>
              </div>
              <button className="secondary" onClick={exportCsv} style={{ width: '100%', marginTop: '24px' }}>Скачать CSV отчет</button>
            </section>
          </div>
        </div>
      </main>

      {isFullScreenQr && qrSrc && (
        <div className="modal-backdrop" onClick={() => setIsFullScreenQr(false)} style={{ zIndex: 1000 }}>
          <div className="modal" style={{ width: 'auto', maxWidth: '90vw', padding: '32px', textAlign: 'center', position: 'relative', backgroundColor: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsFullScreenQr(false)} style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            <h2 style={{ marginBottom: '24px', fontSize: '24px' }}>{lecture.title}</h2>
            <img src={qrSrc} alt="QR-код" style={{ width: '400px', height: '400px', maxWidth: '80vw', maxHeight: '80vw', display: 'block', margin: '0 auto' }} />
            <p className="muted" style={{ marginTop: '24px', fontSize: '16px' }}>Наведите камеру телефона на QR-код</p>
          </div>
        </div>
      )}
    </div>
  )
}