import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  apiClient,
  getErrorMessage,
  getWebsocketBaseUrl,
  setAuthToken,
} from "../src/utils/api";
import { UserContext } from "./UserContext";

export const AiChatContext = createContext(null);

const SOCKET_STATUS = {
  IDLE: "idle",
  CONNECTING: "connecting",
  OPEN: "open",
  CLOSING: "closing",
  CLOSED: "closed",
  ERROR: "error",
};

const normalizeLanguage = (language) => {
  if (typeof language !== "string") {
    return "en";
  }

  const normalized = language.trim().toLowerCase();
  return normalized || "en";
};

const inferTitle = (session) => {
  if (session?.title && session.title.trim()) {
    return session.title.trim();
  }

  if (session?.createdAt) {
    try {
      return `SympAI check-in • ${new Date(session.createdAt).toLocaleString(
        "en-US",
        { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" }
      )}`;
    } catch (error) {
      return "SympAI check-in";
    }
  }

  const suffix =
    session?.sessionId?.slice?.(-6) || Math.random().toString(36).slice(-4);
  return `SympAI session ${suffix}`;
};

const buildSummaryFromDetail = (sessionDetail) => {
  if (!sessionDetail) return null;

  const latestMessage =
    sessionDetail.messages?.[sessionDetail.messages.length - 1];

  return {
    sessionId: sessionDetail.sessionId,
    language: sessionDetail.language || "en",
    status: sessionDetail.status || "ACTIVE",
    title: inferTitle(sessionDetail),
    preview:
      latestMessage?.text ||
      sessionDetail.summary ||
      sessionDetail.preview ||
      "",
    updatedAt: sessionDetail.updatedAt || latestMessage?.createdAt,
    createdAt: sessionDetail.createdAt,
    messageCount:
      sessionDetail.messageCount ||
      sessionDetail.messages?.length ||
      0,
  };
};

const mergeSessionSummary = (summary, existingSession) => ({
  ...existingSession,
  ...summary,
});

