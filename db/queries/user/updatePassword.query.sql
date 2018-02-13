-- $1: user ID
-- $2: hash
-- $3: salt
-- $4: iterations
-- $5: key length
-- $6: digest
UPDATE users SET
  password_hash = $2,
  password_salt = $3,
  password_iterations = $4,
  password_key_length = $5,
  password_digest = $6,
  password_needs_changing = FALSE,
  password_reset_date = NOW()
WHERE
  id = $1
RETURNING
  id,
  email;