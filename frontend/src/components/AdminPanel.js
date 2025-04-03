import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL;

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [queries, setQueries] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
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
      .get(`${API_BASE}/user/admin/queries/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setQueries(res.data);
        setSelectedUser(userId);
      })
      .catch((err) => console.error("Помилка запиту:", err));
  };
  
  

  const handleEditUser = (user) => {
    const newRole = prompt("Введіть нову роль (user/admin):", user.role || "");
    if (!newRole) return;
  
    const newPlan = prompt("Введіть новий тариф (free/standart/pro):", user.subscription?.type || "free");
    if (!["free", "standart", "pro"].includes(newPlan)) {
      alert("Недійсний тариф. Можливі варіанти: free, standart, pro.");
      return;
    }
  
    axios
      .patch(
        `${API_BASE}/user/admin/edit/${user._id}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        // оновлюємо роль в локальному списку
        setUsers(users.map((u) => (u._id === user._id ? { ...u, role: newRole } : u)));
      })
      .catch((err) => console.error("Помилка оновлення ролі:", err));
  
    axios
      .post(
        `${API_BASE}/user/admin/set-subscription/${user._id}`,
        { type: newPlan },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {        
        setUsers(users.map((u) =>
          u._id === user._id
            ? { ...u, subscription: { ...u.subscription, type: newPlan } }
            : u
        ));
      })
      .catch((err) => console.error("Помилка оновлення тарифу:", err));
  };
  

  const handleDeleteUser = (userId) => {
    if (window.confirm("Ви впевнені, що хочете видалити цього користувача?")) {
      axios
        .delete(`${API_BASE}/user/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          setUsers(users.filter((u) => u._id !== userId));
        })
        .catch((err) => console.error("Помилка видалення користувача:", err));
    }
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#1f1f1f", color: "#f0f0f0", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#ffa500", display: "flex", alignItems: "center", margin: 0 }}>
          <span style={{ marginRight: "8px" }}>⚡</span> AdminPanel
        </h2>
        <button onClick={() => navigate("/")} style={backButtonStyle}>Back</button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#2a2a2a", marginTop: "20px" }}>
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
                <button style={buttonStyle} onClick={() => handleViewQueries(u._id)}>🔍</button>
                <button style={editStyle} onClick={() => handleEditUser(u)}>✏️</button>
                <button style={deleteStyle} onClick={() => handleDeleteUser(u._id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUser && (
        <div style={{ marginTop: "20px" }}>
          <h3>🔍 Запити користувача: {selectedUser}</h3>
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
  margin: "0 2px",
  backgroundColor: "#ffa500",
  color: "#1f1f1f",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const deleteStyle = {
  ...buttonStyle,
  backgroundColor: "#ff4d4f",
  color: "#fff",
};

const editStyle = {
  ...buttonStyle,
  backgroundColor: "#4caf50",
  color: "#fff",
};

const backButtonStyle = {
  padding: "6px 14px",
  backgroundColor: "#444",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

export default AdminPanel;
