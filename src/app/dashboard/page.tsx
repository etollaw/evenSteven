import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardPage from '@/components/dashboard/DashboardPage'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: groups } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner(user_id),
      expenses(amount)
    `)
    .eq('group_members.user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <DashboardPage
      user={user}
      profile={profile}
      groups={groups || []}
    />
  )
}
