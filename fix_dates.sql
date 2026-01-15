-- Check current dates
SELECT id, start_date, planned_end_date, EXTRACT(YEAR FROM start_date) as year FROM rentals WHERE status = 'active' LIMIT 5;
