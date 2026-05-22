import { formatDistanceToNow, format } from 'date-fns'
import { ExpenseCategory } from '@/lib/types/database'

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { label: string; emoji: string; color: string }
> = {
  food: { label: 'Food & Drink', emoji: '🍔', color: 'bg-orange-100 text-orange-700' },
  transport: { label: 'Transport', emoji: '🚗', color: 'bg-blue-100 text-blue-700' },
  accommodation: { label: 'Accommodation', emoji: '🏠', color: 'bg-purple-100 text-purple-700' },
  entertainment: { label: 'Entertainment', emoji: '🎉', color: 'bg-pink-100 text-pink-700' },
  utilities: { label: 'Utilities', emoji: '💡', color: 'bg-yellow-100 text-yellow-700' },
  shopping: { label: 'Shopping', emoji: '🛍️', color: 'bg-green-100 text-green-700' },
  health: { label: 'Health', emoji: '💊', color: 'bg-red-100 text-red-700' },
  other: { label: 'Other', emoji: '📦', color: 'bg-gray-100 text-gray-700' },
}

export const GROUP_EMOJIS = ['💰', '🏖️', '🏠', '🍕', '✈️', '🎉', '🚗', '🎮', '🏋️', '📚', '🛒', '🎸']
