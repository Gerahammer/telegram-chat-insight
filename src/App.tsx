import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import AppLayout from "./components/AppLayout.tsx";
import Dashboard from "./pages/app/Dashboard.tsx";
import Chats from "./pages/app/Chats.tsx";
import ChatDetail from "./pages/app/ChatDetail.tsx";
import ActionItems from "./pages/app/ActionItems.tsx";
import NoActivity from "./pages/app/NoActivity.tsx";
import Summaries from "./pages/app/Summaries.tsx";
import Settings from "./pages/app/Settings.tsx";
import Billing from "./pages/app/Billing.tsx";
import SearchPage from "./pages/app/Search.tsx";
import Commitments from "./pages/app/Commitments.tsx";
import CalendarPage from "./pages/app/Calendar.tsx";
import AdminPanel from "./pages/app/AdminPanel.tsx";
import CalendarPage from "./pages/app/Calendar.tsx";
import AdminPanel from "./pages/app/AdminPanel.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="chats" element={<Chats />} />
            <Route path="chats/:id" element={<ChatDetail />} />
            <Route path="actions" element={<ActionItems />} />
            <Route path="no-activity" element={<NoActivity />} />
            <Route path="summaries" element={<Summaries />} />
            <Route path="settings" element={<Settings />} />
            <Route path="billing" element={<Billing />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="commitments" element={<Commitments />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
