import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, addHours } from 'date-fns';
import { th } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export const formatDate = (d: string|Date, f='dd MMM yyyy HH:mm') => format(new Date(d), f);
export const timeAgo = (d: string|Date) => formatDistanceToNow(new Date(d), { addSuffix:true, locale:th });
export const isUpcoming = (d: string|Date) => isAfter(new Date(d), new Date());
export const isDueSoon = (d: string|Date) => {
  const t = new Date(d); const now = new Date();
  return isAfter(t,now) && !isAfter(t, addHours(now,2));
};
export const formatTHB = (n:number) => `฿${n.toLocaleString('th-TH')}`;

export const STATUS_LABEL: Record<string,string> = {
  draft:'แบบร่าง', pending:'รอดำเนินการ', scheduled:'ตั้งเวลาแล้ว',
  published:'เผยแพร่แล้ว', archived:'เก็บถาวร'
};
export const STATUS_COLOR: Record<string,string> = {
  draft:'bg-gray-100 text-gray-600', pending:'bg-yellow-100 text-yellow-700',
  scheduled:'bg-blue-100 text-blue-700', published:'bg-green-100 text-green-700',
  archived:'bg-red-100 text-red-500'
};
export const PLATFORM_ICON: Record<string,string> = {
  threads:'🧵', facebook:'📘', instagram:'📸', tiktok:'🎵', line:'💬'
};
export const CATEGORY_ICON: Record<string,string> = {
  baby:'👶', pet:'🐾', beauty:'💄', other:'📦'
};
export const CATEGORY_LABEL: Record<string,string> = {
  baby:'เด็กทารก', pet:'สัตว์เลี้ยง', beauty:'ความงาม', other:'อื่นๆ'
};
