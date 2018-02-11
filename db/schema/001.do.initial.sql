
-- CREATE EXTENSION pgcrypto;

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email CHARACTER VARYING UNIQUE NOT NULL,
  first_name CHARACTER VARYING,
  last_name CHARACTER VARYING,
  
  password_hash CHARACTER VARYING NOT NULL,
  password_salt CHARACTER VARYING NOT NULL,
  password_iterations INT NOT NULL,
  password_key_length INT NOT NULL,
  password_digest CHARACTER VARYING NOT NULL,
  password_needs_changing BOOLEAN NOT NULL DEFAULT FALSE,
  
  password_reset_token CHARACTER VARYING UNIQUE DEFAULT NULL,
  password_reset_token_expiry TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  password_reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  password_reset_automatic_login_token CHARACTER VARYING(64),
  
  active BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

);

CREATE TABLE sessions (
  token CHARACTER VARYING PRIMARY KEY DEFAULT ENCODE(GEN_RANDOM_BYTES(64), 'hex'),
  user_id BIGSERIAL REFERENCES users(id) ON DELETE CASCADE,
  expiry TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 week',
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO users (
  email,
  password_hash,
  password_salt,
  password_iterations,
  password_key_length,
  password_digest,
  active
) VALUES (
  'admin@example.com',
  '585ff79a2043f2483e5b06cb3e568296f7ce20bd90ad88776a0a83a8c287b3e4321a8a57cc4958622c807f6f57359d1641b7f95f327208422d2757f60ab81fac8d982d9351a3cf3fde52955478289eb7e6182e814d54b447bcb35e7e0d3a8e3fea8406e6cec6a821d632de1bd1f0c6ec4a4c4740b2c7c3de1653e0314ddc321c83cdcb456e8cd839b22eebde1799a1c04e1dddce84153d446c22f43440d6f79faabdd44880c5aa29b355df8e75ea400f0f260c1f65b8ac64b27cd87b55d678fdc902e4810205f76fbb3d46672ff1073c1bf70439a53984ec045c8d838e5aa7bc1cf04321ec98e7c184b2663787e516a2be7c9e27d96564adef659f81c5e64be136269221b91834a81c45f7159a244df57d56d25f77c0f41c02c5305acb371fde1fe91f10335c193f151658ce081ee5563b02aa5f4e944f69b2d1904cc403ffaf8a66e3cc3f618e18badbffc989406d137f5627e5d8ea4d0d544e22cfa84d8394d2ff2624c68d50f76d7f1fd6d8b2c160cf3f64f4669a885c16d28e7de4f94440e718361d978b33de67830eec9b39d59393a654180d363c4db8a387e2b3996adf1a27b4a63b1d4485c0c89138b80675d35d1d4a34070c3f6eaa4d7a5ecd8da6891b774b3a2a485fd5950df8b7ce50a761db0415b2759ae38e11fe71ad0df8ef84849a30318e567add8df026831720a721c80b84ef3f98b3ba4a511cd6a7dd2892',
  '6592efcf9fd0d208c5f495e74dbf9744a03329c80dc8f9dfe956c259039dfccc4b16523b8138d4b34e576e6522b5b9299c2f71e99816013a5acafda8d979665a4a6afd5a35f32278f5dd0b48203b0ebf202857c73b1458f2e77585604948c5ef93d80bd88cdfe1a3cc9bff0f281935152c233effb86b8c6fb69d836a69da1f54d800312f9e050d339ae88277aacc9f93de655d8ee4994c13992e494f4511f58faf0480f636543d1c7d0007341a3e4619585e48d10399ebbd8ecd2b9c091dc6647e085cc4662557dd634fa50b2d5ce5313020b3290ea489c02fafba629b3496eafd7e4bc4bfaaa412caeff61ef85082ef22050cd22fd08bc41ab62360a732bf1d43fc10843fbaac43133a47c5fd387713d9463bd2d7db3fdeeb50dbd9f15c9853c5df79ce23513f9fe6483c4823722aeec9c43ceaca8c9a1e1a54c240e386031e4a38dfc7231614fb69ac103d04e68dea5276ff8001b2cdf70695fde3d2f9419f5b8b3adc59b82270478f54c048d4c6101ec278a9a327826e2bcfc2735961e4e4a37555adeda7749b969aff973f7637e99f30750a6b763ddb8e76492fa7f0e339f2719c8a1b87bb31fbf73930917db423162496c6c79952320d4b57abef41299e582f2409c2c3ebfba16e07dbc9b7d6ea768185da88c8f0b238209c4395aff2c3ee8097f7cc603098e345ee0fdb1a1e95d6429325965c6a797082024b16d5f053',
  100000,
  512,
  'sha512',
  TRUE
);


create or replace function random_string(length integer) returns text as 
$$
declare
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}';
  result text := '';
  i integer := 0;
