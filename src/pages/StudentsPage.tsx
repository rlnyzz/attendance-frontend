import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'

export default function StudentsPage() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [users, setUsers] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
  }, [])

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
          <h1>Пользователи системы</h1>
        </header>
        <section className="card">
          {error ? (
            <p className="error">Ошибка доступа: {error} (раздел доступен только администратору)</p>
          ) : (
            users.map(u => (
              <div key={u.id} className="lecture-item">
                <div className="content">
                  <div className="title">{u.lastName} {u.firstName} {u.middleName}</div>
                  <div className="meta">
                    <span>{u.email}</span>
                    <span>Роль: {u.role}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  )
}