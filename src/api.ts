const API_BASE = '/api'

let token: string | null = localStorage.getItem('token')

export function setToken(t: string | null) {
  token = t
  if (t) localStorage.setItem('token', t)
  else localStorage.removeItem('token')
}

export function getToken() {
  return token
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    let errorBody: any = null
    try { errorBody = await res.json() } catch {}
    const message = errorBody?.detail || errorBody?.title || `Ошибка ${res.status}`
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // --- Auth ---
  login: (email: string, password: string) =>
    request<{ token: string; expiresAt: string; user: any }>('/Auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<any>('/Auth/me'),

  // --- Lectures ---
  lectures: () => request<any[]>('/Lecture'),

  getLecture: (id: string) => request<any>(`/Lecture/${id}`),

  createLecture: (data: { title: string; description?: string; startsAt: string; endsAt: string }) =>
    request<any>('/Lecture', { method: 'POST', body: JSON.stringify(data) }),

  // 👇 ВОТ ОН, ТОТ САМЫЙ МЕТОД
  patchLecture: (id: string, data: { endsAt: string }) =>
    request<any>(`/Lecture/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // --- Sessions ---
  sessionStatus: (lectureId: string) =>
    request<{ isOpen: boolean; isActive: boolean; expiresAt: string | null; secondsLeft: number; attendanceCount: number }>(
      `/Lecture/${lectureId}/session/status`
    ),

  openSession: (lectureId: string) =>
    request<any>(`/Lecture/${lectureId}/session/open`, { method: 'POST' }),

  closeSession: (lectureId: string) =>
    request<any>(`/Lecture/${lectureId}/session/close`, { method: 'POST' }),

  qrUrl: (lectureId: string) => `${API_BASE}/Lecture/${lectureId}/session/qr`,

  // --- Participants ---
  getParticipants: (lectureId: string) => request<any[]>(`/Lecture/${lectureId}/participants`),
  getAttendance: (lectureId: string) => request<any[]>(`/Lecture/${lectureId}/attendance`),
  importParticipants: async (lectureId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    const res = await fetch(`${API_BASE}/Lecture/${lectureId}/participants/import`, {
      method: 'POST',
      body: formData,
      headers
    })
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null)
      throw new Error(errorBody?.detail || 'Ошибка импорта')
    }
    return res.json()
  },

  // --- Attendance (Marking) ---
  markAttendance: (data: { token: string; lastName: string; firstName: string; middleName?: string; groupName?: string; email: string }) =>
    request<any>('/Attendance', { method: 'POST', body: JSON.stringify(data) }),

  // --- Users (Admin) ---
  getUsers: () => request<any[]>('/User'),

  fetchQrBlob: async (lectureId: string): Promise<string> => {
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    const res = await fetch(`${API_BASE}/Lecture/${lectureId}/session/qr`, { headers })
    if (!res.ok) throw new Error('Ошибка загрузки QR')
    
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  },
}