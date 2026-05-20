import { useTranslation } from "react-i18next";
import type { ConversationDTO } from "@/api/chat.api";
import { Avatar } from "./Avatar";
import { timeLabel, resolveConvName } from "../utils";

interface ConvListProps {
  conversations: ConversationDTO[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  loading: boolean;
  currentUserId: number | undefined;
  userMap: Record<number, string>;
  convMembers: Record<number, number[]>;
  unreadCounts: Record<number, number>;
  mutedIds: number[];
}

export function ConvList({
  conversations,
  activeId,
  onSelect,
  onNew,
  loading,
  currentUserId,
  userMap,
  convMembers,
  unreadCounts,
  mutedIds,
}: ConvListProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h1 className="font-bold text-slate-800 text-base">
          {t("chat.title")}
        </h1>
        <button
          onClick={onNew}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 border-0 cursor-pointer"
          title={t("chat.newConversation")}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center text-slate-400 text-sm py-10">
            {t("common.loading")}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-10">
            {t("chat.noConversations")}
          </div>
        ) : (
          conversations.map((c) => {
            const cName = resolveConvName(
              c,
              convMembers,
              userMap,
              currentUserId,
            );
            const isMe = c.lastMessage?.senderId === currentUserId;
            const senderName =
              !isMe && c.lastMessage
                ? (userMap[c.lastMessage.senderId] ?? null)
                : null;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-0 cursor-pointer transition-colors ${
                  c.id === activeId
                    ? "bg-indigo-50"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                <Avatar name={cName} src={c.avatar} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-sm truncate ${unreadCounts[c.id] > 0 ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}
                    >
                      {cName}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {mutedIds.includes(c.id) ? (
                        <svg
                          className="w-3 h-3 text-slate-400 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-5" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        unreadCounts[c.id] > 0 && (
                          <span className="text-[10px] bg-indigo-600 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
                            {unreadCounts[c.id] > 99
                              ? "99+"
                              : unreadCounts[c.id]}
                          </span>
                        )
                      )}
                      {c.lastMessage && (
                        <span className="text-[11px] text-slate-400">
                          {timeLabel(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.lastMessage && (
                    <p className="text-xs text-slate-500 truncate">
                      {isMe
                        ? `${t("chat.you")}: `
                        : senderName
                          ? `${senderName}: `
                          : ""}
                      {c.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
