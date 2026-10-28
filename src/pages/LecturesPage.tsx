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

export default function LecturesPage() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [lectures, setLectures] = useState<Lecture[]>([])

  useEffect(() => {
    api.lectures().then(setLectures).catch(console.error)
  }, [])

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
            <h1>Мои лекции</h1>
            <p className="muted">Полный список ваших занятий</p>
          </div>
        </header>

        <section className="card">
          {lectures.length === 0 ? (
            <p className="muted" style={{ padding: '20px 0' }}>Лекций пока нет. Создайте первую на главной странице.</p>
          ) : (
            lectures.map((l) => {
              const date = formatDate(l.startsAt)
              return (
                <Link 
                  to={`/lectures/${l.id}`} 
                  key={l.id} 
                  className="lecture-item"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
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
                      <span>⏱ {new Date(l.startsAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - {new Date(l.endsAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </section>
      </main>
    </div>
  )
}