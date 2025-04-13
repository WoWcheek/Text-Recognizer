import React, { useEffect, useState } from "react";
import axios from "axios";
import { Chart } from "react-google-charts";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  Legend,
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis,
  YAxis
} from "recharts";


const API_BASE = process.env.REACT_APP_API_URL;

const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};



const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [queries, setQueries] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [editingUserId, setEditingUserId] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [newPlan, setNewPlan] = useState("");

  const tariffData = [
    { name: "free", value: users.filter((u) => u.subscription?.type === "free").length },
    { name: "standart", value: users.filter((u) => u.subscription?.type === "standart").length },
    { name: "pro", value: users.filter((u) => u.subscription?.type === "pro").length },
  ];

  const tariffChartData = [
    ["Tariff", "Кількість"],
    ...tariffData.map((item) => [item.name, item.value])
  ];
  
  const tariffChartOptions = {
    title: "Розподіл тарифів (3D)",
    is3D: true,
    backgroundColor: "#1f1f1f",
    legendTextStyle: { color: "#fff" },
    titleTextStyle: { color: "#fff" },
    pieSliceTextStyle: { color: "#fff" },
  };
  

  const roleData = [
    { name: "admin", value: users.filter((u) => u.role === "admin").length },
    { name: "user", value: users.filter((u) => u.role === "user").length },
  ];
  
  
  

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
  
  const queryStats = users
      .map((u) => ({
        name: u.name || u.email,
        queries: u.queryCount || 0,
      }))
      .sort((a, b) => b.queries - a.queries); 

  

  
  

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

  const saveUserChanges = async (user) => {
    try {
      await axios.patch(
        `${API_BASE}/user/admin/edit/${user._id}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      await axios.post(
        `${API_BASE}/user/admin/set-subscription/${user._id}`,
        { type: newPlan },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.post(
        `${API_BASE}/user/admin/set-limit/${user._id}`,
        { count: user.limits?.count || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(users.map((u) =>
        u._id === user._id
          ? {
              ...u,
              role: newRole,
              subscription: { ...u.subscription, type: newPlan },
              limits: { ...u.limits, count: user.limits?.count || 0 }
            }
          : u
      ));
  
      setEditingUserId(null);
    } catch (err) {
      console.error("❌ Помилка при збереженні змін користувача:", err);
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
              {editingUserId === u._id ? (
                <>
                  <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "10px",
                    marginBottom: "8px"
                  }}>
                    <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ fontSize: 16, width: "120px" }}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)} style={{ fontSize: 16, width: "130px" }}>
                      <option value="free">free</option>
                      <option value="standart">standart</option>
                      <option value="pro">pro</option>
                      <option value="review">review</option>
                    </select>
                    <input
                      type="number"
                      placeholder="count"
                      value={u.limits?.count || 0}
                      onChange={(e) => {
                        const updated = parseInt(e.target.value);
                        setUsers(users.map((user) =>
                          user._id === u._id ? { ...user, limits: { ...user.limits, count: updated } } : user
                        ));
                      }}
                      style={{ width: "80px", fontSize: 16 }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                    <button style={editStyle} onClick={() => saveUserChanges(u)}>✅</button>
                    <button style={deleteStyle} onClick={() => setEditingUserId(null)}>❌</button>
                  </div>
                </>
              ) : (
                <>
                  <button style={buttonStyle} onClick={() => handleViewQueries(u._id)}>🔍</button>
                  <button style={editStyle} onClick={() => {
                    setEditingUserId(u._id);
                    setNewRole(u.role || "user");
                    setNewPlan(u.subscription?.type || "free");
                  }}>✏️</button>
                  <button style={deleteStyle} onClick={() => handleDeleteUser(u._id)}>🗑️</button>
                </>
              )}

                    </td>
            </tr>
          ))}
        </tbody>
      </table>

      
      {selectedUser && (() => {
          const userInfo = users.find(u => u._id === selectedUser);
          const planLimits = {
            free: 3,
            standart: 7,
            pro: "∞"
          };
          const startDate = userInfo.subscription?.startDate;
          let nextBillingDate = "—";

          if (startDate && ["standart", "pro"].includes(userInfo.subscription?.type)) {
            const nextDate = new Date(startDate);
            nextDate.setDate(nextDate.getDate() + 30);
            nextBillingDate = formatDateTime(nextDate.toISOString());
          }

          
          if (!userInfo) return null;

          return (
            <div style={{
              marginTop: "40px",
              padding: "20px",
              border: "1px solid #444",
              backgroundColor: "#2c2c2c",
              borderRadius: "10px"
            }}>
              <h3 style={{ marginBottom: "15px", color: "#ffa500" }}>👤 Інформація про користувача</h3>
              <p><b>📧 Email:</b> {userInfo.email}</p>
              <p><b>👤 Ім’я:</b> {userInfo.name}</p>
              <p><b>🛡 Роль:</b> {userInfo.role}</p>
              <p><b>💼 Тариф:</b> {userInfo.subscription?.type || "free"}</p>
              <p><b>🕓 Дата покупки тарифу:</b> {formatDateTime(startDate)}</p>
              <p><b>📅 Дата початку:</b> {formatDateTime(startDate)}</p>
              <p><b>💳 Наступне списання:</b> {nextBillingDate}</p>
              <p><b>📊 Ліміт запитів:</b> {planLimits[userInfo.subscription?.type] ?? "—"}</p>
              <p><b>📊 Використано запитів:</b> {userInfo.limits?.count ?? 0} / {planLimits[userInfo.subscription?.type] ?? "—"}</p>
              {userInfo.balance !== undefined && (
                <p><b>💰 Баланс:</b> {userInfo.balance} ₴</p>
              )}
              <p><b>📨 Кількість запитів:</b> {userInfo.queryCount}</p>

              <h4 style={{ marginTop: "30px" }}>📄 Запити користувача:</h4>
              <ul>
                {queries.map((q) => (
                  <li key={q._id}>
                    🖼 <b>Text:</b> {q.text}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}


            <div style={{width: "100%", marginTop: "100px"}}>
              <h1 style={{textAlign: "center", margin: "50px"}}>📈 АНАЛІТИКА</h1>
                      <h3 style={{ marginTop: "40px" }}>📈 Розподіл тарифів (3D)</h3>
                        <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
                          <Chart
                            chartType="PieChart"
                            width="100%"
                            height="400px"
                            data={tariffChartData}
                            options={tariffChartOptions}
                          />
                        </div>

                      <h3 style={{ marginTop: "40px" }}>📊 Розподіл ролей</h3>
                        <div style={{ width: "100%", height: 200 }}>
                          <ResponsiveContainer>
                            <BarChart data={roleData} layout="vertical" margin={{ left: 100 }}>
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="value" fill="#00C49F" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                      <h3 style={{ marginTop: "20px" }}>📊 Кількість запитів по користувачах</h3>
                      <div style={{ width: "100%", height: `${queryStats.length * 60}px` }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={queryStats} layout="vertical" margin={{ left: 100 }}>
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="queries" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

            </div>
              




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
  width: "31%",
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
