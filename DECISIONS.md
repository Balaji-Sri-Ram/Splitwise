# Decision Log

1. **Tech Stack Selection**
   - *Options Considered*: MERN Stack (MongoDB) vs PERN/MySQL Stack (Prisma + MySQL).
   - *Decision*: Chose Node.js + Express with Prisma ORM and MySQL.
   - *Reason*: Relational data (users, groups, expenses, splits) strongly benefits from SQL's strict schema and ACID compliance to prevent financial data mismatches. Document stores can lead to orphaned records in highly relational models like this.

2. **Debt Optimization Engine**
   - *Options Considered*: Store exact pairwise debts in the DB vs Calculate on the fly and optimize.
   - *Decision*: Calculate and optimize debts dynamically on the fly when requested.
   - *Reason*: Storing all micro-transactions makes the database heavily coupled to specific paths and harder to mutate. Calculating dynamically ensures we always provide the most optimized settlement path (e.g., A owes C instead of A owes B owes C).

3. **CSV Ingestion Strategy**
   - *Options Considered*: Real-time row-by-row database insertion vs Bulk batched insertion within a transaction.
   - *Decision*: Bulk batched insertion within a single Prisma transaction.
   - *Reason*: Ensures that if the CSV contains a critical structural error halfway through, the database isn't left in a partially updated, corrupted state. It succeeds or fails as a complete batch.

4. **State Management in Frontend**
   - *Options Considered*: React Context API vs Redux vs Zustand.
   - *Decision*: Zustand.
   - *Reason*: Redux requires too much boilerplate for a minimal MVP, and Context API causes unnecessary re-renders. Zustand provides a simple, clean, hooks-based global state solution with persistence.
