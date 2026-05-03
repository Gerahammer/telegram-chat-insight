import { Navigate } from "react-router-dom";
import { getAuthToken } from "@/lib/api";
import Landing from "./Landing";

const Index = () => {
  if (getAuthToken()) return <Navigate to="/app" replace />;
  return <Landing />;
};

export default Index;
