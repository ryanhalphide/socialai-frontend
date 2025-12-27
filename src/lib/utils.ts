import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    instagram: 'from-purple-500 via-pink-500 to-orange-500',
    facebook: 'bg-blue-600',
    x: 'bg-black',
    linkedin: 'bg-blue-700',
    tiktok: 'bg-black',
    youtube: 'bg-red-600',
    pinterest: 'bg-red-700',
    threads: 'bg-black',
  };
  return colors[platform] || 'bg-gray-500';
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    x: 'Twitter',
    linkedin: 'Linkedin',
    tiktok: 'Music2',
    youtube: 'Youtube',
    pinterest: 'Pin',
    threads: 'AtSign',
  };
  return icons[platform] || 'Globe';
}
