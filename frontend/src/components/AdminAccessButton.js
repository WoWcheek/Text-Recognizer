import React from "react";
import { useNavigate } from "react-router-dom";

const AdminAccessButton = ({ user }) => {
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  return (
    <button
      onClick={() => {
        if (isAdmin) navigate("/admin");
      }}
      disabled={!isAdmin}
      style={{
        background: "transparent",
        border: "none",
        fontSize: "20px",
        marginLeft: "10px",
        cursor: isAdmin ? "pointer" : "not-allowed",
        opacity: isAdmin ? 1 : 0.4,
      }}
      title={isAdmin ? "AdminPanel" : "Тільки для адміністратора"}
    >
      ⚡
    </button>
  );
};

export default AdminAccessButton;
