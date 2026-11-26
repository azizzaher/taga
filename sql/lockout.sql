BEGIN;

-- Count wrong passwords per account, and lock the account for a while after too many.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS failed_logins INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

COMMIT;
