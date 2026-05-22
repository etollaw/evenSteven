import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import GroupDetailPage from '@/components/groups/GroupDetailPage'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GroupPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    notFound()
  }

  // Fetch group details
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (!group) {
    notFound()
  }

  // Fetch members with profiles
  const { data: members } = await supabase
    .from('group_members')
    .select(`
      *,
      profiles(*)
    `)
    .eq('group_id', id)
    .order('joined_at', { ascending: true })

  // Fetch expenses with splits and payer info
  const { data: expenses } = await supabase
    .from('expenses')
    .select(`
      *,
      profiles!expenses_payer_id_fkey(*),
      splits(*, profiles(*))
    `)
    .eq('group_id', id)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  // Fetch settlements
  const { data: settlements } = await supabase
    .from('settlements')
    .select(`
      *,
      from_profile:profiles!settlements_from_user_id_fkey(*),
      to_profile:profiles!settlements_to_user_id_fkey(*)
    `)
    .eq('group_id', id)
    .order('settled_at', { ascending: false })

  // Fetch activity feed
  const { data: activity } = await supabase
    .from('activity_feed')
    .select(`
      *,
      profiles(*)
    `)
    .eq('group_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <GroupDetailPage
      group={group}
      members={members || []}
      expenses={expenses || []}
      settlements={settlements || []}
      activity={activity || []}
      currentUser={user}
    />
  )
}
