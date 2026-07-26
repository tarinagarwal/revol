import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, OtpInput, Stack, Text, toast } from "@/components/ui";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { resendOtpRequest, verifyEmailRequest } from "@/features/auth/auth.api";
import { ApiError } from "@/lib/api";

const RESEND_COOLDOWN = 45;

export function VerifyEmailScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (!email) void navigate("/auth/sign-up", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (value: string) => {
    if (submitting) return;
    setSubmitting(true);
    setError(false);
    try {
      const { user } = await verifyEmailRequest(email, value);
      toast(`Welcome to Revol, ${user.displayName}`, "success");
      void navigate("/app");
    } catch (err) {
      setError(true);
      setCode("");
      toast(err instanceof ApiError ? err.message : "Verification failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    try {
      const { devOtp } = await resendOtpRequest(email);
      if (devOtp) toast(`DEV OTP: ${devOtp}`, "info");
      toast("New code sent", "success");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not resend", "error");
    }
  };

  return (
    <AuthLayout title="Check your email" subtitle={`We sent a six-digit code to ${email || "your inbox"}.`}>
      <Stack gap={8}>
        <OtpInput value={code} onChange={setCode} onComplete={(v) => void submit(v)} error={error} />
        <Button fullWidth loading={submitting} disabled={code.length !== 6} onPress={() => void submit(code)}>
          Verify
        </Button>
        <Text variant="caption" tone="dim" className="text-center">
          Nothing arrived?{" "}
          {cooldown > 0 ? (
            <span className="text-ivory-dim">Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={() => void resend()}
              className="cursor-pointer border-none bg-transparent p-0 font-body text-xs text-gold transition-colors duration-base hover:text-gold-soft"
            >
              Resend code
            </button>
          )}
        </Text>
      </Stack>
    </AuthLayout>
  );
}
