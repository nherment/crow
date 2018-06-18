-- $1: monitorId
-- $2: succeeded TRUE|FALSE
-- $3: responseTime in millisecs
-- $4: message
WITH inserted AS (

  SELECT 
    $1 AS monitor_id, 
    $2 AS succeeded, 
    $3 AS response_time, 
    $4 AS details

), opened_failure_report AS (

  INSERT INTO failure_reports (monitor_id, created_date, details)
  ( 
    SELECT i.monitor_id, i.created_date, i.details
    FROM inserted AS i
    WHERE i.succeeded = FALSE
  )
  ON CONFLICT DO NOTHING
  RETURNING monitor_id, created_date, closed_date, details

), closed_failure_report AS (

  UPDATE failure_reports AS fr
  SET closed_date = i.created_date
  FROM inserted AS i
  WHERE fr.monitor_id = i.monitor_id
    AND fr.closed_date IS NULL
    AND i.succeeded = TRUE
  RETURNING fr.monitor_id, fr.created_date, fr.closed_date, fr.details

), delete_old_status_checks AS (
  DELETE FROM status_checks
), delete_old_status_checks_hourly AS (
  DELETE FROM status_checks_hourly
)
SELECT * FROM opened_failure_report
UNION
SELECT * FROM closed_failure_report
