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
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { TodayScreen } from "@/screens/app/TodayScreen";
import { MatchesScreen } from "@/screens/app/MatchesScreen";
import { MatchDetailScreen } from "@/screens/app/MatchDetailScreen";
import { ChatScreen } from "@/screens/app/ChatScreen";
import { ProfileScreen } from "@/screens/app/ProfileScreen";
import { PhotosScreen } from "@/screens/app/PhotosScreen";
import { SettingsScreen } from "@/screens/app/SettingsScreen";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth, RedirectIfAuth, ProtectedOutlet } from "@/features/auth/guards";

/** Route table. Public site → auth → onboarding → the guarded app shell. */
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

      {/* Onboarding: authed but not yet onboarded */}
      <Route path="/onboarding" element={<RequireAuth><OnboardingScreen /></RequireAuth>} />

      {/* Protected app — EVERY in-app route nests under guard + shell */}
      <Route element={<ProtectedOutlet />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<Navigate to="/app/today" replace />} />
          <Route path="/app/today" element={<TodayScreen />} />
          <Route path="/app/matches" element={<MatchesScreen />} />
          <Route path="/app/matches/:id" element={<MatchDetailScreen />} />
          <Route path="/app/chat" element={<ChatScreen />} />
          <Route path="/app/chat/:matchId" element={<ChatScreen />} />
          <Route path="/app/profile" element={<ProfileScreen />} />
          <Route path="/app/photos" element={<PhotosScreen />} />
          <Route path="/app/settings" element={<SettingsScreen />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
