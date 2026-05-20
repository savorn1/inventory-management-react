import { useTranslation } from "react-i18next";
import { Avatar } from "./Avatar";

interface MembersPanelProps {
  memberIds: number[];
  userMap: Record<number, string>;
  currentUserId: number | undefined;
  onClose: () => void;
}

export function MembersPanel({
  memberIds,
  userMap,
  currentUserId,
  onClose,
}: MembersPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="w-56 shrink-0 border-l border-slate-100 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-700">
          {t("chat.members")} ({memberIds.length})
        </span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {memberIds.map((id) => {
          const name = userMap[id] ?? `User #${id}`;
          const isMe = id === currentUserId;
          return (
            <div
              key={id}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50"
            >
              <Avatar name={name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-700 truncate">{name}</div>
                {isMe && (
                  <div className="text-[10px] text-indigo-500 font-medium">
                    {t("chat.you")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
