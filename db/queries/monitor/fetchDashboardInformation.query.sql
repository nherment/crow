WITH monitor_status AS (
  SELECT
    ARRAY_AGG(JSON_BUILD_OBJECT(
      'name', m.name,
      'url', m.url,
      'expectedStatusCode', m.expected_status_code,
      'isUp', CASE WHEN  fr.closed_date IS NULL THEN TRUE ELSE FALSE END,
      'lastCheck', most_recent_status_check.created_date
    ) ORDER BY m.name ASC, m.url ASC) AS list
  FROM monitors AS m
  LEFT JOIN failure_reports AS fr ON fr.monitor_id = m.id AND fr.closed_date IS NULL
  LEFT JOIN LATERAL (
    SELECT MAX(sc.created_date) AS created_date
    FROM status_checks AS sc 
    WHERE sc.monitor_id = m.id
  ) AS most_recent_status_check ON 1=1
), day_uptime AS (
  SELECT 
    CASE WHEN d.uptime IS NOT NULL THEN 
      TRUNC(d.uptime::NUMERIC, 5) * 100
    ELSE 
      NULL
    END AS uptime
  FROM (
    SELECT 1 - SUM(EXTRACT(EPOCH FROM COALESCE(closed_date, NOW()) - (CASE WHEN created_date > NOW() - INTERVAL '24 hours' THEN created_date ELSE NOW() - INTERVAL '24 hours' END)) / EXTRACT(EPOCH FROM INTERVAL '24 hours')) AS uptime
    FROM failure_reports 
    WHERE monitor_id = 1 AND created_date > NOW() - INTERVAL '24 hours' OR closed_date > NOW() - INTERVAL '24 hours'
  ) AS d
), week_uptime AS (
  SELECT 
    CASE WHEN d.uptime IS NOT NULL THEN 
      TRUNC(d.uptime::NUMERIC, 5) * 100
    ELSE 
      NULL
    END AS uptime
  FROM (
    SELECT 1 - SUM(EXTRACT(EPOCH FROM COALESCE(closed_date, NOW()) - (CASE WHEN created_date > NOW() - INTERVAL '7 days' THEN created_date ELSE NOW() - INTERVAL '7 days' END)) / EXTRACT(EPOCH FROM INTERVAL '7 days')) AS uptime
    FROM failure_reports 
    WHERE monitor_id = 1 AND created_date > NOW() - INTERVAL '7 days' OR closed_date > NOW() - INTERVAL '7 days'
  ) AS d
), month_uptime AS (
  SELECT 
    CASE WHEN d.uptime IS NOT NULL THEN 
      TRUNC(d.uptime::NUMERIC, 5) * 100
    ELSE 
      NULL
    END AS uptime
  FROM (
    SELECT 1 - SUM(EXTRACT(EPOCH FROM COALESCE(closed_date, NOW()) - (CASE WHEN created_date > NOW() - INTERVAL '30 days' THEN created_date ELSE NOW() - INTERVAL '30 days' END)) / EXTRACT(EPOCH FROM INTERVAL '30 days')) AS uptime
    FROM failure_reports 
    WHERE monitor_id = 1 AND created_date > NOW() - INTERVAL '30 days' OR closed_date > NOW() - INTERVAL '30 days'
  ) AS d
), year_uptime AS (
  SELECT 
    CASE WHEN d.uptime IS NOT NULL THEN 
      TRUNC(d.uptime::NUMERIC, 5) * 100
    ELSE 
      NULL
    END AS uptime
  FROM (
    SELECT 1 - SUM(EXTRACT(EPOCH FROM COALESCE(closed_date, NOW()) - (CASE WHEN created_date > NOW() - INTERVAL '1 year' THEN created_date ELSE NOW() - INTERVAL '1 year' END)) / EXTRACT(EPOCH FROM INTERVAL '1 year')) AS uptime
    FROM failure_reports 
    WHERE monitor_id = 1 AND created_date > NOW() - INTERVAL '1 year' OR closed_date > NOW() - INTERVAL '1 year'
  ) AS d
), active_alerts AS (
  SELECT 
    ARRAY_AGG(JSON_BUILD_OBJECT(
      'monitorName', m.name,
      'createdDate', fr.created_date,
      'details', fr.details
    ) ORDER BY fr.created_date DESC) AS list
  FROM failure_reports AS fr
  INNER JOIN monitors AS m ON m.id = fr.monitor_id
  WHERE fr.closed_date IS NULL
), closed_alerts_sample AS (
  SELECT 
    ARRAY_AGG(JSON_BUILD_OBJECT(
      'monitorName', m.name,
      'createdDate', fr.created_date,
      'closedDate', fr.closed_date,
      'details', fr.details
    ) ORDER BY fr.closed_date DESC, fr.created_date DESC) AS list
  FROM failure_reports AS fr
  INNER JOIN monitors AS m ON m.id = fr.monitor_id
  WHERE fr.closed_date IS NOT NULL
)
SELECT 
  monitor_status.list AS monitor_status_list,
  day_uptime.uptime AS day_uptime,
  week_uptime.uptime AS week_uptime,
  month_uptime.uptime AS month_uptime,
  year_uptime.uptime AS year_uptime,
  active_alerts.list AS active_alerts,
  closed_alerts_sample.list AS closed_alerts
FROM monitor_status
LEFT JOIN day_uptime ON 1=1
LEFT JOIN week_uptime ON 1=1
LEFT JOIN month_uptime ON 1=1
LEFT JOIN year_uptime ON 1=1
LEFT JOIN active_alerts ON 1=1
LEFT JOIN closed_alerts_sample ON 1=1