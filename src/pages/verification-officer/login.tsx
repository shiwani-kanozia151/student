// student/src/pages/verification-officer/login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function OfficerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      // Redirect to the dashboard
      navigate('/verification-officer/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="text-red-600">{error}</div>}
      <input 
        type="email" 
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Officer email" 
        required 
      />
      <input 
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password" 
        required 
      />
      <button type="submit">Log In</button>
    </form>
  );
}