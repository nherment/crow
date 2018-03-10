-- $1: name
-- $2: url
-- $3: expectedStatusCode
-- $4: frequency
-- $5: validationLogic
INSERT INTO monitors (name, url, expected_status_code, frequency_seconds, validation_logic)
VALUES ($1, $2, $3, $4, $5)