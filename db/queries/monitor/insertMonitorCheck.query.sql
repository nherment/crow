-- $1: monitorId
-- $2: succeeded TRUE|FALSE
-- $3: responseTime in millisecs
-- $4: message
WITH inserted AS (

  INSERT INTO status_checks (monitor_id, succeeded, response_time, details)
  VALUES ($1, $2, $3, $4)
  RETURNING *

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
  DELETE FROM status_checks AS sc
  USING inserted AS i
  WHERE sc.created_date < DATE_TRUNC('day', i.created_date)
), delete_old_status_checks_hourly AS (
  DELETE FROM status_checks_hourly AS sch
  USING inserted AS i
  WHERE sch.hour < (i.created_date - INTERVAL '7 days')
)
SELECT * FROM opened_failure_report
UNION
SELECT * FROM closed_failure_report