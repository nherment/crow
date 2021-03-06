-- $1: monitorId
-- $2: succeeded TRUE|FALSE
-- $3: responseTime in millisecs
-- $4: message
WITH args AS (

  SELECT 
    $1::INT AS monitor_id, 
    $2::BOOLEAN AS succeeded, 
    $3::INT AS response_time, 
    $4::TEXT AS details

), delete_old_status_checks AS (
  DELETE FROM status_checks AS sc USING args AS args WHERE sc.monitor_id = args.monitor_id
), inserted AS (
  INSERT INTO status_checks (monitor_id, succeeded, response_time, details)
  (
    SELECT args.monitor_id, args.succeeded, args.response_time, args.details FROM args
  ) RETURNING *
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

)
SELECT * FROM opened_failure_report
UNION
SELECT * FROM closed_failure_report
