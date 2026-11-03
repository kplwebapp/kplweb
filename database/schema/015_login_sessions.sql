-- Login sessions: one row per signed-in device/browser; refresh tokens are hashed server-side.

CREATE TABLE login_sessions (
    session_id          UUID PRIMARY KEY,
    user_id             INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token_hash  CHAR(64) NOT NULL,
    client_type         VARCHAR(20) NOT NULL
                        CHECK (client_type IN ('web', 'admin', 'mobile')),
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ
);

CREATE INDEX idx_login_sessions_user_active
    ON login_sessions (user_id)
    WHERE revoked_at IS NULL;

CREATE INDEX idx_login_sessions_refresh_active
    ON login_sessions (refresh_token_hash)
    WHERE revoked_at IS NULL;

CREATE INDEX idx_login_sessions_expires
    ON login_sessions (expires_at)
    WHERE revoked_at IS NULL;
