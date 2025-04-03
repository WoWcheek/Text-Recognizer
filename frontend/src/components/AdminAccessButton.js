import React from "react";
import { useNavigate } from "react-router-dom";

const AdminAccessButton = ({ user }) => {
  const navigate = useNavigate();

  const allowedRoles = ["admin", "user"]; // потом убрать user
  console.log("ROLE:", user?.role);

  //if (!allowedRoles.includes(user.role)) return null;

  return (
    <button
      onClick={() => navigate("/admin")}
      style={{
        background: "transparent",
        border: "none",
        fontSize: "20px",
        marginLeft: "10px",
        cursor: "pointer"
      }}
      title="AdminPanel"
    >
      ⚡
    </button>
  );
};

export default AdminAccessButton;
