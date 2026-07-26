import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Stack, Text, toast } from "@/components/ui";
import { UserIcon } from "@/components/icons";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { forgotPasswordRequest } from "@/features/auth/auth.api";
import { ApiError } from "@/lib/api";

const schema = z.object({ email: z.string().trim().email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    setSubmitting(true);
    try {
      const { devOtp } = await forgotPasswordRequest(email);
      if (devOtp) toast(`DEV OTP: ${devOtp}`, "info");
      toast("If that email exists, a code is on its way", "success");
      void navigate("/auth/reset", { state: { email } });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthLayout title="Forgot password" subtitle="It happens. We'll send a code to bring you back.">
      <form onSubmit={(e) => void onSubmit(e)} noValidate>
        <Stack gap={6}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            leading={<UserIcon size={18} />}
            error={errors.email?.message ?? ""}
            {...register("email")}
          />
          <Button type="submit" fullWidth loading={submitting}>
            Send reset code
          </Button>
          <Text variant="caption" tone="dim" className="text-center">
            Remembered it?{" "}
            <Link to="/auth/sign-in" className="text-gold no-underline transition-colors duration-base hover:text-gold-soft">
              Sign in
            </Link>
          </Text>
        </Stack>
      </form>
    </AuthLayout>
  );
}
