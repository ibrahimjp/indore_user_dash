import React, { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import "./Messages.css";

const Messages = () => {
  const {
    chatHistory,
    getChatHistory,
    getDoctorMessages,
    sendMessage,
    userData,
    loading,
  } = useContext(UserContext);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getChatHistory();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleConversationClick = async (conversation) => {
    setSelectedConversation(conversation);
    setIsLoadingMessages(true);
    const result = await getDoctorMessages(conversation.docId);
    if (result.success) {
      setMessages(result.messages || []);
      setSelectedDoctor(result.doctor);
    } else {
      toast.error(result.message || "Failed to load messages");
    }
    setIsLoadingMessages(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation?.docId) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      const result = await sendMessage(selectedConversation.docId, messageText);
      if (result.success) {
        // Reload messages to get the latest from server
        await handleConversationClick(selectedConversation);
        // Refresh chat history
        await getChatHistory();
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

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Filter conversations based on search
  const filteredConversations = chatHistory.filter((conv) =>
    conv.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="topbar">
        <h2>Welcome back, {userData?.name || "User"} 👋</h2>
        <div className="user">Profile</div>
      </div>

      <div className="messages-container">
        <div className="messages-header">
          <h1>Messages</h1>
          <button className="new-message-btn">+ New Message</button>
        </div>

        <div className="messages-layout">
          {/* Conversations List */}
          <div className="conversations-list">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="conversations">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => (
                  <div
                    className={`conversation-item ${
                      selectedConversation?.docId === conv.docId ? "active" : ""
                    }`}
                    key={conv.docId}
                    onClick={() => handleConversationClick(conv)}
                  >
                    <img
                      src={conv.avatar}
                      alt={conv.doctor}
                      className="avatar"
                    />
                    <div className="conversation-details">
                      <div className="conversation-header">
                        <h3>{conv.doctor}</h3>
                        <span className="time">
                          {formatTimeAgo(conv.lastMessageTime)}
                        </span>
                      </div>
                      <div className="conversation-preview">
                        <p className="specialty">{conv.specialty}</p>
                        <p className="last-message">{conv.lastMessage}</p>
                      </div>
                    </div>
                    {conv.unread > 0 && (
                      <div className="unread-badge">{conv.unread}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-conversations">
                  <p>No conversations found</p>
                  {chatHistory.length === 0 && (
                    <p className="hint">
                      Start chatting with your doctors to see messages here
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="chat-area">
            {selectedConversation && selectedDoctor ? (
              <>
                <div className="chat-header">
                  <div className="chat-doctor-info">
                    <img
                      src={selectedDoctor.image || selectedConversation.avatar}
                      alt={selectedDoctor.name}
                      className="chat-avatar"
                    />
                    <div>
                      <h3>{selectedDoctor.name}</h3>
                      <p>{selectedDoctor.speciality}</p>
                    </div>
                  </div>
                </div>
                <div className="chat-messages-container">
                  {isLoadingMessages ? (
                    <div className="chat-loading">
                      <p>Loading messages...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg, index) => (
                      <div
                        key={msg._id || index}
                        className={`message ${
                          msg.sender === "user" ? "sent" : "received"
                        }`}
                      >
                        <div className="message-content">
                          <p>{msg.message}</p>
                          <span className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-messages">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
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
              </>
            ) : (
              <div className="chat-placeholder">
                <div className="placeholder-icon">💬</div>
                <h2>Select a conversation</h2>
                <p>Choose a conversation from the list to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
