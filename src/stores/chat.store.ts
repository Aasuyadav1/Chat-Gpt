import { create } from "zustand";

type ChatStoreType = {
   query: string;
   setQuery: (query: string) => void;
   messages: any[];
   editMessageInfo: {
    messageId: string | null;
    attachmentUrl: string | null;
    content: string | null;
   };
   setEditMessageInfo: (editMessage: {
    messageId: string;
    attachmentUrl: string;
    content: string;
   }) => void;
   setMessages: (messages: any) => void;
   isLoading: boolean;
   setIsLoading: (isLoading: boolean) => void;
   isRegenerate: boolean;
   setIsRegenerate: (isRegenerate: boolean) => void;
   isWebSearch: boolean;
   setIsWebSearch: (isWebSearch: boolean) => void;
}

const chatStore = create<ChatStoreType>((set, get) => ({
    query: "",
    setQuery: (query: string) => set({ query }),
    messages: [],
    setMessages: (messages: any) => {
        // Handle functional updates
        if (typeof messages === 'function') {
            const currentMessages = get().messages;
            const newMessages = messages(currentMessages);
            set({ messages: newMessages });
        } else {
            set({ messages });
        }
    },
    editMessageInfo: {
        messageId: null,
        attachmentUrl: null,
        content: null,
    },
    setEditMessageInfo: (editMessage: {
        messageId: string;
        attachmentUrl: string;
        content: string;
    }) => set({ editMessageInfo: editMessage }),
    isLoading: false,
    setIsLoading: (isLoading: boolean) => set({ isLoading }),
    isRegenerate: false,
    setIsRegenerate: (isRegenerate: boolean) => set({ isRegenerate }),
    isWebSearch: false,
    setIsWebSearch: (isWebSearch: boolean) => set({ isWebSearch }),
}))

export default chatStore