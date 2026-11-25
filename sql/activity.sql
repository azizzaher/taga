BEGIN;

-- Distance for walking and running entries.
ALTER TABLE public.exercise_logs
    ADD COLUMN IF NOT EXISTS distance_km NUMERIC(8,2);

-- Distance cannot be negative.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'exercise_logs_distance_nonnegative'
          AND conrelid = 'public.exercise_logs'::regclass
    ) THEN
        ALTER TABLE public.exercise_logs
            ADD CONSTRAINT exercise_logs_distance_nonnegative
            CHECK (distance_km IS NULL OR distance_km >= 0);
    END IF;
END
$$;

COMMIT;
