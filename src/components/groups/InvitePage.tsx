'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface InvitePageProps {
  invite: {
    token: string
    group_id: string
    groups: {
      id: string
      name: string
      emoji: string
      description: string | null
    } | null
  }
  user: User
}

export default function InvitePage({ invite, user }: InvitePageProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const group = invite.groups

  async function handleJoin() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/invite/${invite.token}/join`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to join group')
        return
      }

      router.push(`/groups/${data.group_id}`)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Invalid invite link</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">{group.emoji}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re invited!</h1>
        <p className="text-gray-500 mb-6">
          Join <span className="font-semibold text-gray-900">{group.name}</span> to split expenses together.
        </p>

        {group.description && (
          <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3 mb-6">
            {group.description}
          </p>
        )}

        <div className="flex items-center gap-2 justify-center text-sm text-gray-500 mb-6">
          <Users size={16} />
          <span>Signed in as <strong>{user.email}</strong></span>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <Button
          onClick={handleJoin}
          loading={loading}
          className="w-full"
          size="lg"
          icon={<ArrowRight size={18} />}
        >
          Join Group
        </Button>

        <button
          onClick={() => router.push('/dashboard')}
          className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
