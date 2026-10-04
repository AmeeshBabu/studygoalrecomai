import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './store/AppProvider.jsx';
import { AppShell } from './components/layout/AppShell.jsx';

import Landing from './pages/Landing.jsx';
import SignIn from './pages/SignIn.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TodayPlan from './pages/TodayPlan.jsx';
import Subjects from './pages/Subjects.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import Revision from './pages/Revision.jsx';
import Progress from './pages/Progress.jsx';
import Insights from './pages/Insights.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

/** The planner needs an exam date and a daily budget before it can rank anything. */
function RequireSetup({ children }) {
  const { profile } = useApp();
  if (!profile.onboarded) return <Navigate to="/onboarding" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route
        path="/app"
        element={
          <RequireSetup>
            <AppShell />
          </RequireSetup>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="today" element={<TodayPlan />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="revision" element={<Revision />} />
        <Route path="progress" element={<Progress />} />
        <Route path="insights" element={<Insights />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
