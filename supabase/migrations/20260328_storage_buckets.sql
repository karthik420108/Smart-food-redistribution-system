-- Create the 'listings' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the 'listings' bucket
-- Note: Re-creating policies safely using DO block to check existence

DO $$
BEGIN
    -- 1. Public Read Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Read Access'
    ) THEN
        CREATE POLICY "Public Read Access"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'listings' );
    END IF;

    -- 2. Authenticated Upload Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated Upload Access'
    ) THEN
        CREATE POLICY "Authenticated Upload Access"
        ON storage.objects FOR INSERT
        WITH CHECK ( 
            bucket_id = 'listings' 
            AND auth.role() = 'authenticated' 
        );
    END IF;
END
$$;
