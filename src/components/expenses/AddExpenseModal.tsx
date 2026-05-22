'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { formatCurrency, CATEGORY_CONFIG } from '@/lib/utils/format'
import { ExpenseCategory } from '@/lib/types/database'

interface Member {
  id: string
  name: string
  avatarUrl: string | null
}

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  members: Member[]
  currentUserId: string
  onAdded: (expense: unknown) => void
}

type SplitMode = 'equal' | 'custom' | 'percentage' | 'byshare'

export function AddExpenseModal({
  isOpen,
  onClose,
  groupId,
  members,
  currentUserId,
  onAdded,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [payerId, setPayerId] = useState(currentUserId)
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [splitMode, setSplitMode] = useState<SplitMode>('equal')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set(members.map((m) => m.id)))
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const parsedAmount = parseFloat(amount) || 0

  useEffect(() => {
    setSelectedMembers(new Set(members.map((m) => m.id)))
  }, [members, isOpen])

  function calculateSplits(): { user_id: string; amount_owed: number }[] {
    const selected = Array.from(selectedMembers)
    if (selected.length === 0) return []

    if (splitMode === 'equal') {
      const each = parsedAmount / selected.length
      return selected.map((userId) => ({ user_id: userId, amount_owed: Math.round(each * 100) / 100 }))
    }

    if (splitMode === 'custom') {
      return selected.map((userId) => ({
        user_id: userId,
        amount_owed: parseFloat(customSplits[userId] || '0'),
      }))
    }

    if (splitMode === 'percentage') {
      return selected.map((userId) => {
        const pct = parseFloat(customSplits[userId] || '0') / 100
        return { user_id: userId, amount_owed: Math.round(parsedAmount * pct * 100) / 100 }
      })
    }

    return []
  }

  const splits = calculateSplits()
  const splitsTotal = splits.reduce((s, sp) => s + sp.amount_owed, 0)
  const isValid = Math.abs(splitsTotal - parsedAmount) < 0.02

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || !parsedAmount || !isValid) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          amount: parsedAmount,
          payer_id: payerId,
          splits,
          category,
          expense_date: expenseDate,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to add expense')
        return
      }

      // Add payer and split info for local display
      const payer = members.find((m) => m.id === payerId)
      onAdded({
        ...data,
        profiles: payer,
        splits: splits.map((s) => ({
          ...s,
          id: `temp-${s.user_id}`,
          expense_id: data.id,
          profiles: members.find((m) => m.id === s.user_id),
        })),
      })

      setDescription('')
      setAmount('')
      setPayerId(currentUserId)
      setCategory('other')
      setCustomSplits({})
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function toggleMember(userId: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Expense" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            What was it for? <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Dinner at Joe's, Uber, Groceries..."
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
        </div>

        {/* Amount + Date row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
                className="w-full pl-7 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(CATEGORY_CONFIG) as [ExpenseCategory, typeof CATEGORY_CONFIG[ExpenseCategory]][]).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  category === key
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cfg.emoji} {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Paid by */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Paid by</label>
          <div className="flex flex-wrap gap-2">
            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setPayerId(member.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                  payerId === member.id
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Avatar name={member.name} avatarUrl={member.avatarUrl} size="xs" />
                {member.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Split with */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Split with</label>

          {/* Split mode toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
            {(['equal', 'custom', 'percentage'] as SplitMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSplitMode(mode)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                  splitMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {mode === 'equal' ? 'Equal' : mode === 'custom' ? 'Custom $' : 'Custom %'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {members.map((member) => {
              const isSelected = selectedMembers.has(member.id)
              const equalShare = selectedMembers.size > 0 ? parsedAmount / selectedMembers.size : 0

              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isSelected ? 'border-violet-200 bg-violet-50' : 'border-gray-100 bg-gray-50 opacity-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-violet-500 bg-violet-500' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <svg viewBox="0 0 10 8" className="w-3 h-3 text-white" fill="none">
                        <path d="M1 4l3 3L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <Avatar name={member.name} avatarUrl={member.avatarUrl} size="xs" />
                  <span className="text-sm font-medium text-gray-700 flex-1">
                    {member.name.split(' ')[0]}
                    {member.id === currentUserId && <span className="text-gray-400 ml-1">(you)</span>}
                  </span>

                  {isSelected && splitMode !== 'equal' && (
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                        {splitMode === 'percentage' ? '%' : '$'}
                      </span>
                      <input
                        type="number"
                        value={customSplits[member.id] || ''}
                        onChange={(e) =>
                          setCustomSplits((prev) => ({ ...prev, [member.id]: e.target.value }))
                        }
                        placeholder="0"
                        className="w-20 pl-5 pr-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
                      />
                    </div>
                  )}

                  {isSelected && splitMode === 'equal' && parsedAmount > 0 && (
                    <span className="text-sm font-semibold text-violet-600">
                      {formatCurrency(equalShare)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Split validation */}
          {parsedAmount > 0 && splitMode !== 'equal' && (
            <div className={`mt-2 text-xs px-3 py-2 rounded-lg ${isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              Total: {formatCurrency(splitsTotal)} / {formatCurrency(parsedAmount)}
              {isValid ? ' ✓' : ` (${formatCurrency(Math.abs(parsedAmount - splitsTotal))} remaining)`}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!description.trim() || !parsedAmount || selectedMembers.size === 0 || (splitMode !== 'equal' && !isValid)}
            className="flex-1"
          >
            Add Expense
          </Button>
        </div>
      </form>
    </Modal>
  )
}
