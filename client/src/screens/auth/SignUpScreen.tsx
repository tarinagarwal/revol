import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Stack, Text, toast } from "@/components/ui";
import { EyeIcon, EyeOffIcon, HeartIcon, LockIcon, UserIcon } from "@/components/icons";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { signupRequest } from "@/features/auth/auth.api";
import { ApiError } from "@/lib/api";

const schema = z.object({
  displayName: z.string().trim().min(2, "At least 2 characters").max(60),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export function SignUpScreen() {
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
      const { devOtp } = await signupRequest(values);
      if (devOtp) toast(`DEV OTP: ${devOtp}`, "info");
      toast("Code sent — check your email", "success");
      void navigate("/auth/verify", { state: { email: values.email } });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthLayout title="Begin your story" subtitle="A few details — the rest stays a beautiful mystery.">
      <form onSubmit={(e) => void onSubmit(e)} noValidate>
        <Stack gap={6}>
          <Input
            label="Name"
            placeholder="What should we call you?"
            autoComplete="name"
            leading={<HeartIcon size={18} />}
            error={errors.displayName?.message ?? ""}
            {...register("displayName")}
          />
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
            error={errors.password?.message ?? ""}
            {...register("password")}
          />
          <Button type="submit" fullWidth loading={submitting}>
            Create account
          </Button>
          <Text variant="caption" tone="dim" className="text-center">
            Already have an account?{" "}
            <Link to="/auth/sign-in" className="text-gold no-underline transition-colors duration-base hover:text-gold-soft">
              Sign in
            </Link>
          </Text>
        </Stack>
      </form>
    </AuthLayout>
  );
}
