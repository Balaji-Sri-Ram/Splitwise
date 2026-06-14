# Build Plan

## Architecture
- Client-Server Architecture communicating via RESTful JSON APIs and WebSockets (Socket.io).
- Monolithic Node/Express backend serving React frontend (though deployed separately).

## Development Timeline
- Phase 1: Setup & Documentation
- Phase 2: DB & Auth Backend
- Phase 3: Auth & Foundation Frontend
- Phase 4: Groups & Dashboard
- Phase 5: Expense Engine & Debt Optimization
- Phase 6: Real-Time Chat & Settlements

## Deployment Plan
- Frontend: Continuous deployment via Vercel.
- Backend: Deployed to Render.
- Database: Managed MySQL on Railway.

## Risks & Assumptions
- Risk: Real-time socket state syncing might have race conditions.
- Assumption: Users will manually settle debts outside the platform and record them inside.
