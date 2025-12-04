import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2, Eraser } from 'lucide-react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Question } from '../types';
import { createExamChatSession } from '../services/geminiService';
import MathJaxComponent from './MathJaxComponent';

interface ChatBoxProps {
  examQuestions: Question[];
}

const ChatBox: React.FC<ChatBoxProps> = ({ examQuestions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Xin chào! Thầy là trợ lý AI Toán học. Em cần thầy giúp gì về đề thi này không?'
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize/Update Chat Session when exam context changes
  useEffect(() => {
    chatSessionRef.current = createExamChatSession(examQuestions);
    // Reset chat if exam changes significantly, or maybe just keep context? 
    // Let's add a system note if questions change but keep history if user wants.
    // For simplicity, if questions change from empty to filled, we might want to notify.
    if (examQuestions.length > 0 && messages.length === 1) {
       setMessages([{
         id: 'new-context',
         role: 'model',
         text: `Thầy đã nhận được dữ liệu đề thi gồm ${examQuestions.length} câu. Em hãy hỏi về bất kỳ câu nào nhé!`
       }]);
    }
  }, [examQuestions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const botMsgId = (Date.now() + 1).toString();
    // Add placeholder bot message
    setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '', isStreaming: true }]);

    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: userMsg.text });
      
      let fullText = '';
      for await (const chunk of result) {
        const chunkText = (chunk as GenerateContentResponse).text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { ...msg, text: fullText } : msg
          ));
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, text: "Xin lỗi, có lỗi xảy ra khi kết nối. Em vui lòng thử lại." } : msg
      ));
    } finally {
      setIsStreaming(false);
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, isStreaming: false } : msg
      ));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: 'Đã xóa lịch sử trò chuyện.'
    }]);
    chatSessionRef.current = createExamChatSession(examQuestions); // Reset session history too
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-xl transition-transform hover:scale-110 flex items-center justify-center print:hidden"
        title="Hỏi trợ lý AI"
      >
        <MessageCircle size={28} />
        {examQuestions.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed z-50 bg-white rounded-t-xl lg:rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 print:hidden ${
      isMinimized 
        ? 'bottom-0 right-4 w-72 h-14 rounded-t-lg' 
        : 'bottom-0 right-0 lg:bottom-6 lg:right-6 w-full lg:w-[450px] h-[80vh] lg:h-[600px]'
    }`}>
      {/* Header */}
      <div className="bg-teal-700 text-white p-3 flex justify-between items-center cursor-pointer" onClick={() => !isMinimized && setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <h3 className="font-bold text-sm">Trợ lý AI Toán 9</h3>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => clearChat()}
            className="p-1 hover:bg-teal-600 rounded text-teal-100 hover:text-white transition-colors"
            title="Xóa đoạn chat"
          >
            <Eraser size={16} />
          </button>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-teal-600 rounded text-teal-100 hover:text-white transition-colors"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-red-500 rounded text-teal-100 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-teal-100 text-teal-700' : 'bg-white border border-slate-200 text-teal-600'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
                </div>
                
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-teal-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.isStreaming && !msg.text ? (
                    <div className="flex gap-1 items-center h-5">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    </div>
                  ) : (
                    <MathJaxComponent content={msg.text} className={msg.role === 'user' ? 'text-white' : 'text-slate-800'} />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi của bạn..."
                className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm max-h-32"
                rows={1}
                style={{ minHeight: '44px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="absolute right-2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-400 mt-2">
              AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBox;