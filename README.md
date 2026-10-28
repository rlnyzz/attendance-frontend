# Журнал посещаемости лекций — Frontend

React + Vite + TypeScript. Общается с бэкендом `AttendanceJournal.Api` по HTTP.

## 📋 Требования

- **Node.js 18+** (проверить: `node -v`)
- Запущенный бэкенд на `http://localhost:5080` (или `8080`, если через Docker)
- **PostgreSQL** (если бэкенд запускается без Docker)

## 🚀 Запуск бэкенда (в отдельном терминале)

### Вариант А — через `dotnet run` (рекомендуется)

1. Убедись, что PostgreSQL запущен и база `attendance` создана.
2. Перейди в папку бэкенда:
   ```bash
   cd путь/к/SPO_KR2-main/src/AttendanceJournal.Api
3. dotnet run
4. Проверь: http://localhost:5080/health → {"status":"ok"}

### Вариант B - через Docker
1. cd путь/к/SPO_KR2-main
2. docker compose up -d

##💻 Запуск фронтенда
1. Перейди в папку фронтенда:
   cd attendance-frontend
2. npm install --legacy-peer-deps
3. proxy: {
  '/api': {
    target: 'http://localhost:5080', // 8080 — если Docker, 5080 — если dotnet run
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
},
4. npm run dev

