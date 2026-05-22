'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Group, Expense, Settlement } from '@/lib/types/database'
import {
  ArrowLeft,
  Plus,
  Users,
  Receipt,
  ArrowRightLeft,
  Activity,
  Share2,
  Check,
} from 'lucide-react'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal'
import { ExpenseCard } from '@/components/expenses/ExpenseCard'
import { SettleUpPanel } from '@/components/settle/SettleUpPanel'
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { formatCurrency } from '@/lib/utils/format'
import { calculateNetBalances, optimizeSettlements } from '@/lib/utils/settle-optimizer'

type TabType = 'expenses' | 'balances' | 'settle' | 'activity'

interface MemberWithProfile {
  id: string
  group_id: string
  user_id: string
  joined_at: string
  profiles: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  }
}

interface ExpenseWithDetails extends Expense {
  profiles: { id: string; name: string; avatar_url: string | null }
  splits: Array<{
    id: string
    user_id: string
    amount_owed: number
    profiles: { id: string; name: string; avatar_url: string | null }
  }>
}

interface SettlementWithProfiles extends Settlement {
  from_profile: { id: string; name: string; avatar_url: string | null }
  to_profile: { id: string; name: string; avatar_url: string | null }
}

interface ActivityWithProfile {
  id: string
  group_id: string
  user_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
  profiles: { id: string; name: string; avatar_url: string | null } | null
}

interface GroupDetailProps {
  group: Group
  members: MemberWithProfile[]
  expenses: ExpenseWithDetails[]
  settlements: SettlementWithProfiles[]
  activity: ActivityWithProfile[]
  currentUser: User
}

