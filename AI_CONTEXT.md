# AI Context

## Product Requirements
Working Title: Splitwise Clone
A minimal, elegant, and modern web application to manage shared expenses and optimize debt settlements.

## Tech Stack
- Frontend: React + Tailwind CSS + Zustand + Socket.io Client
- Backend: Node.js + Express.js + Socket.io + JWT
- Database: MySQL via Prisma
- Deployment: Vercel (Frontend), Render (Backend), Railway (MySQL Database)

## UI/UX Guidelines
- Colors:
  - Primary: #2D3A2D, Light: #4A5D4E
  - Accent: #9B5A46
  - Page Base: #FBFBF9
  - Card Bg: #F5F3EF
  - Sidebar: #FFFFFF
  - Text: #1A1A1A (Heading), #706F6C (Muted)
  - Border: #E5E2DC
  - Shadow: rgba(45,58,45,0.08)
- Characteristics: Minimal, elegant, clean whitespace, soft shadows, smooth transitions. No heavy gradients or glassmorphism.

## Database Schema (Prisma)
- Models: User, Group, GroupMember, Expense, ExpenseSplit, Payment, ExpenseMessage, Notification
- (Full schema will be maintained in prisma/schema.prisma)

## Design Decisions & Trade-offs
- Debt Optimization: Instead of storing every minor debt relation, we will use a backend engine to calculate optimal settlement paths (e.g., A->C instead of A->B, B->C).

## Prompts & Bugs Fixed
- Phase 1 & 2 completed: Scaffolded backend/frontend, configured Tailwind, added Prisma MySQL schema, and implemented JWT Auth (`/api/auth/register`, `/api/auth/login`).
- Phase 3 completed: Frontend foundation (Zustand persist store, Axios interceptors, React Router) and minimalistic UI for Login/Register.

## API Contracts
### Auth
- `POST /api/auth/register`: `{ name, email, password }` -> `{ token, user }`
- `POST /api/auth/login`: `{ email, password }` -> `{ token, user }`

### Groups
- `POST /api/groups`: `{ name, description, icon }` -> `Group object`
- `GET /api/groups`: -> `Array of Group objects (with members)`
- `POST /api/groups/:id/members`: `{ email }` -> `GroupMember object`

### Expenses & Balances
- `POST /api/expenses`: `{ groupId, title, amount, paidById, category, splits: [{userId, amount, type}] }` -> `Expense`
- `GET /api/expenses/group/:groupId`: -> `Array of Expense objects`
- `GET /api/expenses/balances/:groupId`: -> `{ rawBalances, optimizedDebts }`

### Settlements & Chat
- `POST /api/payments`: `{ groupId, receiverId, amount }` -> `Payment`
- Socket.io: `join_expense(expenseId)`, `send_message({expenseId, userId, content})`, `receive_message(message)`

## Status
- **MVP Completed**. All phases finished successfully.
