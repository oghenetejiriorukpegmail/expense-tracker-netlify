-- Add new columns to trips table
ALTER TABLE trips
ADD COLUMN status text NOT NULL DEFAULT 'Planned',
ADD COLUMN start_date timestamp with time zone NOT NULL DEFAULT NOW(),
ADD COLUMN end_date timestamp with time zone NOT NULL DEFAULT NOW(),
ADD COLUMN budget numeric(10,2),
ADD COLUMN currency text NOT NULL DEFAULT 'USD',
ADD COLUMN location text,
ADD COLUMN tags text[],
ADD COLUMN total_expenses numeric(10,2) DEFAULT 0,
ADD COLUMN expense_count integer DEFAULT 0,
ADD COLUMN updated_at timestamp with time zone DEFAULT NOW();

-- Add check constraint for status
ALTER TABLE trips
ADD CONSTRAINT trips_status_check 
CHECK (status IN ('Planned', 'InProgress', 'Completed', 'Cancelled'));

-- Add check constraint for dates
ALTER TABLE trips
ADD CONSTRAINT trips_dates_check 
CHECK (end_date >= start_date);

-- Add check constraint for budget
ALTER TABLE trips
ADD CONSTRAINT trips_budget_check 
CHECK (budget IS NULL OR budget >= 0);

-- Create index for user_id and status
CREATE INDEX idx_trips_user_status ON trips(user_id, status);

-- Create index for date range
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_trips_updated_at();