-- Existing accounts remain verified; all newly registered accounts are created as unverified.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS email_verifications (
  user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  code_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts SMALLINT NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
