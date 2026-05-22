'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LogOut, TrendingUp, TrendingDown, Minus, Users } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { Profile, Group } from '@/lib/types/database'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'
import { GroupCard } from '@/components/groups/GroupCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'

interface DashboardProps {
  user: User
  profile: Profile | null
  groups: (Group & { group_members: { user_id: string }[]; expenses: { amount: number }[] })[]
}

export default function DashboardPage({ user, profile, groups }: DashboardProps) {
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [localGroups, setLocalGroups] = useState(groups)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const totalGroups = localGroups.length
  const totalExpenses = localGroups.reduce(
    (sum, g) => sum + (g.expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0),
    0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💸</span>
              <span className="text-xl font-bold text-gray-900">IOU</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar
                  name={profile?.name || user.email || 'User'}
                  avatarUrl={profile?.avatar_url}
                  size="sm"
                />
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {profile?.name || user.email?.split('@')[0]}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                icon={<LogOut size={16} />}
                className="text-gray-500"
              >
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hey, {profile?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here&apos;s an overview of your groups</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                <Users size={18} className="text-violet-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Active Groups</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalGroups}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Total Tracked</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <Minus size={18} className="text-blue-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Avg per Group</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {totalGroups > 0 ? formatCurrency(totalExpenses / totalGroups) : '$0.00'}
            </p>
          </div>
        </div>

        {/* Groups */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Groups</h2>
          <Button
            onClick={() => setShowCreateGroup(true)}
            icon={<Plus size={16} />}
          >
            New Group
          </Button>
        </div>

        {localGroups.length === 0 ? (
          <EmptyState
            icon="🏘️"
            title="No groups yet"
            description="Create your first group to start splitting expenses with friends."
            action={
              <Button onClick={() => setShowCreateGroup(true)} icon={<Plus size={16} />}>
                Create Group
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {localGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                memberCount={group.group_members?.length || 0}
                totalExpenses={group.expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0}
                onClick={() => router.push(`/groups/${group.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(group) => {
          setLocalGroups((prev) => [{ ...group, group_members: [{ user_id: user.id }], expenses: [] }, ...prev])
          setShowCreateGroup(false)
          router.push(`/groups/${group.id}`)
        }}
      />
    </div>
  )
}
