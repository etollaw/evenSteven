'use client'

import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, formatCurrency } from '@/lib/utils/format'
import { Receipt, UserPlus, ArrowRightLeft, Trash2, Users } from 'lucide-react'

interface ActivityItem {
  id: string
  group_id: string
  user_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
  profiles: { id: string; name: string; avatar_url: string | null } | null
}

interface ActivityFeedProps {
  activity: ActivityItem[]
  members: Array<{ userId: string; name: string; avatarUrl: string | null }>
}

function getActionConfig(action: string, metadata: Record<string, unknown>) {
  switch (action) {
    case 'expense_added':
      return {
        icon: <Receipt size={14} />,
        color: 'bg-blue-100 text-blue-600',
        text: `added expense "${metadata.description}" for ${formatCurrency(Number(metadata.amount))}`,
      }
    case 'expense_deleted':
      return {
        icon: <Trash2 size={14} />,
        color: 'bg-red-100 text-red-500',
        text: `deleted expense "${metadata.description}"`,
      }
    case 'settlement_added':
      return {
        icon: <ArrowRightLeft size={14} />,
        color: 'bg-emerald-100 text-emerald-600',
        text: `marked a payment of ${formatCurrency(Number(metadata.amount))} as settled`,
      }
    case 'member_joined':
      return {
        icon: <UserPlus size={14} />,
        color: 'bg-violet-100 text-violet-600',
        text: 'joined the group',
      }
    case 'group_created':
      return {
        icon: <Users size={14} />,
        color: 'bg-amber-100 text-amber-600',
        text: 'created the group',
      }
    default:
      return {
        icon: <Receipt size={14} />,
        color: 'bg-gray-100 text-gray-500',
        text: action,
      }
  }
}

export function ActivityFeed({ activity, members }: ActivityFeedProps) {
  if (activity.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-1">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gray-100" />

        <div className="space-y-3">
          {activity.map((item) => {
            const config = getActionConfig(item.action, item.metadata as Record<string, unknown>)
            const actor = item.profiles || members.find((m) => m.userId === item.user_id)
            const actorName = item.profiles?.name || members.find((m) => m.userId === item.user_id)?.name || 'Someone'

            return (
              <div key={item.id} className="flex gap-3 relative">
                {/* Avatar */}
                <div className="flex-shrink-0 z-10">
                  <Avatar
                    name={actorName}
                    avatarUrl={item.profiles?.avatar_url}
                    size="sm"
                  />
                </div>

                <div className="flex-1 bg-white rounded-xl border border-gray-100 px-4 py-3 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-wrap">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${config.color}`}>
                        {config.icon}
                      </div>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">{actorName.split(' ')[0]}</span>{' '}
                        {config.text}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
