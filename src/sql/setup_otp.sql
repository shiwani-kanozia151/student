-- Create OTP table
CREATE TABLE IF NOT EXISTS public.otp_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_tokens_email ON public.otp_tokens(email);

-- Function to store OTP
CREATE OR REPLACE FUNCTION public.store_otp(p_email TEXT, p_otp TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete any existing unused OTPs for this email
    DELETE FROM public.otp_tokens
    WHERE email = p_email AND is_used = FALSE;
    
    -- Insert new OTP with 3-minute expiration
    INSERT INTO public.otp_tokens (email, token, expires_at)
    VALUES (p_email, p_otp, NOW() + INTERVAL '3 minutes');
END;
$$;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_otp(p_email TEXT, p_token TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token_record public.otp_tokens%ROWTYPE;
BEGIN
    -- Get the most recent unused OTP for this email
    SELECT *
    INTO v_token_record
    FROM public.otp_tokens
    WHERE email = p_email 
    AND token = p_token 
    AND is_used = FALSE
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no valid OTP found, return false
    IF v_token_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Mark OTP as used
    UPDATE public.otp_tokens
    SET is_used = TRUE
    WHERE id = v_token_record.id;
    
    RETURN TRUE;
END;
$$;

-- Function to clean up expired OTPs (can be run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.otp_tokens
    WHERE expires_at < NOW()
    OR (is_used = TRUE AND created_at < NOW() - INTERVAL '1 day');
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.store_otp TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_otp TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otps TO authenticated; 