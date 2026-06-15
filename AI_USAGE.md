# AI Usage

## AI Tools Used
- **Google DeepMind Antigravity**: Agentic AI coding assistant used via IDE integration for backend and frontend code generation, schema design, and debugging.

## Key Prompts
- *"Create a minimalistic React frontend for a Splitwise clone using Tailwind CSS."*
- *"Write a Prisma schema for users, groups, expenses, and expense splits."*
- *"Implement a debt simplification algorithm in Node.js to optimize group settlements and minimize the number of transactions needed."*

## AI Inaccuracies & Corrections

1. **Incorrect Debt Simplification Logic**
   - *What happened*: The AI initially produced a debt optimization algorithm that created infinite loops when there were circular dependencies of identical amounts (e.g., A owes B $10, B owes C $10, C owes A $10).
   - *How it was caught*: Running unit tests for the settlement algorithm caused a maximum call stack timeout.
   - *What changed*: I manually refactored the algorithm to properly clear out zero-balance nodes before processing the maximum creditors and debtors.

2. **Prisma Schema Circular Dependencies**
   - *What happened*: The AI generated Prisma schema relations where `Group` referenced `Expense` and `Expense` referenced `Group` without proper `@relation` names, causing schema validation errors.
   - *How it was caught*: Running `npx prisma db push` threw P1012 schema validation errors.
   - *What changed*: Added explicit relation names (e.g., `name: "GroupExpenses"`) to disambiguate the one-to-many relationships in Prisma.

3. **Tailwind Class Conflicts**
   - *What happened*: The AI suggested dynamic string concatenation for Tailwind classes (e.g., `className={"bg-" + color + "-500"}`), which doesn't work because Tailwind purges unused classes at build time.
   - *How it was caught*: The UI was missing background colors during the frontend visual inspection.
   - *What changed*: Replaced dynamic string concatenation with explicit class mapping objects and used the `clsx` and `tailwind-merge` libraries to safely combine classes.
