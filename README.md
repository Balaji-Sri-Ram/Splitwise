# Splitwise Clone

A modern, elegant, and minimal web application for splitting expenses and managing group debts, built with React, Node.js, Express, and MySQL.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL Database

### Installation
1. Clone the repository.
2. For backend:
   ```bash
   cd backend
   npm install
   ```
3. For frontend:
   ```bash
   cd frontend
   npm install
   ```

### Environment Variables
Create a `.env` file in the backend directory:
```env
DATABASE_URL="mysql://user:password@localhost:3306/splitwise"
JWT_SECRET="your_secret_key"
PORT=5000
```

### Running Locally
- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`

## AI Used
Developed with the assistance of an advanced AI pair programming agent (Antigravity by Google DeepMind team), which scaffolded the React frontend, Node.js/Express backend, and Prisma MySQL database schema.