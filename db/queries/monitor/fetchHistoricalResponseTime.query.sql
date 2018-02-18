-- $1: monitor
SELECT * FROM status_checks 
WHERE monitor_id = $1
ORDER BY created_date ASC;