export default function GroupDetailPage({
  group,
  members,
  expenses: initialExpenses,
  settlements: initialSettlements,
  activity: initialActivity,
  currentUser,
}: GroupDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('expenses')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [settlements, setSettlements] = useState(initialSettlements)
  const [activity, setActivity] = useState(initialActivity)
  const [copied, setCopied] = useState(false)

  const memberProfiles = members.map((m) => ({
    userId: m.user_id,
    name: m.profiles?.name || 'Unknown',
    avatarUrl: m.profiles?.avatar_url || null,
  }))

  const netBalances = useMemo(() => {
    return calculateNetBalances(
      memberProfiles,
      expenses.map((e) => ({
        payer_id: e.payer_id,
        amount: Number(e.amount),
        splits: e.splits.map((s) => ({ user_id: s.user_id, amount_owed: Number(s.amount_owed) })),
      })),
      settlements.map((s) => ({
        from_user_id: s.from_user_id,
        to_user_id: s.to_user_id,
        amount: Number(s.amount),
      }))
    )
  }, [expenses, settlements, memberProfiles])

  const optimizedTransactions = useMemo(() => optimizeSettlements(netBalances), [netBalances])

  const currentUserBalance = netBalances.find((b) => b.userId === currentUser.id)

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  async function handleShareInvite() {
    try {
      const res = await fetch(`/api/groups/${group.id}/invite`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        const inviteUrl = `${window.location.origin}/invite/${data.token}`
        await navigator.clipboard.writeText(inviteUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } catch {
      // fallback: just copy the group URL
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'expenses', label: 'Expenses', icon: <Receipt size={16} />, count: expenses.length },
    { id: 'balances', label: 'Balances', icon: <Users size={16} /> },
    { id: 'settle', label: 'Settle Up', icon: <ArrowRightLeft size={16} />, count: optimizedTransactions.length },
    { id: 'activity', label: 'Activity', icon: <Activity size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-2xl flex-shrink-0">{group.emoji}</span>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 truncate">{group.name}</h1>
                {group.description && (
                  <p className="text-xs text-gray-400 truncate">{group.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AvatarGroup
                members={memberProfiles}
                max={3}
                size="xs"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShareInvite}
                icon={copied ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
                className={copied ? 'text-emerald-600' : ''}
              >
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Invite'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Balance bar */}
      <div className={`${currentUserBalance && currentUserBalance.netBalance !== 0 ? (currentUserBalance.netBalance > 0 ? 'bg-emerald-500' : 'bg-red-500') : 'bg-gray-400'} text-white`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">Your balance in this group</p>
            <p className="text-xl font-bold">
              {currentUserBalance
                ? currentUserBalance.netBalance === 0
                  ? 'All settled up! 🎉'
                  : currentUserBalance.netBalance > 0
                  ? `You are owed ${formatCurrency(currentUserBalance.netBalance)}`
                  : `You owe ${formatCurrency(Math.abs(currentUserBalance.netBalance))}`
                : 'Loading...'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">Total spent</p>
            <p className="text-lg font-bold">{formatCurrency(totalSpent)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-1 flex gap-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'expenses' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''} totaling {formatCurrency(totalSpent)}
              </p>
              <Button onClick={() => setShowAddExpense(true)} icon={<Plus size={16} />} size="sm">
                Add Expense
              </Button>
            </div>

            {expenses.length === 0 ? (
              <EmptyState
                icon="🧾"
                title="No expenses yet"
                description="Add your first expense to start tracking who owes what."
                action={
                  <Button onClick={() => setShowAddExpense(true)} icon={<Plus size={16} />}>
                    Add First Expense
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    currentUserId={currentUser.id}
                    onDelete={async (expenseId) => {
                      const res = await fetch(
                        `/api/groups/${group.id}/expenses/${expenseId}`,
                        { method: 'DELETE' }
                      )
                      if (res.ok) {
                        setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
                        setActivity((prev) => [
                          {
                            id: `temp-${Date.now()}`,
                            group_id: group.id,
                            user_id: currentUser.id,
                            action: 'expense_deleted',
                            metadata: { description: expense.description, amount: expense.amount },
                            created_at: new Date().toISOString(),
                            profiles: null,
                          },
                          ...prev,
                        ])
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="animate-fade-in space-y-3">
            <p className="text-sm text-gray-500 mb-4">
              Net balance = Total paid − Total owed (including settlements)
            </p>
            {netBalances.map((balance) => (
              <div
                key={balance.userId}
                className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={balance.name} avatarUrl={balance.avatarUrl} size="sm" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {balance.name}
                      {balance.userId === currentUser.id && (
                        <span className="ml-1.5 text-xs text-violet-500 font-normal">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {balance.netBalance === 0
                        ? 'Settled up'
                        : balance.netBalance > 0
                        ? 'Gets back money'
                        : 'Owes money'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      balance.netBalance === 0
                        ? 'neutral'
                        : balance.netBalance > 0
                        ? 'success'
                        : 'danger'
                    }
                    size="md"
                  >
                    {balance.netBalance === 0
                      ? 'Settled'
                      : balance.netBalance > 0
                      ? `+${formatCurrency(balance.netBalance)}`
                      : `-${formatCurrency(Math.abs(balance.netBalance))}`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settle' && (
          <SettleUpPanel
            transactions={optimizedTransactions}
            groupId={group.id}
            currentUserId={currentUser.id}
            onSettled={(settlement) => {
              setSettlements((prev) => [settlement as SettlementWithProfiles, ...prev])
              setActivity((prev) => [
                {
                  id: `temp-${Date.now()}`,
                  group_id: group.id,
                  user_id: currentUser.id,
                  action: 'settlement_added',
                  metadata: { amount: settlement.amount, to_user_id: settlement.to_user_id },
                  created_at: new Date().toISOString(),
                  profiles: null,
                },
                ...prev,
              ])
            }}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityFeed
            activity={activity}
            members={memberProfiles}
          />
        )}
      </div>

      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        groupId={group.id}
        members={members.map((m) => ({ id: m.user_id, name: m.profiles?.name || 'Unknown', avatarUrl: m.profiles?.avatar_url || null }))}
        currentUserId={currentUser.id}
        onAdded={(expense) => {
          setExpenses((prev) => [expense as ExpenseWithDetails, ...prev])
          setShowAddExpense(false)
        }}
      />
    </div>
  )
}
