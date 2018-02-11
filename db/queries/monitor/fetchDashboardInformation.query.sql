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
)
SELECT monitor_status.list AS monitor_status_list FROM monitor_status