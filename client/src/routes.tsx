import { Navigate, Route, Routes } from "react-router-dom";
import { HomeScreen } from "@/screens/HomeScreen";
import { TestUIScreen } from "@/screens/TestUIScreen";
import { SplashScreen } from "@/screens/SplashScreen";

/**
 * Route table. Feature epics add their screens here.
 * Protected/public guards land with Epic 2 (Auth).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/test-ui" element={<TestUIScreen />} />
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
