import { initials } from "@/utils/format";

interface AvatarProps {
  name: string;
  size?: "sm" | "md";
  src?: string | null;
}

export function Avatar({ name, size = "md", src }: AvatarProps) {
  const cls = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${cls} rounded-full object-cover shrink-0`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className={`${cls} rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold shrink-0`}
    >
      {initials(name || "?")}
    </div>
  );
}
