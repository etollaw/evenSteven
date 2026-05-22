'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Group } from '@/lib/types/database'
import { GROUP_EMOJIS } from '@/lib/utils/format'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (group: Group) => void
}

export function CreateGroupModal({ isOpen, onClose, onCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('💰')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, emoji }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create group')
        return
      }

      onCreated(data)
      setName('')
      setDescription('')
      setEmoji('💰')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a Group">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Emoji picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Group Icon</label>
          <div className="flex flex-wrap gap-2">
            {GROUP_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-10 h-10 text-xl rounded-xl transition-all ${
                  emoji === e
                    ? 'bg-violet-100 ring-2 ring-violet-400 scale-110'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Weekend Trip, Roommates..."
            maxLength={50}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group for?"
            maxLength={100}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  )
}
