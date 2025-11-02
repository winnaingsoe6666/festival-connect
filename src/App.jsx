import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './Auth'
import FestivalTracker from './FestivalTracker'

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Check for an active session when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for changes in auth state (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Clean up the listener when the component unmounts
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div>
      {!session ? (
        <Auth />
      ) : (
        // If we have a session, show the tracker
        // We pass the session down as a prop
        <FestivalTracker key={session.user.id} session={session} />
      )}
    </div>
  )
}