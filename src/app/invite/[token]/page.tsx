import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvitePage from '@/components/groups/InvitePage'

interface Props {
  params: Promise<{ token: string }>
}

export default async function Invite({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch invite
  const { data: invite } = await supabase
    .from('group_invites')
    .select(`
      *,
      groups(*)
    `)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    redirect('/dashboard?error=invite_expired')
  }

  if (!user) {
    redirect(`/login?next=/invite/${token}`)
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', invite.group_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    redirect(`/groups/${invite.group_id}`)
  }

  return (
    <InvitePage
      invite={invite}
      user={user}
    />
  )
}
