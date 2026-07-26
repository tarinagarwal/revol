import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Stack, Text, toast } from "@/components/ui";
import { EyeIcon, EyeOffIcon, UserIcon, LockIcon } from "@/components/icons";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { loginRequest, resendOtpRequest } from "@/features/auth/auth.api";
import { ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

export function SignInScreen() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const { user } = await loginRequest(values.email, values.password);
      if (!user.emailVerified) {
        const res = await resendOtpRequest(values.email).catch(() => null);
        if (res?.devOtp) toast(`DEV OTP: ${res.devOtp}`, "info");
        void navigate("/auth/verify", { state: { email: values.email } });
        return;
      }
      toast(`Welcome back, ${user.displayName}`, "success");
      void navigate("/app");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthLayout title="Welcome back" subtitle="The story picks up where you left it.">
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
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Your password"
            autoComplete="current-password"
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
            error={errors.password?.message ?? ""}
            {...register("password")}
          />
          <div className="-mt-3 text-right">
            <Link
              to="/auth/forgot"
              className="font-body text-xs text-ivory-dim no-underline transition-colors duration-base hover:text-gold"
            >
              Forgot password?
            </Link>
          </div>
          <Button type="submit" fullWidth loading={submitting}>
            Sign in
          </Button>
          <Text variant="caption" tone="dim" className="text-center">
            New here?{" "}
            <Link to="/auth/sign-up" className="text-gold no-underline transition-colors duration-base hover:text-gold-soft">
              Begin your story
            </Link>
          </Text>
        </Stack>
      </form>
    </AuthLayout>
  );
}
