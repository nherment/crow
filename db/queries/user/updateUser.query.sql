-- $1 userId
-- $2 email
-- $3 first_name
-- $4 last_name
UPDATE users
SET
  email = $2,
  first_name = $3,
  last_name = $4
WHERE id = $1;