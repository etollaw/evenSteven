'use client'

import { useState } from 'react'
import { ArrowRight, Check, PartyPopper } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils/format'
import { Transaction } from '@/lib/utils/settle-optimizer'
import { Settlement } from '@/lib/types/database'

interface SettleUpPanelProps {
  transactions: Transaction[]
  groupId: string
  currentUserId: string
  onSettled: (settlement: Settlement) => void
}

export function SettleUpPanel({ transactions, groupId, currentUserId, onSettled }: SettleUpPanelProps) {
  const [settlingId, setSettlingId] = useState<string | null>(null)
  const [settledIds, setSettledIds] = useState<Set<string>>(new Set())
  const [note, setNote] = useState('')

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <PartyPopper size={36} className="text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">All settled up! 🎉</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Everyone in this group is square. No payments needed.
        </p>
      </div>
    )
  }

  async function handleSettle(transaction: Transaction, txId: string) {
    setSettlingId(txId)

    try {
      const res = await fetch(`/api/groups/${groupId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_user_id: transaction.to.userId,
          amount: transaction.amount,
          note,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setSettledIds((prev) => new Set([...prev, txId]))
        onSettled(data)
        setNote('')
      }
    } finally {
      setSettlingId(null)
    }
  }

  const myTransactions = transactions.filter(
    (t) => t.from.userId === currentUserId || t.to.userId === currentUserId
  )
  const otherTransactions = transactions.filter(
    (t) => t.from.userId !== currentUserId && t.to.userId !== currentUserId
  )

  const TransactionCard = ({ transaction, index }: { transaction: Transaction; index: number }) => {
    const txId = `${transaction.from.userId}-${transaction.to.userId}`
    const isSettled = settledIds.has(txId)
    const isMyDebt = transaction.from.userId === currentUserId
    const isOwedToMe = transaction.to.userId === currentUserId

    return (
      <div
        key={index}
        className={`bg-white rounded-2xl border p-4 transition-all ${
          isSettled ? 'opacity-50 border-emerald-100' : 'border-gray-100'
        } ${isMyDebt ? 'ring-2 ring-violet-100' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar
              name={transaction.from.name}
              avatarUrl={transaction.from.avatarUrl}
              size="sm"
            />
            <div className="min-w-0">
              <span className="text-sm font-semibold text-gray-900 block truncate">
                {transaction.from.userId === currentUserId ? 'You' : transaction.from.name.split(' ')[0]}
              </span>
              <span className="text-xs text-gray-400">owes</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-base font-bold text-gray-900">
              {formatCurrency(transaction.amount)}
            </span>
            <ArrowRight size={16} className="text-gray-300" />
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            <div className="min-w-0 text-right">
              <span className="text-sm font-semibold text-gray-900 block truncate">
                {transaction.to.userId === currentUserId ? 'You' : transaction.to.name.split(' ')[0]}
              </span>
              <span className="text-xs text-gray-400">receives</span>
            </div>
            <Avatar
              name={transaction.to.name}
              avatarUrl={transaction.to.avatarUrl}
              size="sm"
            />
          </div>
        </div>

        {isSettled ? (
          <div className="mt-3 flex items-center gap-2 text-emerald-600 text-sm font-medium">
            <Check size={16} />
            Settled!
          </div>
        ) : (isMyDebt || isOwedToMe) ? (
          <div className="mt-3">
            {isMyDebt && (
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 mb-2"
              />
            )}
            <Button
              size="sm"
              variant={isMyDebt ? 'primary' : 'outline'}
              loading={settlingId === txId}
              onClick={() => handleSettle(transaction, txId)}
              className="w-full"
              disabled={!isMyDebt}
            >
              {isMyDebt ? `Mark as Paid — ${formatCurrency(transaction.amount)}` : 'Waiting for payment'}
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
        <p className="text-sm font-semibold text-violet-800 mb-1">
          🧠 Optimized Settlement Plan
        </p>
        <p className="text-xs text-violet-600">
          Our algorithm found the minimum {transactions.length} payment{transactions.length !== 1 ? 's' : ''} to clear all debts in this group.
        </p>
      </div>

      {myTransactions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Your payments</h3>
          <div className="space-y-3">
            {myTransactions.map((t, i) => (
              <TransactionCard key={i} transaction={t} index={i} />
            ))}
          </div>
        </div>
      )}

      {otherTransactions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Other payments</h3>
          <div className="space-y-3">
            {otherTransactions.map((t, i) => (
              <TransactionCard key={i} transaction={t} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
