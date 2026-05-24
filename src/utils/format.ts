export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(
  value: string | null | undefined,
  fallback = "—",
): string {
  if (!value) return fallback;
  return value.slice(0, 10);
}

export function formatDateTime(
  value: string | null | undefined,
  fallback = "—",
): string {
  if (!value) return fallback;
  const d = new Date(value);
  const date = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }); // HH:MM
  return `${date} ${time}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
