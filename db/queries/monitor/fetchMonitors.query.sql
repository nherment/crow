SELECT 
  id, 
  name,
  frequency_seconds,
  url,
  expected_status_code,
  created_date
FROM monitors
WHERE deleted = FALSE
ORDER BY name ASC;