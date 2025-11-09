import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import "./ChatModal.css";

const ChatModal = ({ isOpen, onClose, doctor, docId }) => {
  const { sendMessage, getDoctorMessages, loading } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Load messages when modal opens
  useEffect(() => {
    if (isOpen && docId) {
      loadMessages();
    }
  }, [isOpen, docId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!docId) return;
    setIsLoadingMessages(true);
    try {
      const result = await getDoctorMessages(docId);
      if (result.success) {
        setMessages(result.messages || []);
      } else {
        toast.error(result.message || "Failed to load messages");
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !docId) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      const result = await sendMessage(docId, messageText);
      if (result.success) {
        // Add the new message to the local state immediately
        setMessages((prev) => [
          ...prev,
          {
            message: messageText,
            sender: "user",
            timestamp: new Date(),
            _id: result.chat?._id || Date.now().toString(),
          },
        ]);
        // Reload messages to get the latest from server
        await loadMessages();
      } else {
        toast.error(result.message || "Failed to send message");
        setNewMessage(messageText); // Restore message if failed
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setNewMessage(messageText); // Restore message if failed
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal-header">
          <div className="chat-doctor-info">
            <img
              src={doctor?.image || "https://via.placeholder.com/40"}
              alt={doctor?.name}
              className="chat-doctor-avatar"
            />
            <div>
              <h3>{doctor?.name || "Doctor"}</h3>
              <p>{doctor?.speciality || ""}</p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="chat-messages-container">
          {isLoadingMessages ? (
            <div className="chat-loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`chat-message ${
                  msg.sender === "user" ? "chat-message-sent" : "chat-message-received"
                }`}
              >
                <div className="chat-message-content">
                  <p>{msg.message}</p>
                  <span className="chat-message-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={loading || !newMessage.trim()}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;

