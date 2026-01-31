'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import type { AuthUser, MeResponse } from '@/lib/api'

export type AuthStatus = 'loading' | 'authed' | 'guest'

type UseAuthState = {
  status: AuthStatus
  user: MeResponse | null
}

export function useAuth() {
  const [state, setState] = useState<UseAuthState>({
    status: 'loading',
    user: null,
  })

  const refreshMe = useCallback(async (): Promise<MeResponse | null> => {
    try {
      const me = await api.auth.me()

      setState({ status: 'authed', user: me })

      return me
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setState({ status: 'guest', user: null })

        return null
      }

      throw e
    }
  }, [])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const user = await api.auth.login({ email, password })

    await refreshMe()

    return user
  }, [refreshMe])

  const register = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const user = await api.auth.register({ email, password })

    return user
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.auth.logout()
    } finally {
      setState({ status: 'guest', user: null })
    }
  }, [])

  const isLoading = state.status === 'loading'
  const isAuthed = state.status === 'authed'
  const isGuest = state.status === 'guest'
  const isAdmin = state.user?.role === 'ADMIN'

  return useMemo(
    () => ({
      status: state.status,
      user: state.user,
      isLoading,
      isAuthed,
      isGuest,
      isAdmin,
      refreshMe,
      login,
      register,
      logout,
    }),
    [state.status, state.user, isLoading, isAuthed, isGuest, isAdmin, refreshMe, login, register, logout]
  )
}
