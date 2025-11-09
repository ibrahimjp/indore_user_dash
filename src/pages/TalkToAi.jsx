import React, { useCallback, useEffect, useRef, useState, useContext } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "./TalkToAI.css";
import { useAiChat } from "../../context/AiChatContext";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import CaseReportModal from "../components/CaseReportModal";

const BotIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 5V2" />
    <rect x="4" y="7" width="16" height="13" rx="3" />
    <circle cx="9" cy="13.5" r="1.2" />
    <circle cx="15" cy="13.5" r="1.2" />
    <path d="M8 18h8" />
  </svg>
);

const UserIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </svg>
);

const languageOptions = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
];

const formatTimestamp = (value) => {
  if (!value) return "";

  try {
    return new Date(value).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (error) {
    return "";
  }
};

const TalkToAI = () => {
  const { userData } = useContext(UserContext);
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    sessions,
    getSession,
    fetchSessionById,
    createSession,
    connectToSession,
    sendRealtimeMessage,
    beginAudioStream,
    sendAudioChunk,
    endAudioStream,
    socketState,
    loadingSessions,
    sessionLoadingState,
    creatingSession,
    getStreamingReply,
    latestReport,
    acknowledgeLatestReport,
    getReport,
  } = useAiChat();

  const languageFromQuery = searchParams.get("language") || "en";
  const [pendingLanguage, setPendingLanguage] = useState(languageFromQuery);
  const [messageDraft, setMessageDraft] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalData, setReportModalData] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recorderCleanupRef = useRef({ stopRequested: false });

  const resetRecorderState = useCallback(() => {
    recordedChunksRef.current = [];
    recorderCleanupRef.current.stopRequested = false;

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.onerror = null;
      mediaRecorderRef.current = null;
    }
  }, []);

  const releaseAudioStream = useCallback(() => {
    if (!audioStreamRef.current) {
      return;
    }

    try {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.warn("Failed to stop audio tracks cleanly:", error);
    } finally {
      audioStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    setPendingLanguage(languageFromQuery);
  }, [languageFromQuery]);

  const activeSession = chatId ? getSession(chatId) : null;
  const activeMessages = activeSession?.messages ?? [];
  const isSessionLoading = chatId ? !!sessionLoadingState[chatId] : false;
  const hasActiveChat = Boolean(activeSession);
  const missingConversation = Boolean(
    chatId && !isSessionLoading && !activeSession
  );
  const sessionStatus = activeSession?.status || "ACTIVE";
  const isSessionEnded = sessionStatus === "ENDED";
  const currentReport = chatId ? getReport(chatId) : null;

  const activeStreaming = chatId ? getStreamingReply(chatId) : null;
  const streamingMessage = activeStreaming
    ? {
        messageId: activeStreaming.messageId || `stream-${chatId}`,
        role: "assistant",
        text:
          activeStreaming.text && activeStreaming.text.trim()
            ? activeStreaming.text
            : "…",
        createdAt: new Date(
          activeStreaming.startedAt || Date.now()
        ).toISOString(),
        isStreaming: true,
      }
    : null;

  const displayMessages = streamingMessage
    ? [...activeMessages, streamingMessage]
    : activeMessages;
  const hasMessages = displayMessages.length > 0;

  const formatHistoryPreview = useCallback((sessionItem) => {
    if (!sessionItem) return "No messages yet";

    const rawPreview = (sessionItem.preview || "").split(/\n/)[0] || "";
    if (!rawPreview.trim()) {
      return "No messages yet";
    }

    const normalized = rawPreview.trim();
    if (normalized.toUpperCase().startsWith("CONSULTATION_ENDED")) {
      return "Consultation ended";
    }

    return normalized.length > 90
      ? `${normalized.slice(0, 90)}…`
      : normalized;
  }, []);

  useEffect(() => {
    if (!chatId) return;

    fetchSessionById(chatId).catch(() => {});
    connectToSession(chatId, { language: languageFromQuery });
  }, [chatId, languageFromQuery, connectToSession, fetchSessionById]);

  useEffect(() => {
    if (
      activeSession?.language &&
      activeSession.language !== languageFromQuery
    ) {
      const params = new URLSearchParams(searchParams);
      params.set("language", activeSession.language);
      setSearchParams(params, { replace: true });
    }
  }, [
    activeSession,
    languageFromQuery,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    setIsReportModalOpen(false);
    setReportModalData(null);
  }, [chatId]);

  useEffect(() => {
    if (!latestReport) return;

    const report =
      getReport(latestReport.sessionId) || latestReport.report || null;

    if (report) {
      setReportModalData({
        sessionId: latestReport.sessionId,
        report,
      });
      setIsReportModalOpen(true);
    }

    acknowledgeLatestReport();
  }, [acknowledgeLatestReport, getReport, latestReport]);

  const handleStartChat = async () => {
    const session = await createSession({ language: pendingLanguage });
    if (session) {
      navigate(
        `/chat/${session.sessionId}?language=${session.language}`
      );
    }
  };

  const handleHistoryClick = (id) => {
    const session =
      getSession(id) ||
      sessions.find((item) => item.sessionId === id);
    const language = session?.language || pendingLanguage;
    navigate(`/chat/${id}?language=${language}`);
  };

  const handleLanguageChange = (value, { immediate = false } = {}) => {
    setPendingLanguage(value);
    if (immediate) {
      const params = new URLSearchParams(searchParams);
      params.set("language", value);
      setSearchParams(params, { replace: true });
    }
  };

  const handleSendMessage = async () => {
    if (!chatId || !messageDraft.trim()) {
      return;
    }

    if (isSessionEnded) {
      toast.error("This consultation has ended. Start a new chat to continue.");
      return;
    }

    sendRealtimeMessage(chatId, messageDraft);
    setMessageDraft("");
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      recorderCleanupRef.current.stopRequested = true;
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.warn("Failed to stop recorder cleanly:", error);
      }
    }

    releaseAudioStream();
    setIsRecording(false);
  }, [releaseAudioStream]);

  const startRecording = useCallback(async () => {
    if (!chatId) {
      toast.error("Start a chat before recording.");
      return;
    }

    if (socketState.status !== "open") {
      toast.error("Connection not ready yet. Please wait.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone not supported in this browser.");
      return;
    }

    try {
      resetRecorderState();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      });

      recorder.onstart = () => {
        recordedChunksRef.current = [];
        beginAudioStream(chatId);
        setIsRecording(true);
      };

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        toast.error("Microphone encountered an error.");
        resetRecorderState();
        releaseAudioStream();
        setIsRecording(false);
      };

      recorder.onstop = async () => {
        try {
          if (recorderCleanupRef.current.stopRequested) {
            recorderCleanupRef.current.stopRequested = false;
          }

          const chunks = recordedChunksRef.current;
          recordedChunksRef.current = [];

          if (chunks.length > 0 && chatId) {
            const combinedBlob = new Blob(chunks, { type: recorder.mimeType });
            await sendAudioChunk(chatId, combinedBlob);
          }
        } catch (error) {
          console.error("Failed to process recorded audio:", error);
          toast.error("Unable to process recording.");
        } finally {
          resetRecorderState();
          releaseAudioStream();

          if (chatId) {
            endAudioStream(chatId);
          }
          setIsRecording(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (error) {
      console.error("Failed to access microphone:", error);
      toast.error("Unable to access microphone.");
      stopRecording();
    }
  }, [
    beginAudioStream,
    chatId,
    endAudioStream,
    releaseAudioStream,
    resetRecorderState,
    sendAudioChunk,
    socketState.status,
    stopRecording,
  ]);

  const toggleRecording = useCallback(() => {
    if (isSessionEnded) {
      toast.error("This consultation has ended. Start a new chat to continue.");
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, isSessionEnded, startRecording, stopRecording]);

  useEffect(() => {
    return () => stopRecording();
  }, [stopRecording]);

  useEffect(() => {
    if (isRecording && socketState.status !== "open") {
      stopRecording();
    }
  }, [isRecording, socketState.status, stopRecording]);

  const handleMessageKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setReportModalData(null);
  };

  const handleOpenReportModal = () => {
    if (!chatId) return;
    const report = currentReport;
    if (!report) {
      toast.info("Report not available yet.");
      return;
    }
    setReportModalData({
      sessionId: chatId,
      report,
    });
    setIsReportModalOpen(true);
  };

  const mostRecentSessionId = sessions[0]?.sessionId;
  const handlePeekLastSession = () => {
    if (!mostRecentSessionId) return;

    const session =
      getSession(mostRecentSessionId) || sessions[0];
    const language = session?.language || pendingLanguage;
    navigate(`/chat/${mostRecentSessionId}?language=${language}`);
  };

  const isRealtimeReady = socketState.status === "open";
  const isSending = chatId
    ? socketState.status !== "open"
    : creatingSession;

  const disableSend =
    !messageDraft.trim() ||
    (chatId ? !isRealtimeReady || isSessionEnded : creatingSession);

  return (
    <div className="dashboard-container">
      <div className="main">
        <div className="topbar">
          <h2>Welcome back, {userData?.name ? userData.name.trim() : "User"} 👋</h2>
          <div className="profile">Profile</div>
        </div>

        <div className="dashboard talk-ai-dashboard">
          <section className="chat-stage card">
            <header className="chat-header">
              <div className="chat-heading">
                <h2>Talk to SympAI</h2>
                <p className="chat-subheading">
                  Share how you feel in text or voice. I’ll track patterns and
                  keep suggestions gentle.
                </p>
              </div>
              {hasActiveChat && (
                <div className="chat-controls">
                  <span className="mode-pill">Text companion ready</span>
                  <label className="language-select locked">
                    <span>Language</span>
                    <select
                      aria-label="Select chat language"
                      value={activeSession?.language || languageFromQuery}
                      disabled
                      onChange={(event) =>
                        handleLanguageChange(event.target.value, {
                          immediate: true,
                        })
                      }
                    >
                      {languageOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {isSessionEnded && (
                    <button
                      type="button"
                      className="chat-action-btn outline"
                      onClick={handleOpenReportModal}
                      disabled={!currentReport}
                    >
                      {currentReport ? "View case report" : "Generating report…"}
                    </button>
                  )}
                </div>
              )}
            </header>

            {!hasActiveChat && !missingConversation && (
              <div className="chat-welcome-panel">
                <span className="chat-welcome-pill">SympAI copilot</span>
                <h3>Welcome to SympAI</h3>
                <p>
                  Kick off a new conversation to log mood, ask wellbeing
                  questions, or send a voice note. I’ll keep every detail ready
                  for your next visit.
                </p>
                <div className="welcome-language">
                  <label className="language-select">
                    <span>Preferred language</span>
                    <select
                      aria-label="Select chat language before starting"
                      value={pendingLanguage}
                      onChange={(event) =>
                        handleLanguageChange(event.target.value)
                      }
                    >
                      {languageOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <small>
                    Your choice stays in the URL like
                    {` /chat/1?language=${pendingLanguage} `}
                    so you can share or refresh safely.
                  </small>
                </div>
                <div className="chat-welcome-actions">
                  <button
                    type="button"
                    className="start-chat-btn"
                    onClick={handleStartChat}
                    disabled={creatingSession}
                  >
                    {creatingSession ? "Starting..." : "Start a new chat"}
                  </button>
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={handlePeekLastSession}
                    disabled={!mostRecentSessionId || loadingSessions}
                  >
                    Peek last session ↗
                  </button>
                </div>
                <ul className="chat-welcome-highlights">
                  <li>Instant summaries after every session</li>
                  <li>Guided breathing and grounding cues on demand</li>
                  <li>Voice notes auto-transcribed for future doctors</li>
                </ul>
              </div>
            )}

            {missingConversation && (
              <div className="chat-welcome-panel missing">
                <span className="chat-welcome-pill">No transcript yet</span>
                <h3>That conversation isn’t ready</h3>
                <p>
                  I couldn’t open this history entry. Start a fresh chat or pick
                  another reflection from the list.
                </p>
                <div className="chat-welcome-actions">
                  <button
                    type="button"
                    className="start-chat-btn"
                    onClick={handleStartChat}
                    disabled={creatingSession}
                  >
                    {creatingSession ? "Starting..." : "Start a new chat"}
                  </button>
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={() =>
                      navigate(`/chat?language=${languageFromQuery}`)
                    }
                  >
                    Back to welcome
                  </button>
                </div>
              </div>
            )}

            {hasActiveChat && (
              <>
                <div className="conversation">
                  {isSessionLoading && !hasMessages && (
                    <div className="conversation-loading">
                      <p>Loading conversation...</p>
                    </div>
                  )}

                  {!isSessionLoading && !hasMessages && (
                    <div className="conversation-loading">
                      <p>Messages will appear here once you start chatting.</p>
                    </div>
                  )}

                  {displayMessages.map((message) => {
                    const isAi = message.role === "assistant";
                    const key =
                      message.messageId ||
                      message._id ||
                      message.createdAt;

                    return (
                      <div
                        key={key}
                        className={`message ${message.role}${
                          message.isStreaming ? " streaming" : ""
                        }`}
                      >
                        <div
                          className={`avatar-badge ${message.role}`}
                          aria-hidden="true"
                        >
                          {isAi ? <BotIcon /> : <UserIcon />}
                        </div>
                        <div className="message-content">
                          <div className="bubble">
                            <p>
                              {message.text}
                              {message.isStreaming && (
                                <span
                                  className="typing-indicator"
                                  aria-hidden="true"
                                />
                              )}
                            </p>
                          </div>
                          <span className="timestamp">
                            {formatTimestamp(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="chat-input">
                  <button
                    type="button"
                    className={`control mic ${isRecording ? "recording" : ""}`}
                    aria-label={
                      isRecording ? "Stop recording" : "Start voice recording"
                    }
                    onClick={toggleRecording}
                    disabled={!chatId || socketState.status !== "open"}
                  >
                    {isRecording ? "■" : "🎤"}
                  </button>
                  <input
                    type="text"
                    placeholder="Type your message"
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    onKeyDown={handleMessageKeyDown}
                    disabled={isSending}
                  />
                  <button
                    type="button"
                    className="control primary"
                    aria-label="Send message"
                    onClick={handleSendMessage}
                    disabled={disableSend}
                  >
                    {isSending ? "…" : "➤"}
                  </button>
                </div>
              </>
            )}
          </section>

          <aside className="history-panel card">
            <header>
              <h3>Session history</h3>
              <p>Pick a reflection to continue. Every card is clickable.</p>
            </header>
            <ul className="history-list">
              {loadingSessions && (
                <li className="history-item loading">Loading sessions…</li>
              )}

              {!loadingSessions && sessions.length === 0 && (
                <li className="history-item empty">
                  Your reflections will appear here once you start chatting.
                </li>
              )}

              {sessions.map((item) => (
                <li key={item.sessionId}>
                  <button
                    type="button"
                    className={`history-item ${
                      chatId === item.sessionId ? "active" : ""
                    }`}
                    onClick={() => handleHistoryClick(item.sessionId)}
                  >
                    <span className="history-item-title">{item.title}</span>
                    <p className="history-item-preview">
                      {formatHistoryPreview(item)}
                    </p>
                    <span className="history-item-meta">
                      {formatTimestamp(item.updatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="view-all" disabled>
              View all reflections
            </button>
          </aside>
        </div>
      </div>

      <CaseReportModal
        isOpen={isReportModalOpen}
        onClose={handleCloseReportModal}
        report={reportModalData?.report || currentReport}
        session={activeSession}
      />
    </div>
  );
};

export default TalkToAI;
