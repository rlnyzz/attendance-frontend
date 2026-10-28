import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDark(true)
      document.body.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    if (newDark) {
      document.body.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const fio = user ? `${user.lastName} ${user.firstName}` : 'Преподаватель'
  const initials = user ? `${user.lastName[0]}${user.firstName[0]}` : 'ПР'

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
          <h1>Настройки</h1>
        </header>
        <section className="card">
          <h2>Внешний вид</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Тёмная тема</div>
              <div className="muted">Включите, если хотите работать в тёмном режиме</div>
            </div>
            <button 
              className={isDark ? 'primary' : 'secondary'} 
              onClick={toggleTheme}
              style={{ width: '120px' }}
            >
              {isDark ? 'Включена' : 'Выключена'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}