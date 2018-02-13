-- $1: name
-- $2: url
-- $3: expectedStatusCode
-- $4: frequency
INSERT INTO monitors (name, url, expected_status_code, frequency_seconds)
VALUES ($1, $2, $3, $4)