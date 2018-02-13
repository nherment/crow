
-- $1: user ID

WITH del AS (
  DELETE FROM sessions
  WHERE user_id = $1
    AND expiry < NOW()
),
reset_failed_login_count AS (
  UPDATE users
  SET failed_login_count = 0
  WHERE id = $1
)
INSERT INTO sessions (user_id) VALUES ($1)
RETURNING token, expiry;