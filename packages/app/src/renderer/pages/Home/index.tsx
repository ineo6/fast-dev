import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./index.css";

function Home() {
  let navigate = useNavigate();

  useEffect(() => {
    navigate("/config", { replace: true });
  }, []);

  return (
    <div className="home">
      <div>GitHub 助手</div>
    </div>
  );
}

export default Home;
