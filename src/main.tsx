import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LecturesPage from './pages/LecturesPage'
import LectureDetailPage from './pages/LectureDetailPage'
import StudentsPage from './pages/StudentsPage'
import MarkPage from './pages/MarkPage'
import './index.scss'
import SettingsPage from './pages/SettingsPage'

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loader">Загрузка...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/lectures" element={<Protected><LecturesPage /></Protected>} />
          <Route path="/lectures/:id" element={<Protected><LectureDetailPage /></Protected>} />
          <Route path="/students" element={<Protected><StudentsPage /></Protected>} />
          
          <Route path="/mark" element={<MarkPage />} />
          <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)