export const AiChatProvider = ({ children }) => {
  const { token, userData } = useContext(UserContext);
  const [sessions, setSessions] = useState([]);
  const [sessionsById, setSessionsById] = useState({});
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionLoadingState, setSessionLoadingState] = useState({});
  const [creatingSession, setCreatingSession] = useState(false);
  const [socketState, setSocketState] = useState({
    status: SOCKET_STATUS.IDLE,
    error: null,
  });
  const [error, setError] = useState(null);
  const [assistantStreams, setAssistantStreams] = useState({});
  const [reportsBySession, setReportsBySession] = useState({});
  const reportsBySessionRef = useRef({});
  const [latestReport, setLatestReport] = useState(null);

  const socketRef = useRef(null);
  const activeSessionIdRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const sessionsFetchedRef = useRef(false);
  const sessionsByIdRef = useRef({});
  const assistantStreamsRef = useRef({});
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const audioSourceRef = useRef(null);
  const audioPlayingRef = useRef(false);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);

  useEffect(() => {
    sessionsByIdRef.current = sessionsById;
  }, [sessionsById]);

  useEffect(() => {
    assistantStreamsRef.current = assistantStreams;
  }, [assistantStreams]);

  useEffect(() => {
    reportsBySessionRef.current = reportsBySession;
  }, [reportsBySession]);

  const upsertSessionDetail = useCallback((sessionDetail) => {
    if (!sessionDetail?.sessionId) {
      return;
    }

    const summary = buildSummaryFromDetail(sessionDetail);

    setSessionsById((prev) => ({
      ...prev,
      [sessionDetail.sessionId]: sessionDetail,
    }));

    setSessions((prev) => {
      if (!summary) return prev;
      const filtered = prev.filter(
        (item) => item.sessionId !== summary.sessionId
      );
      return [summary, ...filtered];
    });
  }, []);

  const updateAssistantStream = useCallback((sessionId, updater) => {
    if (!sessionId || typeof updater !== "function") return;

    setAssistantStreams((prev) => {
      const current = prev[sessionId] || null;
      const nextEntry = updater(current);

      if (nextEntry === current) {
        return prev;
      }

      const nextState = { ...prev };

      if (nextEntry === undefined || nextEntry === null) {
        delete nextState[sessionId];
      } else {
        nextState[sessionId] = nextEntry;
      }

      assistantStreamsRef.current = nextState;
      return nextState;
    });
  }, []);

  const clearAssistantStreams = useCallback(() => {
    assistantStreamsRef.current = {};
    setAssistantStreams({});
  }, []);

  const stopCurrentAudioSource = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (error) {
        // Safari throws if source already stopped; ignore.
      }

      try {
        audioSourceRef.current.disconnect();
      } catch (error) {
        // Ignore disconnect errors.
      }

      audioSourceRef.current = null;
    }
    audioPlayingRef.current = false;
    setAssistantSpeaking(false);
  }, []);

  const playQueuedAudio = useCallback(() => {
    const audioCtx = audioContextRef.current;
    const queue = audioQueueRef.current;

    if (!audioCtx || !queue.length) {
      stopCurrentAudioSource();
      return;
    }

    const { buffer } = queue.shift();
    if (!buffer) {
      stopCurrentAudioSource();
      if (queue.length) {
        playQueuedAudio();
      }
      return;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.onended = () => {
      audioPlayingRef.current = false;
      audioSourceRef.current = null;
      setAssistantSpeaking(false);
      if (audioQueueRef.current.length) {
        playQueuedAudio();
      }
    };

    audioSourceRef.current = source;
    audioPlayingRef.current = true;
    setAssistantSpeaking(true);

    try {
      source.start();
    } catch (error) {
      console.error("Failed to start audio playback:", error);
      audioPlayingRef.current = false;
      audioSourceRef.current = null;
      setAssistantSpeaking(false);
      if (audioQueueRef.current.length) {
        playQueuedAudio();
      }
    }
  }, [stopCurrentAudioSource]);

  const ensureAudioContext = useCallback(async () => {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextCtor =
      window.AudioContext || window.webkitAudioContext || null;

    if (!AudioContextCtor) {
      console.warn("Web Audio API is not supported in this browser.");
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    const audioCtx = audioContextRef.current;
    if (audioCtx.state === "suspended") {
      try {
        await audioCtx.resume();
      } catch (error) {
        console.warn("Failed to resume AudioContext:", error);
      }
    }

    return audioCtx;
  }, []);

  const enqueueAudioChunk = useCallback(
    async (binaryPayload) => {
      try {
        const audioCtx = await ensureAudioContext();
        if (!audioCtx) {
          return;
        }

        const arrayBuffer =
          binaryPayload instanceof ArrayBuffer
            ? binaryPayload
            : await binaryPayload.arrayBuffer();

        const audioBuffer = await new Promise((resolve, reject) => {
          audioCtx.decodeAudioData(arrayBuffer, resolve, reject);
        });

        audioQueueRef.current.push({ buffer: audioBuffer });

        if (!audioPlayingRef.current) {
          playQueuedAudio();
        }
      } catch (error) {
        console.error("Failed to enqueue audio chunk:", error);
      }
    },
    [ensureAudioContext, playQueuedAudio]
  );

  const resetAudioPlayback = useCallback(() => {
    stopCurrentAudioSource();
    audioQueueRef.current = [];
    audioPlayingRef.current = false;
  }, [stopCurrentAudioSource]);

  const storeReportForSession = useCallback((sessionId, report) => {
    if (!sessionId || !report) {
      return;
    }

    setReportsBySession((prev) => {
      const next = {
        ...prev,
        [sessionId]: report,
      };
      reportsBySessionRef.current = next;
      return next;
    });

    setLatestReport({
      sessionId,
      report,
      receivedAt: Date.now(),
    });
  }, []);

const acknowledgeLatestReport = useCallback(() => {
  setLatestReport(null);
}, []);

  useEffect(() => {
    setAuthToken(token || "");

    if (!token) {
      setSessions([]);
      setSessionsById({});
      sessionsByIdRef.current = {};
      setAssistantStreams({});
      assistantStreamsRef.current = {};
      resetAudioPlayback();
      sessionsFetchedRef.current = false;
      if (socketRef.current) {
        socketRef.current.close(1000, "auth-lost");
      }
    }
  }, [resetAudioPlayback, token]);

  const updateSessionWithMessage = useCallback((sessionId, message) => {
    if (!sessionId || !message) return;

    let updatedSession = null;

    setSessionsById((prev) => {
      const existing = prev[sessionId] || {
        sessionId,
        language: message.language || "en",
        status: "ACTIVE",
        createdAt: message.createdAt,
        updatedAt: message.createdAt,
        messages: [],
      };

      const alreadyExists = existing.messages?.some(
        (item) => item.messageId === message.messageId
      );

      if (alreadyExists) {
        updatedSession = existing;
        return prev;
      }

      const messages = [...(existing.messages || []), message];
      updatedSession = {
        ...existing,
        messages,
        messageCount: messages.length,
        updatedAt: message.createdAt,
        summary:
          message.role === "assistant"
            ? message.text
            : existing.summary,
      };

      return {
        ...prev,
        [sessionId]: updatedSession,
      };
    });

    if (updatedSession) {
      const summary = buildSummaryFromDetail(updatedSession);
      if (summary) {
        setSessions((prev) => {
          const filtered = prev.filter(
            (item) => item.sessionId !== sessionId
          );
          return [summary, ...filtered];
        });
      }
    }

    if (
      message.role === "assistant" &&
      message.payload?.streamId
    ) {
      updateAssistantStream(sessionId, (existing) => {
        if (!existing) return null;
        if (existing.messageId && existing.messageId !== message.payload.streamId) {
          return existing;
        }
        return null;
      });
    }
  }, [updateAssistantStream]);

  const loadSessions = useCallback(async () => {
    if (!token || loadingSessions) return;

    setLoadingSessions(true);
    setError(null);

    try {
      const { data } = await apiClient.get("/api/sessions");

      if (!data.success) {
        throw new Error(data.message || "Failed to load sessions.");
      }

      setSessions(data.sessions);
      setSessionsById((prev) => {
        const next = { ...prev };
        data.sessions.forEach((summary) => {
          const existing = prev[summary.sessionId];
          next[summary.sessionId] = mergeSessionSummary(
            summary,
            existing || { messages: [] }
          );
        });
        return next;
      });

      sessionsFetchedRef.current = true;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoadingSessions(false);
    }
  }, [loadingSessions, token]);

  const fetchSessionById = useCallback(
    async (sessionId, { force = false } = {}) => {
      if (!token || !sessionId) return null;

      const existing = sessionsByIdRef.current[sessionId];
      if (existing?.messages?.length && !force) {
        return existing;
      }

      setSessionLoadingState((prev) => ({
        ...prev,
        [sessionId]: true,
      }));

      try {
        const { data } = await apiClient.get(`/api/sessions/${sessionId}`);

        if (!data.success) {
          throw new Error(data.message || "Unable to fetch session.");
        }

        upsertSessionDetail(data.session);
        return data.session;
      } catch (err) {
        const message = getErrorMessage(err);
        toast.error(message);
        throw err;
      } finally {
        setSessionLoadingState((prev) => ({
          ...prev,
          [sessionId]: false,
        }));
      }
    },
    [token, upsertSessionDetail]
  );

  const createSession = useCallback(
    async ({ language = "en", title } = {}) => {
      if (!token) {
        toast.error("Please log in to start a chat.");
        return null;
      }

      if (creatingSession) {
        return null;
      }

      setCreatingSession(true);
      setError(null);

      try {
        const payload = {
          language: normalizeLanguage(language),
        };

        if (typeof title === "string" && title.trim()) {
          payload.title = title.trim();
        }

        const { data } = await apiClient.post("/api/sessions", payload);

        if (!data.success) {
          throw new Error(data.message || "Failed to create session.");
        }

        const summary = {
          sessionId: data.sessionId,
          language: data.language,
          status: data.status,
          title: inferTitle({
            title,
            sessionId: data.sessionId,
            createdAt: data.createdAt,
          }),
          preview: "",
          updatedAt: data.createdAt,
          createdAt: data.createdAt,
          messageCount: 0,
        };

        setSessions((prev) => [summary, ...prev]);
        setSessionsById((prev) => ({
          ...prev,
          [data.sessionId]: {
            ...summary,
            messages: [],
          },
        }));

        return summary;
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setCreatingSession(false);
      }
    },
    [creatingSession, token]
  );

  const scheduleReconnect = useCallback(
    (sessionId, language) => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      reconnectTimerRef.current = setTimeout(() => {
        connectToSession(sessionId, { language, retry: true });
      }, 2000);
    },
    []
  );

  const disconnectSocket = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (socketRef.current) {
      try {
        socketRef.current.close(1000, "manual-close");
      } catch (error) {
        console.warn("Error closing socket:", error);
      }
    }

    socketRef.current = null;
    activeSessionIdRef.current = null;
    clearAssistantStreams();
    resetAudioPlayback();
    setSocketState({ status: SOCKET_STATUS.CLOSED, error: null });
  }, [clearAssistantStreams, resetAudioPlayback]);

  const handleSocketMessage = useCallback(
    (event) => {
      try {
        if (typeof event.data !== "string") {
          enqueueAudioChunk(event.data);
          return;
        }

        const payload = JSON.parse(event.data);
        switch (payload.type) {
          case "session_snapshot": {
            upsertSessionDetail(payload.session);
            break;
          }
          case "assistant_stream_start": {
            resetAudioPlayback();
            updateAssistantStream(payload.sessionId, () => ({
              messageId: payload.messageId,
              text: "",
              retrievals: [],
              language: normalizeLanguage(payload.language),
              startedAt: Date.now(),
              lastChunkAt: Date.now(),
              isComplete: false,
            }));
            break;
          }
          case "assistant_stream_delta": {
            updateAssistantStream(payload.sessionId, (existing) => {
              if (
                !existing ||
                (payload.messageId && existing.messageId !== payload.messageId)
              ) {
                return existing;
              }

              return {
                ...existing,
                text: `${existing.text || ""}${payload.delta || ""}`,
                lastChunkAt: Date.now(),
              };
            });
            break;
          }
          case "assistant_stream_retrieval": {
            updateAssistantStream(payload.sessionId, (existing) => {
              const retrievals = Array.isArray(payload.documents)
                ? payload.documents
                : [];

              if (!existing) {
                return {
                  messageId: payload.messageId,
                  text: "",
                  retrievals,
                  language: "en",
                  startedAt: Date.now(),
                  lastChunkAt: Date.now(),
                  isComplete: false,
                };
              }

              if (
                payload.messageId &&
                existing.messageId !== payload.messageId
              ) {
                return existing;
              }

              return {
                ...existing,
                retrievals,
                lastChunkAt: Date.now(),
              };
            });
            break;
          }
          case "assistant_stream_complete": {
            updateAssistantStream(payload.sessionId, (existing) => {
              if (
                !existing ||
                (payload.messageId && existing.messageId !== payload.messageId)
              ) {
                return existing;
              }

              return {
                ...existing,
                text: payload.text ?? existing.text ?? "",
                retrievals: Array.isArray(payload.retrievals)
                  ? payload.retrievals
                  : existing.retrievals,
                lastChunkAt: Date.now(),
                isComplete: true,
              };
            });
            break;
          }
          case "assistant_stream_cancelled": {
            updateAssistantStream(payload.sessionId, (existing) => {
              if (
                !existing ||
                (payload.messageId && existing.messageId !== payload.messageId)
              ) {
                return existing;
              }
              return null;
            });
            break;
          }
          case "assistant_stream_error": {
            if (payload.error) {
              toast.error(payload.error);
            }

            updateAssistantStream(payload.sessionId, (existing) => {
              if (
                !existing ||
                (payload.messageId && existing.messageId !== payload.messageId)
              ) {
                return existing;
              }
              return null;
            });
            break;
          }
          case "assistant_audio_error": {
            if (payload.error) {
              toast.error(payload.error);
            }
            break;
          }
          case "report_ready": {
            if (payload.report) {
              storeReportForSession(payload.sessionId, payload.report);
              toast.success("Consultation summary is ready.");
            }
            break;
          }
          case "assistant_stream_metadata": {
            // Metadata messages currently unused on the client.
            break;
          }
          case "chat_message": {
            updateSessionWithMessage(payload.sessionId, payload.message);
            break;
          }
          case "consultation_status": {
            setSessionsById((prev) => {
              const existing = prev[payload.sessionId];
              if (!existing) return prev;
              const updated = {
                ...existing,
                status: payload.status,
              };
              return {
                ...prev,
                [payload.sessionId]: updated,
              };
            });
            setSessions((prev) =>
              prev.map((item) =>
                item.sessionId === payload.sessionId
                  ? { ...item, status: payload.status }
                  : item
              )
            );

            if (payload.report) {
              storeReportForSession(payload.sessionId, payload.report);
            }
            break;
          }
          case "error": {
            toast.error(payload.message || "Realtime error.");
            break;
          }
          case "pong":
          case "ack":
          default:
            break;
        }
      } catch (error) {
        console.error("Failed to parse websocket event:", error);
      }
    },
    [
      enqueueAudioChunk,
      resetAudioPlayback,
      storeReportForSession,
      updateAssistantStream,
      updateSessionWithMessage,
      upsertSessionDetail,
    ]
  );

  const connectToSession = useCallback(
    async (sessionId, { language, retry = false } = {}) => {
      if (!sessionId || !token) return;

      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN &&
        activeSessionIdRef.current === sessionId
      ) {
        return;
      }

      disconnectSocket();

      try {
        const baseUrl = getWebsocketBaseUrl();
        const wsUrl = new URL("/ws", baseUrl);
        wsUrl.searchParams.set("token", token);
        wsUrl.searchParams.set("sessionId", sessionId);
        wsUrl.searchParams.set(
          "language",
          normalizeLanguage(language || sessionsByIdRef.current[sessionId]?.language)
        );
        if (userData?._id) {
          wsUrl.searchParams.set("user", userData._id);
        }

        const ws = new WebSocket(wsUrl.toString());
        ws.binaryType = "arraybuffer";
        socketRef.current = ws;
        activeSessionIdRef.current = sessionId;

        setSocketState({ status: SOCKET_STATUS.CONNECTING, error: null });

        ws.onopen = () => {
          setSocketState({ status: SOCKET_STATUS.OPEN, error: null });
        };

        ws.onmessage = handleSocketMessage;

        ws.onerror = (event) => {
          console.error("WebSocket error:", event);
          setSocketState({
            status: SOCKET_STATUS.ERROR,
            error: "Realtime connection error.",
          });
        };

        ws.onclose = (event) => {
          const shouldRetry =
            token &&
            !retry &&
            event.code !== 1000 &&
            event.reason !== "manual-close" &&
            event.reason !== "auth-lost";

          setSocketState({
            status: SOCKET_STATUS.CLOSED,
            error:
              event.code === 4401
                ? "Realtime authentication failed."
                : null,
          });

          if (shouldRetry) {
            scheduleReconnect(sessionId, language);
          }
        };
      } catch (error) {
        console.error("Failed to open websocket:", error);
        setSocketState({
          status: SOCKET_STATUS.ERROR,
          error: error.message,
        });
        toast.error("Unable to open realtime connection.");
      }
    },
    [
      token,
      userData?._id,
      disconnectSocket,
      handleSocketMessage,
      scheduleReconnect,
    ]
  );

  const sendRealtimeMessage = useCallback((sessionId, text) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast.error("Connection not ready. Please try again.");
      return;
    }

    if (activeSessionIdRef.current !== sessionId) {
      toast.error("You're not connected to this session yet.");
      return;
    }

    if (!text || !text.trim()) {
      toast.error("Write a message before sending.");
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "user_text",
        text: text.trim(),
      })
    );
  }, []);

  const beginAudioStream = useCallback((sessionId) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast.error("Connection not ready. Please try again.");
      return;
    }

    if (activeSessionIdRef.current !== sessionId) {
      toast.error("You're not connected to this session yet.");
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "user_audio_chunk_start",
      })
    );
  }, []);

  const sendAudioChunk = useCallback(async (sessionId, blob) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    if (activeSessionIdRef.current !== sessionId) {
      return;
    }

    if (!blob || blob.size === 0) {
      return;
    }

    try {
      const arrayBuffer = await blob.arrayBuffer();
      socketRef.current.send(arrayBuffer);
    } catch (error) {
      console.error("Failed to stream audio chunk:", error);
      toast.error("Unable to send audio chunk.");
    }
  }, []);

  const endAudioStream = useCallback((sessionId) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    if (activeSessionIdRef.current !== sessionId) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "user_audio_chunk_end",
      })
    );
  }, []);

  const endSession = useCallback((sessionId) => {
    if (
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN &&
      activeSessionIdRef.current === sessionId
    ) {
      socketRef.current.send(
        JSON.stringify({
          type: "end_consultation",
        })
      );
    }
  }, []);

  useEffect(() => {
    if (token && !sessionsFetchedRef.current) {
      loadSessions();
    }
  }, [loadSessions, token]);

  useEffect(() => {
    return () => {
      disconnectSocket();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      resetAudioPlayback();
    };
  }, [disconnectSocket, resetAudioPlayback]);

  const contextValue = useMemo(
    () => ({
      sessions,
      sessionsById,
      loadingSessions,
      sessionLoadingState,
      creatingSession,
      error,
      socketState,
      loadSessions,
      fetchSessionById,
      createSession,
      connectToSession,
      disconnectSocket,
      sendRealtimeMessage,
      beginAudioStream,
      sendAudioChunk,
      endAudioStream,
      endSession,
      getSession: (id) => sessionsById[id] || null,
      activeAssistantStreams: assistantStreams,
      getStreamingReply: (id) => assistantStreamsRef.current[id] || null,
      reportsBySession,
      getReport: (id) => reportsBySessionRef.current[id] || null,
      latestReport,
      acknowledgeLatestReport,
      assistantSpeaking,
    }),
    [
      sessions,
      sessionsById,
      loadingSessions,
      sessionLoadingState,
      creatingSession,
      error,
      socketState,
      loadSessions,
      fetchSessionById,
      createSession,
      connectToSession,
      disconnectSocket,
      sendRealtimeMessage,
      beginAudioStream,
      sendAudioChunk,
      endAudioStream,
      endSession,
      assistantStreams,
      reportsBySession,
      latestReport,
      acknowledgeLatestReport,
      assistantSpeaking,
    ]
  );

  return (
    <AiChatContext.Provider value={contextValue}>
      {children}
    </AiChatContext.Provider>
  );
};

export const useAiChat = () => {
  const context = useContext(AiChatContext);

  if (!context) {
    throw new Error("useAiChat must be used within an AiChatProvider");
  }

  return context;
};

