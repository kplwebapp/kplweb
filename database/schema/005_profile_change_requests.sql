-- Profile change requests with OTP verification

CREATE TABLE otp_verifications (
    verification_id   SERIAL PRIMARY KEY,
    user_id             INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    email_otp           VARCHAR(6) NOT NULL,
    mobile_otp          VARCHAR(6) NOT NULL,
    expires_at          TIMESTAMP NOT NULL,
    verified            BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_verifications_user_id ON otp_verifications(user_id);
CREATE INDEX idx_otp_verifications_expires_at ON otp_verifications(expires_at);

CREATE TABLE profile_change_requests (
    request_id          SERIAL PRIMARY KEY,
    user_id             INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    field_name          VARCHAR(50) NOT NULL,
    old_value           TEXT,
    new_value           TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    otp_verified_at     TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at         TIMESTAMP,
    reviewed_by         INT REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_profile_change_requests_status ON profile_change_requests(status);
CREATE INDEX idx_profile_change_requests_user_id ON profile_change_requests(user_id);
CREATE UNIQUE INDEX idx_profile_change_requests_pending_vibhaag
    ON profile_change_requests(user_id, field_name)
    WHERE status = 'PENDING' AND field_name = 'vibhaag';
