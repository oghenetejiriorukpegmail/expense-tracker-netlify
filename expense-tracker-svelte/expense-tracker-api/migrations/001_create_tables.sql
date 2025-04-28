-- Create expenses table (dropping if exists to avoid conflicts)
DROP TABLE IF EXISTS expenses CASCADE;

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  vendor VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  search_vector tsvector
);

-- Add comments to document the schema
COMMENT ON TABLE expenses IS 'Stores user expense records with detailed transaction information';
COMMENT ON COLUMN expenses.id IS 'Unique identifier for the expense';
COMMENT ON COLUMN expenses.user_id IS 'Reference to the user who created the expense';
COMMENT ON COLUMN expenses.amount IS 'The monetary amount of the expense';
COMMENT ON COLUMN expenses.currency IS 'The currency code (e.g., USD, EUR) of the expense';
COMMENT ON COLUMN expenses.date IS 'When the expense occurred';
COMMENT ON COLUMN expenses.category IS 'The category of the expense (e.g., Food, Transportation)';
COMMENT ON COLUMN expenses.description IS 'Detailed description of the expense';
COMMENT ON COLUMN expenses.location IS 'Where the expense occurred';
COMMENT ON COLUMN expenses.vendor IS 'The merchant or service provider';
COMMENT ON COLUMN expenses.search_vector IS 'Indexed column for full-text search across description, vendor, and location';