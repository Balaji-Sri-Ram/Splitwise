# Import Report

**Date of Import**: 2026-06-15
**Source File**: `legacy_expenses.csv`

## Summary
- **Total Rows Processed**: 250
- **Successfully Imported**: 238
- **Anomalies Handled/Rejected**: 12

## Detailed Action Log
- **Row 14**: Missing `paid_by_email`. 
  - *Action*: Rejected row to prevent unassigned debts.
- **Row 45**: Negative `amount` (-$50.00). 
  - *Action*: Converted to $50.00 (absolute value).
- **Row 89**: Unrecognized category `Snax`. 
  - *Action*: Mapped to default category `General`.
- **Row 102**: Split amounts ($33.33 x 3) do not match total ($100.00). 
  - *Action*: Added $0.01 to the first user's split to balance the expense.
- **Row 156**: Invalid date format `2025/31/02`. 
  - *Action*: Rejected row due to unparseable date.
- **Row 201-207**: Missing `group_id`. 
  - *Action*: Created a default "Imported Expenses" group and assigned these orphaned expenses there.
