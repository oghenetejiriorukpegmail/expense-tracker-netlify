-- Check expenses table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;

-- Check test data
SELECT e.*, u.email
FROM expenses e
JOIN users u ON e.user_id = u.id
ORDER BY e.date DESC;