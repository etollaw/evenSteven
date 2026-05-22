import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginPage from '@/components/auth/LoginPage'

export default async function Login() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <LoginPage />
}
