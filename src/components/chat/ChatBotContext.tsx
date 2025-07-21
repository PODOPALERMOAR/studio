'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Definir tipos para los mensajes y el estado
export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  options?: Array<{
    label: string;
    action: string;
    metadata?: any;
  }>;
  needsInput?: boolean;
  inputPlaceholder?: string;
}

export interface ConversationState {
  currentAction?: string;
  metadata?: any;
  userInfo?: {
    name?: string;
    phone?: string;
    reason?: string;
  };
  paymentProof?: string;
}

// Definir el contexto
interface ChatBotContextType {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  conversationState: ConversationState;
  setConversationState: React.Dispatch<React.SetStateAction<ConversationState>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isInitialized: boolean;
  setIsInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  addMessage: (text: string, isBot: boolean, options?: any[], needsInput?: boolean, inputPlaceholder?: string) => void;
}

// Crear el contexto
const ChatBotContext = createContext<ChatBotContextType | undefined>(undefined);

// Proveedor del contexto
export function ChatBotProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Función para agregar mensajes
  const addMessage = (text: string, isBot: boolean, options?: any[], needsInput?: boolean, inputPlaceholder?: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      text,
      isBot,
      timestamp: new Date(),
      options,
      needsInput,
      inputPlaceholder
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <ChatBotContext.Provider value={{
      messages,
      setMessages,
      conversationState,
      setConversationState,
      isLoading,
      setIsLoading,
      isInitialized,
      setIsInitialized,
      addMessage
    }}>
      {children}
    </ChatBotContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useChatBot() {
  const context = useContext(ChatBotContext);
  if (context === undefined) {
    throw new Error('useChatBot debe ser usado dentro de un ChatBotProvider');
  }
  return context;
}