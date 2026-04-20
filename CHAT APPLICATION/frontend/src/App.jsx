import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import AuthPage from "./pages/AuthPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";

const API_BASE = "http://localhost:4000";
const TOKEN_KEY = "chat_token";
const USER_KEY = "chat_user";

function App() {
  const [mode, setMode] = useState("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem(USER_KEY) || "null"));
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState("");
  const [text, setText] = useState("");
  const [messagesByUser, setMessagesByUser] = useState({});
  const [socket, setSocket] = useState(null);

  const authHeaders = useMemo(
    () => ({
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }),
    [token]
  );

  const activeMessages = messagesByUser[selected] || [];

  const fetchMembers = async () => {
    if (!token) return;
    const { data } = await axios.get(`${API_BASE}/api/users`, authHeaders);
    setMembers(data.members);
  };

  const fetchConversation = async (partner) => {
    if (!partner || !token) return;
    const { data } = await axios.get(`${API_BASE}/api/messages/${partner}`, authHeaders);
    setMessagesByUser((prev) => ({ ...prev, [partner]: data.messages }));
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setStatus("Please wait...");

    try {
      const endpoint = mode === "signup" ? "signup" : "login";
      const { data } = await axios.post(`${API_BASE}/api/auth/${endpoint}`, {
        username,
        password,
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setPassword("");
      setStatus("");
    } catch (error) {
      setStatus(error.response?.data?.error || "Authentication failed.");
    }
  };

  const handleLogout = () => {
    socket?.disconnect();
    setSocket(null);
    setToken("");
    setUser(null);
    setMembers([]);
    setSelected("");
    setMessagesByUser({});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const handleSend = (event) => {
    event.preventDefault();
    if (!socket || !selected || !text.trim()) return;
    socket.emit("private-message", { to: selected, message: text });
    setText("");
  };

  useEffect(() => {
    if (!token || !user) return;
    fetchMembers().catch(() => handleLogout());
  }, [token, user]);

  useEffect(() => {
    if (!selected) return;
    fetchConversation(selected).catch(() => {});
  }, [selected]);

  useEffect(() => {
    if (!token || !user) return undefined;

    const socketConnection = io(API_BASE, { auth: { token } });
    setSocket(socketConnection);

    socketConnection.on("online-users", (onlineNames) => {
      setMembers((prev) =>
        prev.map((member) => ({
          ...member,
          online: onlineNames.includes(member.username),
        }))
      );
    });

    socketConnection.on("private-message", (payload) => {
      const partner = payload.from === user.username ? payload.to : payload.from;
      setMessagesByUser((prev) => ({
        ...prev,
        [partner]: [...(prev[partner] || []), payload],
      }));
      if (!selected) {
        setSelected(partner);
      }
    });

    return () => socketConnection.disconnect();
  }, [token, user]);

  if (!user || !token) {
    return (
      <AuthPage
        mode={mode}
        setMode={setMode}
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        status={status}
        onSubmit={handleAuth}
      />
    );
  }

  return (
    <ChatPage
      user={user}
      members={members}
      selected={selected}
      setSelected={setSelected}
      activeMessages={activeMessages}
      text={text}
      setText={setText}
      onSend={handleSend}
      onLogout={handleLogout}
    />
  );
}

export default App;
