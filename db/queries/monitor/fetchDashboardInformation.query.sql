WITH monitor_status AS (
  SELECT
    ARRAY_AGG(JSON_BUILD_OBJECT(
      'name', m.name,
      'url', m.url,
      'expectedStatusCode', m.expected_status_code,
      'isUp', CASE WHEN fr.created_date IS NULL THEN TRUE ELSE FALSE END,
      'lastCheck', most_recent_status_check.created_date,
      'dayUptime', day_uptime.uptime,
      'weekUptime', week_uptime.uptime,
      'monthUptime', month_uptime.uptime,
      'yearUptime', year_uptime.uptime,
      'statusChecks', sc.list
    ) ORDER BY m.name ASC, m.url ASC) AS list
  FROM monitors AS m
  LEFT JOIN failure_reports AS fr ON fr.monitor_id = m.id AND fr.closed_date IS NULL
  LEFT JOIN LATERAL (
    SELECT MAX(sc.created_date) AS created_date
    FROM status_checks AS sc 
    WHERE sc.monitor_id = m.id
  ) AS most_recent_status_check ON 1=1
  LEFT JOIN (
    SELECT 
      monitor_id,
      CASE WHEN d.uptime IS NOT NULL THEN 
        TRUNC(d.uptime::NUMERIC, 5) * 100
      ELSE 
        100
      END AS uptime
    FROM (
      SELECT m.id AS monitor_id, 1 - SUM(EXTRACT(EPOCH FROM COALESCE(fr.closed_date, NOW()) - (CASE WHEN fr.created_date > NOW() - INTERVAL '24 hours' THEN fr.created_date ELSE NOW() - INTERVAL '24 hours' END)) / EXTRACT(EPOCH FROM INTERVAL '24 hours')) AS uptime
      FROM failure_reports AS fr
      INNER JOIN monitors AS m ON m.id = fr.monitor_id
      WHERE fr.created_date > NOW() - INTERVAL '24 hours' OR fr.closed_date > NOW() - INTERVAL '24 hours'
      GROUP BY m.id
    ) AS d
  ) AS day_uptime ON day_uptime.monitor_id = m.id
  LEFT JOIN (
    SELECT 
      monitor_id,
      CASE WHEN d.uptime IS NOT NULL THEN 
        TRUNC(d.uptime::NUMERIC, 5) * 100
      ELSE 
        100
      END AS uptime
    FROM (
      SELECT m.id AS monitor_id, 1 - SUM(EXTRACT(EPOCH FROM COALESCE(fr.closed_date, NOW()) - (CASE WHEN fr.created_date > NOW() - INTERVAL '7 days' THEN fr.created_date ELSE NOW() - INTERVAL '7 days' END)) / EXTRACT(EPOCH FROM INTERVAL '7 days')) AS uptime
      FROM failure_reports AS fr
      INNER JOIN monitors AS m ON m.id = fr.monitor_id
      WHERE fr.created_date > NOW() - INTERVAL '7 days' OR fr.closed_date > NOW() - INTERVAL '7 days'
      GROUP BY m.id
    ) AS d
  ) AS week_uptime ON week_uptime.monitor_id = m.id
  LEFT JOIN (
    SELECT 
      monitor_id,
      CASE WHEN d.uptime IS NOT NULL THEN 
        TRUNC(d.uptime::NUMERIC, 5) * 100
      ELSE 
        100
      END AS uptime
    FROM (
      SELECT m.id AS monitor_id, 1 - SUM(EXTRACT(EPOCH FROM COALESCE(fr.closed_date, NOW()) - (CASE WHEN fr.created_date > NOW() - INTERVAL '30 days' THEN fr.created_date ELSE NOW() - INTERVAL '30 days' END)) / EXTRACT(EPOCH FROM INTERVAL '30 days')) AS uptime
      FROM failure_reports AS fr
      INNER JOIN monitors AS m ON m.id = fr.monitor_id
      WHERE fr.created_date > NOW() - INTERVAL '30 days' OR fr.closed_date > NOW() - INTERVAL '30 days'
      GROUP BY m.id
    ) AS d
  ) AS month_uptime ON month_uptime.monitor_id = m.id
  LEFT JOIN (
    SELECT 
      monitor_id,
      CASE WHEN d.uptime IS NOT NULL THEN 
        TRUNC(d.uptime::NUMERIC, 5) * 100
      ELSE 
        100
      END AS uptime
    FROM (
      SELECT m.id AS monitor_id, 1 - SUM(EXTRACT(EPOCH FROM COALESCE(fr.closed_date, NOW()) - (CASE WHEN fr.created_date > NOW() - INTERVAL '1 year' THEN fr.created_date ELSE NOW() - INTERVAL '1 year' END)) / EXTRACT(EPOCH FROM INTERVAL '1 year')) AS uptime
      FROM failure_reports AS fr
      INNER JOIN monitors AS m ON m.id = fr.monitor_id
      WHERE fr.created_date > NOW() - INTERVAL '1 year' OR fr.closed_date > NOW() - INTERVAL '1 year'
      GROUP BY m.id
    ) AS d
  ) AS year_uptime ON year_uptime.monitor_id = m.id
  LEFT JOIN LATERAL (
    SELECT monitor_id, ARRAY_AGG(ROW_TO_JSON(status_checks) ORDER BY created_date ASC) AS list
    FROM status_checks 
    WHERE created_date > NOW() - INTERVAL '24 hours'
    GROUP BY monitor_id
  ) AS sc ON sc.monitor_id = m.id
  WHERE m.deleted = FALSE
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
  active_alerts.list AS active_alerts,
  closed_alerts_sample.list AS closed_alerts
FROM monitor_status
LEFT JOIN active_alerts ON 1=1
LEFT JOIN closed_alerts_sample ON 1=1