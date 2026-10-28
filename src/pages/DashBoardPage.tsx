import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'

type Lecture = {
  id: string
  title: string
  startsAt: string
  endsAt: string
  status: string
  isSessionOpen: boolean
  attendanceCount: number
  participantsCount: number
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [active, setActive] = useState<Lecture | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    api.lectures().then((data) => {
      setLectures(data)
      const open = data.find((l) => l.isSessionOpen)
      if (open) setActive(open)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!active || !active.isSessionOpen) return
    const t = setInterval(async () => {
      try {
        const s = await api.sessionStatus(active.id)
        setSecondsLeft(s.secondsLeft)
        if (s.secondsLeft <= 0) {
            setActive({ ...active, isSessionOpen: false })
        }
      } catch (e) {
        console.error(e)
      }
    }, 1000)
    return () => clearInterval(t)
  }, [active])

  async function closeSession() {
    if (!active) return
    try {
      await api.closeSession(active.id)
      setActive(null)
      const updated = await api.lectures()
      setLectures(updated)
    } catch (e) {
      alert('Ошибка при закрытии сессии')
    }
  }

  const fio = user ? `${user.lastName} ${user.firstName}` : 'Преподаватель'
  const initials = user ? `${user.lastName[0]}${user.firstName[0]}` : 'ПР'

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return {
      day: d.toLocaleDateString('ru-RU', { day: '2-digit' }),
      month: d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')
    }
  }

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
            <div className="greeting">Сегодня</div>
            <h1>Добрый день, {user?.firstName} {user?.middleName || ''}</h1>
          
          </div>
          <button className="primary" onClick={() => setShowCreate(true)}>+ Новая лекция</button>
        </header>

        <div className="grid">
          <section className="card">
            <div className="card-header">
              <h2>Последние лекции</h2>
              <Link to="/lectures">Все лекции &gt;</Link>
            </div>
            {lectures.length === 0 ? (
                <p className="muted" style={{ padding: '20px 0' }}>Лекций пока нет. Создайте первую!</p>
            ) : (
                lectures.slice(0, 5).map((l) => {
                const date = formatDate(l.startsAt)
                return (
                    <div key={l.id} className="lecture-item">
                    <div className="date-badge">
                        {date.day}
                        <span>{date.month}</span>
                    </div>
                    <div className="content">
                        <div className="title">
                        {l.title}
                        {l.isSessionOpen && <span className="status-badge active">Идёт отметка</span>}
                        {!l.isSessionOpen && l.status === 'Finished' && <span className="status-badge finished">Завершена</span>}
                        </div>
                        <div className="meta">
                        <span>⏱ {new Date(l.startsAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    </div>
                )
                })
            )}
          </section>

          {active && (
            <section className="card qr-card">
              <div className="badge">● Прямо сейчас</div>
              <h2>{active.title}</h2>
              <div className="teacher">Идёт отметка</div>
              <div className="qr-wrapper">
                <img src={api.qrUrl(active.id)} alt="QR-код" />
              </div>
              <p className="muted" style={{ marginBottom: '16px' }}>Наведите камеру телефона на QR-код</p>
              <div className="timer">
                Осталось: {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
              </div>
              <button className="secondary" onClick={closeSession}>Завершить отметку</button>
            </section>
          )}
        </div>
      </main>

      {showCreate && <CreateLectureModal onClose={() => setShowCreate(false)} onCreated={() => window.location.reload()} />}
    </div>
  )
}

function CreateLectureModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.createLecture({
        title,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      })
      onCreated()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
            <h2>Новая лекция</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <label>Название лекции</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, Архитектура программ" required />
          
          <div className="row">
            <div>
                <label>Начало</label>
                <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
            </div>
            <div>
                <label>Окончание</label>
                <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
            </div>
          </div>

          {error && <div className="error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="primary">Создать лекцию</button>
          </div>
        </form>
      </div>
    </div>
  )
}