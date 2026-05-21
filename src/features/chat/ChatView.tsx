import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/hooks/useToast";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useChatStore } from "./store";
import type { MessageDTO } from "@/api/chat.api";
import type { TypingEvent } from "@/hooks/useChatSocket";
import { ConvList } from "./components/ConvList";
import { MsgPanel } from "./components/MsgPanel";
import { NewConvModal } from "./components/NewConvModal";

export function ChatView() {
  const store = useChatStore();
  const auth = useAuthStore();
  const toast = useToastStore();
  const [showNewConv, setShowNewConv] = useState(false);
  const [showMobileConvList, setShowMobileConvList] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserIdRef = useRef(auth.profile?.id);

  const currentUserId = auth.profile?.id;
  const convIds = useMemo(
    () => store.conversations.map((c) => c.id),
    [store.conversations],
  );

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const handleMessage = useCallback((msg: MessageDTO) => {
    store.addRealtimeMessage(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTypingEvent = useCallback((event: TypingEvent) => {
    if (event.userId === currentUserIdRef.current) return;
    if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
    if (event.typing) {
      setIsTyping(true);
      typingClearTimer.current = setTimeout(() => setIsTyping(false), 3000);
    } else {
      typingClearTimer.current = null;
      setIsTyping(false);
    }
  }, []);

  const { connected, sendTyping } = useChatSocket(
    store.activeId,
    convIds,
    handleMessage,
    handleTypingEvent,
  );

  useEffect(() => {
    store.fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll conversation list every 30s to catch updates from users in other sessions
  useEffect(() => {
    const id = setInterval(() => store.fetchConversations(), 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll active conversation messages every 10s when WebSocket is disconnected
  useEffect(() => {
    if (connected || !store.activeId) return;
    const id = setInterval(() => store.fetchMessages(1), 10_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, store.activeId]);

  useEffect(() => {
    function check() {
      const now = Date.now();
      for (const r of store.reminders) {
        if (r.remindAt <= now) {
          toast.add(`🔔 ${r.preview || "…"}`, "info", 8000);
          store.dismissReminder(r.id);
        }
      }
    }
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [store.reminders, store, toast]);

  const activeConv = store.conversations.find((c) => c.id === store.activeId);

  async function handleSelect(id: number) {
    setIsTyping(false);
    await store.selectConversation(id);
    setShowMobileConvList(false);
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      <div
        className={`w-full md:w-72 lg:w-80 border-r border-slate-100 bg-white shrink-0 flex flex-col ${showMobileConvList ? "flex" : "hidden md:flex"}`}
      >
        <ConvList
          conversations={store.conversations}
          activeId={store.activeId}
          onSelect={handleSelect}
          onNew={() => setShowNewConv(true)}
          loading={store.loadingConv}
          currentUserId={currentUserId}
          userMap={store.userMap}
          convMembers={store.convMembers}
          unreadCounts={store.unreadCounts}
          mutedIds={store.mutedIds}
        />
      </div>

      <div
        className={`flex-1 flex flex-col min-w-0 ${showMobileConvList && !store.activeId ? "hidden md:flex" : "flex"}`}
      >
        {store.activeId && (
          <button
            className="md:hidden flex items-center gap-1.5 px-4 py-2 text-sm text-indigo-600 bg-white border-b border-slate-100 border-0 cursor-pointer"
            onClick={() => setShowMobileConvList(true)}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
        )}
        <MsgPanel
          conversation={activeConv}
          messages={store.messages}
          loading={store.loadingMsgs}
          hasMore={store.hasMore}
          connected={connected}
          isTyping={isTyping}
          currentUserId={currentUserId}
          userMap={store.userMap}
          convMembers={store.convMembers}
          onLoadMore={() => store.fetchMessages(store.msgPage + 1)}
          onSend={store.sendMessage}
          onTyping={sendTyping}
          onEdit={store.editMessage}
          onDelete={store.deleteMessage}
          isMuted={
            store.activeId !== null && store.mutedIds.includes(store.activeId)
          }
          onToggleMute={() =>
            store.activeId !== null && store.toggleMute(store.activeId)
          }
        />
      </div>

      {showNewConv && (
        <NewConvModal
          onClose={() => setShowNewConv(false)}
          onCreated={(conv) => {
            setShowNewConv(false);
            handleSelect(conv.id);
          }}
        />
      )}
    </div>
  );
}
