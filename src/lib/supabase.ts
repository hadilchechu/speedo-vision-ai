import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadVideo(file: File, projectId: string): Promise<string> {
  // Use cached session — no network call
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Sign in to save projects across sessions')

  const filePath = `${session.user.id}/${projectId}/${file.name}`

  const { error } = await supabase.storage
    .from('video')
    .upload(filePath, file, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage
    .from('video')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}