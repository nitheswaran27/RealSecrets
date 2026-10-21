
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender TEXT NOT NULL CHECK (sender IN ('N', 'H')),
    ciphertext TEXT NOT NULL,
    nonce TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


COMMENT ON TABLE public.messages IS 'Stores end-to-end encrypted messages for the secret two-person conversation between N and H.';
COMMENT ON COLUMN public.messages.sender IS 'Validated identity of the sender: must be either N or H.';
COMMENT ON COLUMN public.messages.ciphertext IS 'End-to-end encrypted message content (AES-256-GCM base64). Never contains plaintext.';
COMMENT ON COLUMN public.messages.nonce IS 'Cryptographic 96-bit initialization vector/nonce used for AES-GCM.';

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages (sender);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for N and H" ON public.messages;
CREATE POLICY "Allow select for N and H"
    ON public.messages
    FOR SELECT
    USING (sender IN ('N', 'H'));

DROP POLICY IF EXISTS "Allow insert for valid sender" ON public.messages;
CREATE POLICY "Allow insert for valid sender"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        sender IN ('N', 'H')
        AND length(ciphertext) > 0
        AND length(nonce) > 0
    );

DROP POLICY IF EXISTS "Prevent updates to messages" ON public.messages;
CREATE POLICY "Prevent updates to messages"
    ON public.messages
    FOR UPDATE
    USING (false);

DROP POLICY IF EXISTS "Prevent deletes to messages" ON public.messages;
DROP POLICY IF EXISTS "Allow delete for N and H" ON public.messages;
CREATE POLICY "Allow delete for N and H"
    ON public.messages
    FOR DELETE
    USING (sender IN ('N', 'H'));
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;
