-- Member persona profiles ("Who are you?" — cricketer, singer, painter, etc.)

CREATE TABLE IF NOT EXISTS member_persona_profiles (
    persona_profile_id SERIAL PRIMARY KEY,
    user_id            INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    persona_type       VARCHAR(50) NOT NULL,
    answers            JSONB NOT NULL DEFAULT '{}',
    created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_member_persona_profiles_user ON member_persona_profiles(user_id);
