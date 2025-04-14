import React, { useState } from "react";
import styled from "styled-components";
import axios from "axios";

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
  text-align: center;
  color: rgb(198, 206, 199);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Input = styled.input`
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #444;
  background: #1e1e1e;
  color: #fff;
  font-size: 16px;
`;

const Button = styled.button`
  padding: 12px;
  border-radius: 8px;
  background-color: rgb(101, 109, 102);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: rgb(69, 140, 216);
  }
`;

const SwitchLink = styled.p`
  color: #007bff;
  cursor: pointer;
  text-align: center;
  margin-top: 10px;

  &:hover {
    text-decoration: underline;
  }
`;

const LoginForm = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const API = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const url = isLoginMode
        ? `${API}/user/auth/login`
        : `${API}/user/auth/register`;      
      const payload = isLoginMode ? { email, password } : { email, password, name };
      const res = await axios.post(url, payload);
      const token = res.data.token;

      localStorage.setItem("token", token);
      onLoginSuccess(token);
    } catch (err) {
      alert("Помилка: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <FormContainer>
      <h3>{isLoginMode ? "Увійти" : "Зареєструватися"}</h3>
      <Form onSubmit={handleSubmit}>
        {!isLoginMode && (
          <Input
            type="text"
            placeholder="Ваше ім’я"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit">
          {isLoginMode ? "Увійти" : "Зареєструватися"}
        </Button>
      </Form>
      <SwitchLink onClick={() => setIsLoginMode(!isLoginMode)}>
        {isLoginMode ? "Ще не маєте акаунту?   Зареєструйтеся" : "Вже маєте акаунт?   Увійдіть"}
      </SwitchLink>
    </FormContainer>
  );
};

export default LoginForm;
