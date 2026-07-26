import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, OtpInput, Stack, Text, toast } from "@/components/ui";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/icons";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { resetPasswordRequest } from "@/features/auth/auth.api";
import { ApiError } from "@/lib/api";

const schema = z.object({ newPassword: z.string().min(8, "At least 8 characters") });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!email) void navigate("/auth/forgot", { replace: true });
  }, [email, navigate]);

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    if (code.length !== 6) {
      setCodeError(true);
      toast("Enter the 6-digit code", "error");
      return;
    }
    setSubmitting(true);
    try {
      await resetPasswordRequest(email, code, newPassword);
      toast("Password reset — sign in with your new password", "success");
      void navigate("/auth/sign-in");
    } catch (err) {
      setCodeError(true);
      toast(err instanceof ApiError ? err.message : "Reset failed", "error");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthLayout title="Set a new password" subtitle={`Enter the code we sent to ${email || "your email"}.`}>
      <form onSubmit={(e) => void onSubmit(e)} noValidate>
        <Stack gap={6}>
          <Stack gap={2}>
            <Text variant="label" tone="dim">
              Reset code
            </Text>
            <OtpInput
              value={code}
              onChange={(v) => {
                setCode(v);
                setCodeError(false);
              }}
              error={codeError}
            />
          </Stack>
          <Input
            label="New password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            leading={<LockIcon size={18} />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="cursor-pointer border-none bg-transparent p-0 text-ivory-dim transition-colors duration-base hover:text-ivory"
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            }
            error={errors.newPassword?.message ?? ""}
            {...register("newPassword")}
          />
          <Button type="submit" fullWidth loading={submitting}>
            Reset password
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
