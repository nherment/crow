-- $1: email
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  CASE WHEN (u.first_name IS NOT NULL OR u.last_name IS NOT NULL)
    THEN
      COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')
    ELSE
      u.email
    END AS full_name,
  u.password_hash,
  u.password_salt,
  u.password_iterations,
  u.password_key_length,
  u.password_digest,
  u.password_needs_changing,
  u.active,
  u.created_date,
  s.token AS session_token,
  s.expiry AS session_expiry
FROM users AS u
LEFT JOIN sessions AS s ON s.user_id = u.id
WHERE u.email = $1