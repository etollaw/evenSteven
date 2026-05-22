'use client'

import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, CATEGORY_CONFIG } from '@/lib/utils/format'
import { ExpenseCategory } from '@/lib/types/database'

interface ExpenseCardProps {
  expense: {
    id: string
    description: string
    amount: number
    payer_id: string
    category: ExpenseCategory
    expense_date: string
    created_at: string
    profiles: { id: string; name: string; avatar_url: string | null }
    splits: Array<{
      id: string
      user_id: string
      amount_owed: number
      profiles: { id: string; name: string; avatar_url: string | null }
    }>
  }
  currentUserId: string
  onDelete: (id: string) => Promise<void>
}

export function ExpenseCard({ expense, currentUserId, onDelete }: ExpenseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const categoryConfig = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other
  const isPayer = expense.payer_id === currentUserId
  const mySplit = expense.splits.find((s) => s.user_id === currentUserId)
  const myOwed = mySplit ? Number(mySplit.amount_owed) : 0
  const iLent = isPayer ? Number(expense.amount) - myOwed : 0
  const netForMe = isPayer ? iLent : -myOwed

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    await onDelete(expense.id)
    setDeleting(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Category icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${categoryConfig.color}`}>
            {categoryConfig.emoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{expense.description}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{formatDate(expense.expense_date)}</span>
                  <span className="text-gray-200">·</span>
                  <div className="flex items-center gap-1">
                    <Avatar
                      name={expense.profiles?.name || 'Unknown'}
                      avatarUrl={expense.profiles?.avatar_url}
                      size="xs"
                    />
                    <span className="text-xs text-gray-400">
                      {isPayer ? 'You paid' : `${expense.profiles?.name?.split(' ')[0]} paid`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900">{formatCurrency(Number(expense.amount))}</p>
                <Badge
                  variant={netForMe > 0 ? 'success' : netForMe < 0 ? 'danger' : 'neutral'}
                  size="sm"
                >
                  {netForMe > 0
                    ? `+${formatCurrency(netForMe)}`
                    : netForMe < 0
                    ? `-${formatCurrency(Math.abs(netForMe))}`
                    : 'settled'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expense.splits.length} people
              </button>

              {isPayer && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`flex items-center gap-1 text-xs transition-colors ml-auto ${
                    confirmDelete
                      ? 'text-red-500 font-medium'
                      : 'text-gray-300 hover:text-red-400'
                  }`}
                >
                  <Trash2 size={12} />
                  {confirmDelete ? 'Confirm delete?' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded splits */}
      {expanded && (
        <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-3">
          <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Split Details</p>
          <div className="space-y-1.5">
            {expense.splits.map((split) => (
              <div key={split.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={split.profiles?.name || 'Unknown'}
                    avatarUrl={split.profiles?.avatar_url}
                    size="xs"
                  />
                  <span className="text-sm text-gray-700">
                    {split.profiles?.name?.split(' ')[0]}
                    {split.user_id === currentUserId && (
                      <span className="text-gray-400 ml-1 text-xs">(you)</span>
                    )}
                    {split.user_id === expense.payer_id && (
                      <span className="text-violet-500 ml-1 text-xs">paid</span>
                    )}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {formatCurrency(Number(split.amount_owed))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
