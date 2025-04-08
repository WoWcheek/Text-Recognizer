import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import Modal from "react-modal";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminPanel from "./components/AdminPanel";
import { useNavigate } from "react-router-dom"
import AdminAccessButton from "./components/AdminAccessButton";

Modal.setAppElement("#root");


const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 20px;
  background-color: #121212;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 28px;
  color: #e0e0e0;
  margin-bottom: 10px;
  text-align: center;
`;

const UploadForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
  max-width: 400px;
`;

const Input = styled.input`
  padding: 12px;
  width: 100%;
  border: 2px solid #333;
  border-radius: 8px;
  background-color: #1e1e1e;
  color: #e0e0e0;
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  &[type="file"] {
    cursor: pointer;
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  margin-top: 20px;
  background-color: #007bff;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    background-color: #0069d9;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #555;
    cursor: not-allowed;
    transform: none;
  }
`;

const ImagePreview = styled.img`
  max-width: 100%;
  max-height: 300px;
  margin-top: 15px;
  border-radius: 8px;
  border: 2px solid #333;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
`;

const UserInfo = styled.div`
  font-size: 18px;
  color: #bbbbbb;
  text-align: center;
  margin-bottom: 10px;
`;

const LoginButton = styled(Button)`
  background-color: #4285f4;
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    background-color: #357ae8;
  }
`;

const DecodedText = styled.div`
  margin-top: 20px;
  padding: 20px;
  background-color: #1e1e1e;
  border: 2px solid #333;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  word-wrap: break-word;
  color: #e0e0e0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

  strong {
    color: #007bff;
    display: block;
    margin-bottom: 10px;
    font-size: 18px;
  }

  div {
    line-height: 1.5;
  }
`;

const Card = styled.div`
  background-color: #1e1e1e;
  border-radius: 12px;
  padding: 25px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  border: 1px solid #333;
`;

const SubscriptionButton = styled(Button)`
  background-color: #6c757d;
  margin-top: 20px;

  &:hover {
    background-color: #5a6268;
  }
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #e0e0e0;
`;

const PlanContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 15px;
`;

const PlanCard = styled.div`
  flex: 1;
  padding: 20px;
  border-radius: 8px;
  background-color: ${({ active }) => (active ? "#2a2a2a" : "#1e1e1e")};
  border: 1px solid ${({ active }) => (active ? "#007bff" : "#333")};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
`;

const PlanTitle = styled.h3`
  margin: 0 0 10px 0;
  color: ${({ active }) => (active ? "#007bff" : "#e0e0e0")};
`;

const PlanPrice = styled.p`
  font-size: 24px;
  margin: 0 0 10px 0;
  color: ${({ active }) => (active ? "#007bff" : "#e0e0e0")};
`;

const PlanFeatures = styled.ul`
  padding-left: 20px;
  margin: 0;
`;

const PlanFeature = styled.li`
  margin-bottom: 5px;
  color: #bbbbbb;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #bbbbbb;
  font-size: 20px;
  cursor: pointer;

  &:hover {
    color: #e0e0e0;
  }
