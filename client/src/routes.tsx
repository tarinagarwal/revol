import { Navigate, Route, Routes } from "react-router-dom";
import { HomeScreen } from "@/screens/HomeScreen";
import { TestUIScreen } from "@/screens/TestUIScreen";
import { DownloadScreen } from "@/screens/DownloadScreen";
import { SplashScreen } from "@/screens/SplashScreen";
import { SignInScreen } from "@/screens/auth/SignInScreen";
import { SignUpScreen } from "@/screens/auth/SignUpScreen";
import { VerifyEmailScreen } from "@/screens/auth/VerifyEmailScreen";
import { ForgotPasswordScreen } from "@/screens/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "@/screens/auth/ResetPasswordScreen";
import { AppHomeScreen } from "@/screens/app/AppHomeScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { RequireAuth, RedirectIfAuth, RequireOnboarded } from "@/features/auth/guards";

/** Route table. Feature epics extend the /app section. */
export function AppRoutes() {
  return (
    <Routes>
      {/* Public site */}
      <Route path="/" element={<HomeScreen />} />
      <Route path="/test-ui" element={<TestUIScreen />} />
      <Route path="/download" element={<DownloadScreen />} />
      <Route path="/splash" element={<SplashScreen />} />

      {/* Auth (redirect away when already signed in) */}
      <Route path="/auth/sign-in" element={<RedirectIfAuth><SignInScreen /></RedirectIfAuth>} />
      <Route path="/auth/sign-up" element={<RedirectIfAuth><SignUpScreen /></RedirectIfAuth>} />
      <Route path="/auth/verify" element={<VerifyEmailScreen />} />
      <Route path="/auth/forgot" element={<RedirectIfAuth><ForgotPasswordScreen /></RedirectIfAuth>} />
      <Route path="/auth/reset" element={<RedirectIfAuth><ResetPasswordScreen /></RedirectIfAuth>} />

      {/* Protected app */}
      <Route path="/onboarding" element={<RequireAuth><OnboardingScreen /></RequireAuth>} />
      <Route path="/app" element={<RequireAuth><RequireOnboarded><AppHomeScreen /></RequireOnboarded></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
