
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login page for now
    // TODO: Implement proper authentication check
    navigate("/login");
  }, [navigate]);

  return null;
};

export default Index;
