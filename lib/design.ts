// Tier styling for ชุด 1..6 (ยิ่งสูงยิ่งเก่ง)
export interface Tier {
  set: number;
  name: string;
  grad: string; // tailwind gradient
  ring: string;
  text: string;
  soft: string; // soft bg
  emoji: string;
}

export const TIERS: Tier[] = [
  { set: 1, name: "ทองแดง", grad: "from-stone-400 to-amber-700", ring: "ring-amber-700/30", text: "text-amber-800", soft: "bg-amber-50", emoji: "🥉" },
  { set: 2, name: "เงิน", grad: "from-slate-300 to-slate-500", ring: "ring-slate-400/40", text: "text-slate-700", soft: "bg-slate-50", emoji: "🥈" },
  { set: 3, name: "ทอง", grad: "from-amber-300 to-yellow-500", ring: "ring-yellow-500/40", text: "text-yellow-700", soft: "bg-yellow-50", emoji: "🥇" },
  { set: 4, name: "แพลทินัม", grad: "from-teal-300 to-emerald-500", ring: "ring-emerald-500/40", text: "text-emerald-700", soft: "bg-emerald-50", emoji: "💎" },
  { set: 5, name: "เพชร", grad: "from-sky-400 to-indigo-500", ring: "ring-indigo-500/40", text: "text-indigo-700", soft: "bg-indigo-50", emoji: "🔷" },
  { set: 6, name: "ปรมาจารย์", grad: "from-fuchsia-500 via-purple-500 to-indigo-600", ring: "ring-purple-500/50", text: "text-purple-700", soft: "bg-purple-50", emoji: "👑" },
];

export const tier = (set: number): Tier => TIERS[Math.min(Math.max(set, 1), 6) - 1];
export const gradeName = (g: number) => `ป.${g}`;
