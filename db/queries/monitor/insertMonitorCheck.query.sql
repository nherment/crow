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

), hour_aggregate AS (

  SELECT 
    sc.monitor_id, 
    MIN(sc.response_time) AS response_time_min,
    percentile_disc(0.5) WITHIN GROUP (ORDER BY sc.response_time) AS response_time_median,
    percentile_disc(0.90) WITHIN GROUP (ORDER BY sc.response_time) AS response_time_90_percentile,
    percentile_disc(0.95) WITHIN GROUP (ORDER BY sc.response_time) AS response_time_95_percentile,
    percentile_disc(0.99) WITHIN GROUP (ORDER BY sc.response_time) AS response_time_99_percentile,
    MAX(sc.response_time) AS response_time_max,
    DATE_TRUNC('hour', sc.created_date) AS hour
  FROM status_checks  AS sc
  INNER JOIN inserted AS i ON i.monitor_id = sc.monitor_id AND DATE_TRUNC('hour', sc.created_date) = DATE_TRUNC('hour', i.created_date)
  GROUP BY sc.monitor_id, DATE_TRUNC('hour', sc.created_date)

), daily_aggregate AS (

  SELECT 
    sc.monitor_id, 
    MIN(sc.response_time) AS response_time_min,
    percentile_disc(0.5) WITHIN GROUP (ORDER BY sc.response_time) AS response_time_median,
    percentile_disc(0.90) WITHIN GROUP (ORDER BY sc.response_time) AS response_time_90_percentile,
    percentile_disc(0.95) WITHIN GROUP (ORDER BY sc.response_time) AS response_time_95_percentile,
    percentile_disc(0.99) WITHIN GROUP (ORDER BY sc.response_time) AS response_time_99_percentile,
    MAX(sc.response_time) AS response_time_max,
    DATE_TRUNC('day', sc.created_date) AS day
  FROM status_checks  AS sc
  INNER JOIN inserted AS i ON i.monitor_id = sc.monitor_id AND DATE_TRUNC('day', sc.created_date) = DATE_TRUNC('day', i.created_date)
  GROUP BY sc.monitor_id, DATE_TRUNC('day', sc.created_date)

), upsert_hourly_aggregate AS (

  INSERT INTO status_checks_hourly
  (monitor_id, hour, response_time_min, response_time_median, response_time_90_percentile, response_time_95_percentile, response_time_99_percentile, response_time_max)
  (
    SELECT 
      monitor_id, 
      hour, 
      response_time_min, 
      response_time_median,
      response_time_90_percentile, 
      response_time_95_percentile, 
      response_time_99_percentile, 
      response_time_max 
    FROM hour_aggregate
  )
  ON CONFLICT (monitor_id, hour) 
  DO UPDATE SET
    response_time_min = EXCLUDED.response_time_min,
    response_time_median = EXCLUDED.response_time_median,
    response_time_90_percentile = EXCLUDED.response_time_90_percentile,
    response_time_95_percentile = EXCLUDED.response_time_95_percentile,
    response_time_99_percentile = EXCLUDED.response_time_99_percentile,
    response_time_max = EXCLUDED.response_time_max

), upsert_daily_aggregate AS (

  INSERT INTO status_checks_daily 
  (monitor_id, day, response_time_min, response_time_median, response_time_90_percentile, response_time_95_percentile, response_time_99_percentile, response_time_max)
  (
    SELECT 
      monitor_id, 
      day, 
      response_time_min, 
      response_time_median,
      response_time_90_percentile, 
      response_time_95_percentile, 
      response_time_99_percentile, 
      response_time_max 
    FROM daily_aggregate
  )
  ON CONFLICT (monitor_id, day) 
  DO UPDATE SET
    response_time_min = EXCLUDED.response_time_min,
    response_time_median = EXCLUDED.response_time_median,
    response_time_90_percentile = EXCLUDED.response_time_90_percentile,
    response_time_95_percentile = EXCLUDED.response_time_95_percentile,
    response_time_99_percentile = EXCLUDED.response_time_99_percentile,
    response_time_max = EXCLUDED.response_time_max
  
), delete_old_status_checks AS (
  DELETE FROM status_checks AS sc
  USING inserted AS i
  WHERE sc.created_date < DATE_TRUNC('day', i.created_date)
)
SELECT * FROM opened_failure_report
UNION
SELECT * FROM closed_failure_report