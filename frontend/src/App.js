import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import Modal from "react-modal";
import { Routes, Route, useLocation  } from "react-router-dom";
import AdminPanel from "./components/AdminPanel";
import PaymentSuccess from "./components/PaymentSuccess";
import AdminAccessButton from "./components/AdminAccessButton";
import LoginForm from "./components/LoginForm";

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
  text-align: center;
  @media (max-width: 800px) {
    padding: 15px;
  }
`;


const Title = styled.h1`
  font-size: 52px;
  color: #e0e0e0;
  margin-bottom: 25px;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
`;


const UploadForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 90%;

`;

const Input = styled.input`
  padding: 12px;
  width: 100%;
  border: 2px solid #333;
  border-radius: 8px;
  background-color: #1e1e1e;
  color:rgb(243, 221, 221);
  font-size: 22px;
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
  font-size: 20px;
  font-weight: 500;
  transition: all 0.3s ease;
  width: 70%;

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
  margin-top: 15px;
  border-radius: 12px;
  border: 2px solid #444;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
`;


const UserInfo = styled.div`
  font-size: 24px;
  color: #bbbbbb;
  text-align: center;
  margin-bottom: 10px;
`;

const LoginButton = styled(Button)`
  background-color: #4285f4;
  width: 50%;
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
  background-color: #1a1a1a;
  border-radius: 20px;
  align-items: center;
  padding: 30px;
  width: 100%;
  max-width: 1200px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  border: 1px solid #2a2a2a;
  transition: all 0.3s ease;

  @media (max-width: 400px) {
    padding: 20px;
    max-width: 90%;
  }
`;



const SubscriptionButton = styled(Button)`
  background-color: #6c757d;
  width: 70%;
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

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 16px;
`;

const HiddenInput = styled.input`
  display: none;
`;

const FileLabel = styled.label`
  display: inline-block;
  background-color: #1f4b99;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  transition: 0.3s;
  width: 100%;
  max-width: 500px;
  text-align: center;

  &:hover {
    background-color: #3366cc;
  }
`;

const HandPointer = styled.div`
  font-size: 28px;
  animation: shake 1.2s infinite ease-in-out;
  margin-right: 10px;
  transform-origin: center;

  @keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    50% { transform: translateX(0); }
    75% { transform: translateX(5px); }
    100% { transform: translateX(0); }
  }
`;
const ResultActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
`;

const SmallButton = styled(Button)`
  font-size: 16px;
  padding: 10px 16px;
  width: auto;
  min-width: 140px;
  background-color: #2e2e2e;

  &:hover {
    background-color: #444;
  }
