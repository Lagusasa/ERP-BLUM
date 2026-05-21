'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@/types/database.types'

interface AuthState {
  user: User | null
  perfil: Tables<'perfiles'> | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    perfil: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setState({ user: null, perfil: null, loading: false })
        return
      }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      setState({ user, perfil, loading: false })
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setState({ user: null, perfil: null, loading: false })
      } else {
        loadUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}
