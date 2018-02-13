-- $1: session_token
UPDATE sessions AS s
SET expiry = NOW() + INTERVAL '5 days'
FROM users AS u
WHERE s.token = $1
  AND s.expiry > NOW()
  AND u.id = s.user_id
  AND u.active = true
RETURNING
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.active,
  u.password_needs_changing,
  CASE WHEN (u.first_name IS NOT NULL OR u.last_name IS NOT NULL)
    THEN
      COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')
    ELSE
      u.email
    END AS full_name,
  s.token AS session_token,
  s.expiry AS session_expiry