`;


const FileUploadRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  max-width: 500px;
`;
const RecognizeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  max-width: 500px;
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
    maxWidth: "900px",
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
  const [sentiment, setSentiment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [handTarget, setHandTarget] = useState("upload"); // "upload" | "recognize"
  const location = useLocation();
  const [translatedText, setTranslatedText] = useState("");
  const [languages, setLanguages] = useState([]);
  const [selectedLang, setSelectedLang] = useState("uk");

  


  const API_BASE = process.env.REACT_APP_API_URL;

  
  const PLANS = [
    {
      id: "free",
      name: "Безкоштовний",
      price: "$0",
      features: [
        "5 запитів на день",
        "Базові функції",
        "Обмежена підтримка",
      ],
    },
    {
      id: "standart",
      name: "Базовий",
      price: "$1",
      features: [
        "20 запитів на день",
        "Пріоритетна обработка",
        "Швидка підтримка",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$5",
      features: [
        "Необмежені запити",
        "Найвищий пріоритет",
        "24/7 підтримка",
        "Додаткові функції",
      ],
    },
    {
      id: "review",
      name: "Відгуки",
      price: "$15",
      features: [
        "10 аналізів відгуків на день",
        "Оцінка настрою (позитив, нейтрально, негативно)",
        "NLP аналіз тексту"
      ]
    }
    
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (location.pathname === "/" && token) {
      fetchUserInfo(token);
      fetchSubscriptionInfo(token);
    }
  }, [location.pathname]);
  
  
  
  useEffect(() => {
    window.addEventListener("message", (e) => {
      if (e.data?.type === "subscriptionPaid") {
        const token = localStorage.getItem("token");
        fetchSubscriptionInfo(token);
        fetchUserInfo(token);
        alert("Підписка оновлена!");
      }
    });
  }, []);
  
  useEffect(() => {
    axios.get(`${API_BASE}/translate/languages`)
      .then(res => {
        const langs = res.data.languages || {};
        setLanguages(Object.entries(langs)); // [["english", "en"], ...]
      })
      .catch(err => console.error("Помилка при завантаженні мов:", err));
  }, []);

  const handleTranslate = async () => {
    try {
      const res = await axios.post(`${API_BASE}/translate`, {
        text: decodedText,
        to: selectedLang,
      });
      setTranslatedText(res.data.translated_text);
    } catch (error) {
      console.error("Помилка при перекладі:", error);
      alert("Не вдалося перекласти текст");
    }
  };
  

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
      setHandTarget("review");
      alert("Изображение успешно загружено!");
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      if (error.response?.status === 429) {
        alert("Перевищено ліміт запитів для вашого тарифу.");
      } else {
        alert("Помилка при розпізнаванні зображення");
      }
      setDecodedText("");
    }
    finally {
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

  const handleCopy = () => {
    navigator.clipboard.writeText(decodedText);
    alert("Текст скопійовано у буфер обміну!");
  };
  
  const handleRetry = () => {
    if (image) {
      handleUpload({ preventDefault: () => {} });
    }
  };
  
  const handleNextAttempt = () => {
    setImage(null);
    setPreview(null);
    setDecodedText("");
    setHandTarget("upload");
  };

  const handleReviewAnalysis = async (e) => {
    e.preventDefault();

    if (!image || !user) return;
  
    setIsUploading(true);
    try {
      const response = await axios.post(`${API_BASE}/sentiment-analysis/single`, {
        review: decodedText,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
  
      const data = response.data;

      console.log("Аналіз відгуку:", data.tonality);
  
      if (data) {
        setSentiment(data.tonality || null);
        setHandTarget("upload");
        alert("Аналіз завершено!");
      } else {
        alert("Відповідь сервера порожня.");
      }
  
    } catch (error) {
      console.error("Помилка при аналізі відгуку:", error);
      if (error.response?.status === 403) {
        alert("Функція доступна лише для тарифу Review.");
      } else {
        alert("Не вдалося виконати аналіз.");
      }
      setSentiment(null);
    } finally {
      setIsUploading(false);
    }
  };
  
  
  const translateSentiment = (sentiment) => {
    switch (sentiment?.toUpperCase()) {
      case "POSITIVE": return "😊 Позитивний";
      case "NEUTRAL": return "😐 Нейтральний";
      case "NEGATIVE": return "😞 Негативний";
      default: return "🤔 Невідомо";
    }
  };
  
  

  const handlePurchase = async () => {
    if (!selectedPlan) return;
  
    try {
      const token = localStorage.getItem("token");
  
      if (selectedPlan === "free") {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/user/subscription/buy`,
          { type: selectedPlan },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        setSubscription("free");
        alert("Безкоштовна підписка активована!");
        fetchSubscriptionInfo(token);
        fetchUserInfo(token);
        closeModal();
        return;
      }
  
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/user/subscription/buy`,
        { type: selectedPlan },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (res.data.invoiceUrl) {
        window.open(res.data.invoiceUrl, "_blank", "noopener");
        alert("Вас перенаправлено до оплати в Monobank.");
      } else {
        alert("Помилка: не отримано посилання на оплату");
      }
  
      fetchSubscriptionInfo(token);
      fetchUserInfo(token);
      closeModal();
    } catch (error) {
      console.error("Помилка при покупці підписки:", error);
      alert("Произошла ошибка при покупке подписки");
    }
  };
  
  
  return (
      <Routes>
      <Route path="/" element={
        <Container>
        <Card>
            <CardContent>
              {user && <AdminAccessButton user={user.user} />}
              <Title>🤖   Image Text Recognition</Title>

              {!user ? (
                <>
                  <LoginForm onLoginSuccess={(token) => {
                    fetchUserInfo(token);
                    fetchSubscriptionInfo(token);
                  }} />
                  <LoginButton onClick={handleGoogleLogin}>                    
                    Увійти через Google
                  </LoginButton>
                </>
              ) : (
                <>
                  <UserInfo>Вітаємо, {user.user.name}!</UserInfo>
                  {subscription && (
                    <UserInfo>
                      Ваш тариф: <strong>{subscription.type}</strong>
                    </UserInfo>
                  )}
                  <SubscriptionButton onClick={openModal}>
                    Змінити Підписку
                  </SubscriptionButton>
                  <Button
                    onClick={handleLogout}
                    style={{ backgroundColor: "#dc3545", marginBlockEnd: "20px" }}
                  >
                    Вийти
                  </Button>
                </>
              )}

              {user && (
                <>
                  <UploadForm>
                  <FileUploadRow>
                      {handTarget === "upload" && <HandPointer>👉</HandPointer>}
                      <FileLabel htmlFor="fileUpload">Вибрати зображення</FileLabel>
                    </FileUploadRow>


                    <HiddenInput
                      id="fileUpload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setImage(file);
                          setPreview(URL.createObjectURL(file));
                          setDecodedText("");
                          setHandTarget("recognize");
                        }
                      }}
                      disabled={isUploading}
                    />

                        <RecognizeRow>
                          {handTarget === "recognize" && <HandPointer>👉</HandPointer>}
                          <Button
                            onClick={handleUpload}
                            disabled={isUploading || !image}
                          >
                            Розпізнати текст
                          </Button>
                        </RecognizeRow>

                        {subscription?.type === "review" && (
                          <RecognizeRow>
                            {handTarget === "review" && <HandPointer>👉</HandPointer>}
                            <Button
                              onClick={handleReviewAnalysis}
                              disabled={!decodedText}
                              style={{ backgroundColor: "#6c63ff", color: "white" }}
                            >
                              Отримати оцінку відгуку
                            </Button>
                          </RecognizeRow>
                        )}



                  </UploadForm>

                  {preview && <ImagePreview src={preview} alt="Preview" />}
                  {decodedText && (
                    <DecodedText>
                    <strong>Результат розпізнавання:</strong>
                    <div>{decodedText}</div>
                    <ResultActions>
                      <SmallButton onClick={handleCopy}>📋 Копіювати</SmallButton>
                      <SmallButton onClick={handleRetry}>🔄 Спробувати ще раз</SmallButton>
                      <SmallButton onClick={handleNextAttempt}>➡️ Наступна спроба</SmallButton>
                    </ResultActions>

                    {languages.length > 0 && (
                        <>
                          <div style={{ marginTop: "20px" }}>
                            <label style={{ color: "#ccc", marginRight: "10px" }}>Перекласти на:</label>
                            <select
                              value={selectedLang}
                              onChange={(e) => setSelectedLang(e.target.value)}
                              style={{
                                padding: "8px", borderRadius: "8px", fontSize: "16px"
                              }}
                            >
                              {languages.map(([name, code]) => (
                                <option key={code} value={code}>{name}</option>
                              ))}
                            </select>
                            <SmallButton onClick={handleTranslate}>🌍 Перекласти</SmallButton>
                          </div>
                          {translatedText && (
                            <div style={{ marginTop: "15px", color: "#66ffcc" }}>
                              <strong>Перекладений текст:</strong>
                              <div>{translatedText}</div>
                            </div>
                          )}
                        </>
                      )}
                  </DecodedText>      
                              
                  )}
                  {sentiment && (
                    <DecodedText>
                      <strong>Оцінка настрою відгуку:</strong>
                      <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                        {translateSentiment(sentiment)}
                      </div>
                    </DecodedText>
                  )}

                </>
              )}
            </CardContent>
          </Card>


        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          style={modalStyles}
          contentLabel="Выбір тарифу"
        >
          <CloseButton onClick={closeModal}>×</CloseButton>
          <ModalContent>
            <h2>Оберіть тарифний план</h2>
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
              style={{ marginTop: "20px", alignSelf: "center" }}
            >
              {selectedPlan
                ? `Перейти на ${PLANS.find((p) => p.id === selectedPlan)?.name || selectedPlan}`
                : "Оберіть тариф"}
            </Button>
          </ModalContent>
        </Modal>
      </Container>
    } />
    <Route path="/admin" element={<AdminPanel />} />
    <Route path="/payment/success" element={<PaymentSuccess />} />
      </Routes>    
  );
};

export default App;