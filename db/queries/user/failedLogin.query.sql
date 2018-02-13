-- $1: user ID

UPDATE users SET
  failed_login_count = failed_login_count + 1,
  active = (
    CASE WHEN failed_login_count < 5 THEN
      TRUE
    ELSE
      FALSE
    END
  )
WHERE id = $1
  AND active = TRUE
RETURNING active