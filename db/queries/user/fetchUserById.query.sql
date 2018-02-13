-- $1: user ID
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.password_hash,
  u.password_salt,
  u.password_iterations,
  u.password_key_length,
  u.password_digest,
  u.password_needs_changing,
  u.active,
  u.created_date,
  s.list AS sessions
FROM users AS u
LEFT JOIN (
  SELECT s.user_id, ARRAY_AGG(ROW_TO_JSON(s)) AS list FROM sessions AS s
  WHERE s.user_id = $1
  GROUP BY s.user_id
) AS s ON s.user_id = u.id
WHERE u.id = $1
LIMIT 1;