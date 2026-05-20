import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "../store";
import { usersApi } from "@/api/users.api";
import type { SysUserDTO } from "@/api/users.api";
import type { ConversationDTO } from "@/api/chat.api";
import { Avatar } from "./Avatar";

interface NewConvModalProps {
  onClose: () => void;
  onCreated: (conv: ConversationDTO) => void;
}

export function NewConvModal({ onClose, onCreated }: NewConvModalProps) {
  const { t } = useTranslation();
  const store = useChatStore();
  const [users, setUsers] = useState<SysUserDTO[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<"DIRECT" | "GROUP">("DIRECT");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersApi.getAll(1, 100).then((res) => setUsers(res.data));
  }, []);

  function toggle(id: number) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }

  async function submit() {
    if (selected.length === 0) return;
    if (type === "GROUP" && !name.trim()) return;
    setSaving(true);
    try {
      const conv = await store.createConversation({
        type,
        name: type === "GROUP" ? name || undefined : undefined,
        memberIds: selected,
      });
      onCreated(conv);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            {t("chat.newConversation")}
          </h2>
          <button
            className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-1"
            onClick={onClose}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2">
          {(["DIRECT", "GROUP"] as const).map((t2) => (
            <button
              key={t2}
              onClick={() => {
                setType(t2);
                setSelected([]);
              }}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                type === t2
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
              }`}
            >
              {t2 === "DIRECT" ? t("chat.direct") : t("chat.group")}
            </button>
          ))}
        </div>

        {type === "GROUP" && (
          <div className="flex flex-col gap-1">
            <input
              type="text"
              placeholder={t("chat.groupNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`h-9 px-3 border rounded-lg text-sm outline-none focus:border-indigo-500 ${
                !name.trim() ? "border-red-300 bg-red-50" : "border-slate-200"
              }`}
            />
            {!name.trim() && (
              <span className="text-xs text-red-500">
                {t("chat.groupNameRequired")}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {users.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <input
                type={type === "DIRECT" ? "radio" : "checkbox"}
                name="user"
                checked={selected.includes(u.id)}
                onChange={() => {
                  if (type === "DIRECT") setSelected([u.id]);
                  else toggle(u.id);
                }}
                className="accent-indigo-600"
              />
              <Avatar name={u.name} size="sm" />
              <span className="text-sm text-slate-700">{u.name}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={
              selected.length === 0 ||
              saving ||
              (type === "GROUP" && !name.trim())
            }
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer border-0"
          >
            {saving ? t("common.saving") : t("chat.start")}
          </button>
        </div>
      </div>
    </div>
  );
}
