# Mobile auth — OTP login

## Verified before this change

- Website registration already creates users with `is_active = FALSE` (admin approval required).
- Website login was email + password only.
- OTP tables existed for **profile change** verification, not login.

## Added backend endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/otp/request` | `{ mobile }` → send login OTP |
| POST | `/api/auth/otp/verify` | `{ mobile, otp }` → JWT tokens |

Behaviour:

- Pending (`is_active = false`) users cannot receive OTP login (403 approval message).
- Unknown mobile → 404 with register guidance.
- OTP stored in existing `otp_verifications` (10-minute TTL).
- SMS gateway is **not** wired; OTP is logged server-side. In non-production, `devOtp` is returned for local testing.

Registration continues to use `POST /api/auth/register` (unchanged approval model).
