# Scope & Anomaly Log

## Database Schema
The database schema is managed via Prisma ORM with the following core entities to handle expenses effectively:
- **User**: Stores user details (`id`, `name`, `email`, `password`, `createdAt`, `updatedAt`).
- **Group**: Represents a group of users for shared expenses (`id`, `name`, `description`, `createdAt`).
- **GroupMember**: Junction table linking Users to Groups.
- **Expense**: Represents an expense within a group (`id`, `groupId`, `title`, `amount`, `paidById`).
- **ExpenseSplit**: Represents how an individual expense is divided among the users involved.
- **Payment**: Represents a settlement payment between two users (`id`, `groupId`, `senderId`, `receiverId`, `amount`).

## CSV Anomaly Log
During the CSV import of legacy expense data, the following anomalies were found and handled:

1. **Missing Names/Emails**: 
   - *Problem*: Several rows had a missing user email, which is our primary identifier.
   - *Handling*: Rejected the row and logged an error, as the transaction cannot be safely attributed to a user.
   
2. **Negative Amounts**: 
   - *Problem*: Expense amounts were negative (e.g., -$50.00). 
   - *Handling*: Converted to absolute values to represent the total cost, assuming it was a formatting error from a bank export.

3. **Invalid Date Formats**: 
   - *Problem*: Mixed formats like `MM/DD/YYYY` and `DD-MM-YYYY` were present. 
   - *Handling*: Standardized using a robust date parsing approach to ensure all dates follow ISO 8601 strings.

4. **Mismatched Split Totals**: 
   - *Problem*: The sum of individual user splits (e.g., $33.33 x 3) did not equal the total expense amount ($100.00). 
   - *Handling*: The import script rounded the fractions and added the cent difference ($0.01) to the payer's split to perfectly balance the transaction.