`;

const modalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#1e1e1e",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "30px",
    maxWidth: "600px",
    width: "90%",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 1000,
  },
};

const App = () => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [decodedText, setDecodedText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const API_BASE = process.env.REACT_APP_API_URL;

  
  const PLANS = [
    {
      id: "free",
      name: "Бесплатный",
      price: "$0",
      features: [
        "5 запросов в день",
        "Базовые функции",
        "Ограниченная поддержка",
      ],
    },
    {
      id: "standart",
      name: "Базовый",
      price: "$1",
      features: [
        "20 запросов в день",
        "Приоритетная обработка",
        "Быстрая поддержка",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$5",
      features: [
        "Неограниченные запросы",
        "Высший приоритет",
        "24/7 поддержка",
        "Дополнительные функции",
      ],
    },
  ];

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
  
    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      fetchUserInfo(tokenFromUrl);
      fetchSubscriptionInfo(tokenFromUrl);
      window.history.replaceState({}, document.title, "/");
    } else {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      console.log("Token found:", token);
      fetchUserInfo(token);
      fetchSubscriptionInfo(token);
    }
  }, []);
  
  

  const fetchUserInfo = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (error) {
      console.error("Ошибка получения данных пользователя:", error);
      localStorage.removeItem("token");
    }
  };

  const fetchSubscriptionInfo = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/user/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscription(res.data.data);
    } catch (error) {
      console.error("Ошибка получения информации о подписке:", error);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setSubscription(null);
    setDecodedText("");
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!image || !user) return;

    setIsUploading(true);
    try {
      const base64Image = await convertToBase64(image);
      
      const response = await axios.post(`${API_BASE}/image/read-from-image`, {
        image: base64Image,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Изображение загружено:", response.data);
      setDecodedText(response.data.decoded_text || "Текст не найден");
      alert("Изображение успешно загружено!");
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      alert("Ошибка при загрузке изображения");
      setDecodedText("");
    } finally {
      setIsUploading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
  
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/user/subscription/buy`,
        { type: selectedPlan },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Подписка успешно обновлена!");
  
      fetchSubscriptionInfo(token); 
      fetchUserInfo(token);
      closeModal();                 
  
    } catch (error) {
      console.error("Ошибка при покупке подписки:", error);
      alert("Произошла ошибка при покупке подписки");
    }
  };
  
  return (
    <Router>
      <Routes>
      <Route path="/" element={
        <Container>
        <Card>
        {user && <AdminAccessButton user={user.user} />}

          <Title>Image Text Recognition</Title>
          
          <div style={{display: 'flex', alignContent: 'center', flexDirection: 'column'}}>
            {!user ? (
              <LoginButton onClick={handleGoogleLogin}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                  <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.14 18.63 6.72 16.7 5.84 14.1H2.18V16.94C4 20.53 7.7 23 12 23Z" fill="#34A853"/>
                  <path d="M5.84 14.1C5.62 13.43 5.49 12.72 5.49 12C5.49 11.28 5.62 10.57 5.84 9.9V7.06H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.94L5.84 14.1Z" fill="#FBBC05"/>
                  <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.36 3.87C17.45 2.09 14.97 1 12 1C7.7 1 4 3.47 2.18 7.06L5.84 9.9C6.72 7.3 9.14 5.38 12 5.38Z" fill="#EA4335"/>
                </svg>
                Войти через Google
              </LoginButton>
            ) : (
              <>
                <UserInfo>Добро пожаловать, {user.user.name}!</UserInfo>
                {subscription && (
                  <UserInfo>
                    Ваш тариф: <strong>{subscription.type}</strong>
                  </UserInfo>
                )}
                <SubscriptionButton onClick={openModal}>
                  Изменить подписку
                </SubscriptionButton>
                <Button onClick={handleLogout} style={{backgroundColor: "#dc3545", marginBlockEnd: "20px"}}>
                  Выйти
                </Button>


              </>
            )}

            {user && (
              <>
                <UploadForm onSubmit={handleUpload}>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImage(file);
                        setPreview(URL.createObjectURL(file));
                        setDecodedText("");
                      }
                    }}
                    disabled={isUploading}
                  />
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Загрузка..." : "Распознать текст"}
                  </Button>
                </UploadForm>
                
                {preview && <ImagePreview src={preview} alt="Preview" />}
                {decodedText && (
                  <DecodedText>
                    <strong>Результат распознавания:</strong>
                    <div>{decodedText}</div>
                  </DecodedText>
                )}
              </>
            )}
          </div>
        </Card>

        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          style={modalStyles}
          contentLabel="Выбор тарифа"
        >
          <CloseButton onClick={closeModal}>×</CloseButton>
          <ModalContent>
            <h2>Выберите тарифный план</h2>
            <PlanContainer>
              {PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  active={selectedPlan === plan.id}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  <PlanTitle active={selectedPlan === plan.id}>
                    {plan.name}
                  </PlanTitle>
                  <PlanPrice active={selectedPlan === plan.id}>
                    {plan.price}
                  </PlanPrice>
                  <PlanFeatures>
                    {plan.features.map((feature, index) => (
                      <PlanFeature key={index}>{feature}</PlanFeature>
                    ))}
                  </PlanFeatures>
                </PlanCard>
              ))}
            </PlanContainer>
            <Button
              onClick={handlePurchase}
              disabled={!selectedPlan}
              style={{ marginTop: "20px" }}
            >
              {selectedPlan ? `Купить ${selectedPlan}` : "Выберите тариф"}
            </Button>
          </ModalContent>
        </Modal>
      </Container>
    } />
    <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
    
  );
};

export default App;