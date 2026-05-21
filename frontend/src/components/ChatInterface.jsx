import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import axios from "axios";

export default function ChatInterface({ onChatExecuted }) {
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "నమస్తే! నేను మీ కిరాణా స్టోర్ సహాయకుడిని. మీ సేల్స్ లాగ్‌లను అప్‌లోడ్ చేసి, స్టాక్ నివేదికలు, కొరతలు లేదా ఆర్డర్ల గురించి తెలుగు లేదా ఇంగ్లీషులో అడగండి.\n\n(Namaste! I am your Kirana Store Assistant. Upload your sales logs and ask me about inventory status, critical shortages, or ordering advice in Telugu or English.)",
      time: null
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const suggestPrompts = [
    { label: "What to order?", text: "What should I order this week?" },
    { label: "Critical Items", text: "Which items are critical?" },
    { label: "ఏం ఆర్డర్ చేయాలి? (Telugu)", text: "నేను ఈ వారం ఏం ఆర్డర్ చేయాలి?" },
    { label: "తక్కువ స్టాక్ ఉన్నవి? (Telugu)", text: "ఏ ఉత్పత్తులు అయిపోవచ్చాయి?" }
  ];

  const handleSend = async (textToSend) => {
    const msgText = textToSend || input;
    if (!msgText.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: msgText }]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: msgText
      });
      
      const { answer, response_time_ms } = response.data;
      
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: answer, time: response_time_ms }
      ]);

      // Notify parent to refresh metric cards (specifically the response time counter)
      if (onChatExecuted) {
        onChatExecuted();
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "I'm having trouble connecting to the store database. Please check if the backend is running.",
          time: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel bg-white rounded-2xl border border-slate-200 flex flex-col h-[550px] overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Kirana AI Assistant</h2>
          </div>
        </div>
      </div>

      {/* Suggestion Prompt Chips */}
      <div className="px-4 py-3 bg-slate-50/30 border-b border-slate-100 flex gap-2 overflow-x-auto scrollbar-none">
        {suggestPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p.text)}
            className="whitespace-nowrap px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 hover:border-purple-500/40 hover:text-purple-600 hover:bg-purple-50/5 transition-all cursor-pointer shadow-sm"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Message window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/40">
        {messages.map((m, i) => {
          const isUser = m.sender === "user";
          return (
            <div key={i} className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div
                className={`p-2 rounded-xl border flex-shrink-0 ${
                  isUser
                    ? "bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-purple-50 border border-purple-100 text-purple-600"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Text Balloon */}
              <div className="space-y-1 max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? "bg-purple-600 text-white rounded-tr-none shadow-sm"
                      : "bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none whitespace-pre-line shadow-sm"
                  }`}
                >
                  {m.text}
                </div>
                {/* Response time display removed */}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-slate-50 border border-slate-100 text-slate-500 text-sm rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 shadow-sm">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Checking stock levels...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input container */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="కిరాణా సహాయకుడిని అడగండి / Ask in Telugu, English..."
            className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-purple-500 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all disabled:opacity-40 disabled:hover:bg-purple-600 flex items-center justify-center cursor-pointer shadow-md shadow-purple-600/20"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
