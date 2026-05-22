'use client'

import { Group } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils/format'
import { Users, ChevronRight } from 'lucide-react'

interface GroupCardProps {
  group: Group
  memberCount: number
  totalExpenses: number
  onClick: () => void
}

export function GroupCard({ group, memberCount, totalExpenses, onClick }: GroupCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all text-left group w-full active:scale-[0.98]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-2xl">
          {group.emoji}
        </div>
        <ChevronRight
          size={18}
          className="text-gray-300 group-hover:text-violet-400 transition-colors mt-1"
        />
      </div>

      <h3 className="font-semibold text-gray-900 mb-1 truncate">{group.name}</h3>
      {group.description && (
        <p className="text-sm text-gray-400 mb-3 truncate">{group.description}</p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
          <Users size={14} />
          <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
        </div>
        <span className="text-sm font-semibold text-gray-700">{formatCurrency(totalExpenses)}</span>
      </div>
    </button>
  )
}