begin
  if length < 0 then
    raise exception 'Given length cannot be less than 0';
  end if;
  for i in 1..length loop
    result := result || chars[1+random()*(array_length(chars, 1)-1)];
  end loop;
  return result;
end;
$$ language plpgsql;




CREATE TABLE logs (
  author INTEGER REFERENCES users(id),
  content TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE configuration (
  name CHARACTER VARYING PRIMARY KEY,
  value TEXT,
  data_type CHARACTER VARYING,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE monitors (
  id SERIAL PRIMARY KEY, 
  name CHARACTER VARYING NOT NULL UNIQUE,
  frequency_seconds INTEGER,
  url CHARACTER VARYING NOT NULL,
  expected_status_code INTEGER NOT NULL,

  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE failure_reports (
  monitor_id INTEGER REFERENCES monitors(id),
  created_date TIMESTAMP WITH TIME ZONE NOT NULL,
  closed_date TIMESTAMP WITH TIME ZONE,
  details TEXT NOT NULL
);

CREATE INDEX failure_reports_created_date_idx ON failure_reports (created_date);
CREATE UNIQUE INDEX failure_reports_open_unique
ON failure_reports (monitor_id)
WHERE closed_date IS NULL;

CREATE TABLE status_checks (
  monitor_id INTEGER REFERENCES monitors(id),
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  succeeded BOOLEAN NOT NULL,
  response_time INTEGER,
  details TEXT
);
CREATE INDEX status_checks_hour_idx ON status_checks (created_date);

CREATE TABLE status_checks_hourly (
  monitor_id INTEGER REFERENCES monitors(id),
  hour TIMESTAMP WITH TIME ZONE DEFAULT DATE_TRUNC('hour', NOW()),
  response_time_min INTEGER,
  response_time_median INTEGER,
  response_time_90_percentile INTEGER,
  response_time_95_percentile INTEGER,
  response_time_99_percentile INTEGER,
  response_time_max INTEGER,
  CONSTRAINT status_checks_hourly_unique_entry UNIQUE (monitor_id, hour)
);
CREATE INDEX status_checks_hourly_hour_idx ON status_checks_hourly (hour);

CREATE TABLE status_checks_daily (
  monitor_id INTEGER REFERENCES monitors(id),
  day DATE NOT NULL,
  response_time_min INTEGER,
  response_time_median INTEGER,
  response_time_90_percentile INTEGER,
  response_time_95_percentile INTEGER,
  response_time_99_percentile INTEGER,
  response_time_max INTEGER,
  CONSTRAINT status_checks_daily_unique_entry UNIQUE (monitor_id, day)
);
CREATE INDEX status_checks_daily_day_idx ON status_checks_daily (day);

INSERT INTO monitors (name, frequency_seconds, url, expected_status_code)
VALUES 
  ('Production', 60, 'https://app.portchain.com/login', 200),
  ('Website', 60, 'https://www.portchain.com/', 200)