import React, { useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [activeTab, setActiveTab] = useState('signin') // 'signin' or 'signup'
  const [message, setMessage] = useState('')

  const handleSignIn = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setMessage(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  const handleSignUp = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName 
        }
      }
    })

    if (error) {
      toast.error(error.message)
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Success! Please check your email to confirm your account.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="setup-icon" style={{ backgroundColor: '#c084fc' }}>
          <Heart size={40} color="white" />
        </div>
        <h1 className="auth-title">Welcome!</h1>
        <p className="auth-subtitle">Sign in or create an account</p>

        {/* --- STYLED TABS --- */}
        <div className="auth-tabs-list">
          <button
            className="auth-tab-trigger"
            data-active={activeTab === 'signin'}
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
          <button
            className="auth-tab-trigger"
            data-active={activeTab === 'signup'}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* --- SIGN IN FORM --- */}
        {activeTab === 'signin' && (
          <form className="auth-form" onSubmit={handleSignIn}>
            <div>
              <label className="setup-label" htmlFor="email-signin">Email</label>
              <input
                id="email-signin"
                className="input"
                type="email"
                placeholder="Your email"
                value={email}
                required={true}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="setup-label" htmlFor="password-signin">Password</label>
              <input
                id="password-signin"
                className="input"
                type="password"
                placeholder="Your password"
                value={password}
                required={true}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <button className="button button-primary" style={{width: '100%'}} disabled={loading}>
                {loading ? <span>Loading...</span> : <span>Sign In</span>}
              </button>
            </div>
          </form>
        )}
        
        {/* --- SIGN UP FORM --- */}
        {activeTab === 'signup' && (
           <form className="auth-form" onSubmit={handleSignUp}>
            
            <div>
              <label className="setup-label" htmlFor="full_name">Your Name</label>
              <input
                id="full_name"
                className="input"
                type="text"
                placeholder="fill fullname or nickname"
                value={fullName}
                required={true}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="setup-label" htmlFor="email-signup">Email</label>
              <input
                id="email-signup"
                className="input"
                type="email"
                placeholder="Your email"
                value={email}
                required={true}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="setup-label" htmlFor="password-signup">Password</label>
              <input
                id="password-signup"
                className="input"
                type="password"
                placeholder="Create a password"
                value={password}
                required={true}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <button className="button button-primary" style={{width: '100%'}} disabled={loading}>
                {loading ? <span>Loading...</span> : <span>Sign Up</span>}
              </button>
            </div>
          </form>
        )}

        {message && <p style={{marginTop: '1rem', color: '#667eea', fontSize: '0.875rem'}}>{message}</p>}
      </div>
    </div>
  )
}