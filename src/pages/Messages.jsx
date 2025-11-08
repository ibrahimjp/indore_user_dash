import React from "react";
import "./Messages.css";

const Messages = () => {
  const conversations = [
    {
      id: 1,
      doctor: "Dr. Meera Kapoor",
      specialty: "Cardiologist",
      lastMessage: "How are you feeling today?",
      time: "2 hours ago",
      unread: 2,
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      id: 2,
      doctor: "Dr. John Thomas",
      specialty: "General Physician",
      lastMessage: "Please take the prescribed medication regularly",
      time: "5 hours ago",
      unread: 0,
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      id: 3,
      doctor: "Dr. Sarah Johnson",
      specialty: "Dermatologist",
      lastMessage: "Your test results look good",
      time: "1 day ago",
      unread: 1,
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    {
      id: 4,
      doctor: "Dr. Michael Chen",
      specialty: "Orthopedic",
      lastMessage: "Schedule a follow-up appointment next week",
      time: "2 days ago",
      unread: 0,
      avatar: "https://randomuser.me/api/portraits/men/56.jpg",
    },
  ];

  return (
    <div className="page-container">
      <div className="topbar">
        <h2>Welcome back, Emily 👋</h2>
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
              <input type="text" placeholder="Search conversations..." />
            </div>

            <div className="conversations">
              {conversations.map((conv) => (
                <div className="conversation-item" key={conv.id}>
                  <img src={conv.avatar} alt={conv.doctor} className="avatar" />
                  <div className="conversation-details">
                    <div className="conversation-header">
                      <h3>{conv.doctor}</h3>
                      <span className="time">{conv.time}</span>
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
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="chat-area">
            <div className="chat-placeholder">
              <div className="placeholder-icon">💬</div>
              <h2>Select a conversation</h2>
              <p>Choose a conversation from the list to view messages</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
