// src/components/AdminPanel.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [queries, setQueries] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`${API_BASE}/user/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  const handleViewQueries = (userId) => {
    axios
      .get(`${API_BASE}/user/admin/queries`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setQueries(res.data.filter((q) => q.userId === userId));
        setSelectedUser(userId);
      })
      .catch((err) => console.error(err));
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#1f1f1f", color: "#f0f0f0", minHeight: "100vh" }}>
      <h2 style={{ color: "#ffa500" }}>👑 AdminPanel</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#2a2a2a" }}>
        <thead>
          <tr>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Tariff</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} style={rowStyle}>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}>{u.name}</td>
              <td style={tdStyle}>{u.role || "—"}</td>
              <td style={tdStyle}>{u.subscription?.type || "free"}</td>
              <td style={tdStyle}>
                <button style={buttonStyle} onClick={() => handleViewQueries(u._id)}>
                  View requests
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUser && (
        <div style={{ marginTop: "20px" }}>
          <h3>🔍 User requests: {selectedUser}</h3>
          <ul>
            {queries.map((q) => (
              <li key={q._id}>
                🖼 <b>Text:</b> {q.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  backgroundColor: "#333",
  color: "#fff",
  padding: "10px",
  border: "1px solid #444",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #444",
};

const rowStyle = {
  backgroundColor: "#2a2a2a",
};

const buttonStyle = {
  padding: "5px 10px",
  backgroundColor: "#ffa500",
  color: "#1f1f1f",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

export default AdminPanel;
