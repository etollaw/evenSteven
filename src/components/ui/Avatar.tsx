'use client'

import { getInitials } from '@/lib/utils/format'
import Image from 'next/image'

interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-rose-500',
]

function getColor(name: string) {
  const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

export function Avatar({ name, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  const initials = getInitials(name)
  const colorClass = getColor(name)
  const sizeClass = sizeClasses[size]

  if (avatarUrl) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <Image
          src={avatarUrl}
          alt={name}
          width={64}
          height={64}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white ${className}`}
    >
      {initials}
    </div>
  )
}

interface AvatarGroupProps {
  members: Array<{ name: string; avatarUrl?: string | null }>
  max?: number
  size?: AvatarProps['size']
}

export function AvatarGroup({ members, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = members.slice(0, max)
  const remaining = members.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map((member, i) => (
        <Avatar
          key={i}
          name={member.name}
          avatarUrl={member.avatarUrl}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeClasses[size]} bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-semibold ring-2 ring-white`}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
