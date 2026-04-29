import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "@/lib/api";
import Landing from "./Landing";

const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (getAuthToken()) navigate("/app");
  }, [navigate]);
  return <Landing />;
};

export default Index;
