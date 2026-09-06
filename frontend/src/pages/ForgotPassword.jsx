import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (step !== 2 || resendCooldown <= 0) return undefined;

    const timer = setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const startResendCooldown = () => {
    setResendCooldown(120);
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || 'Reset code sent. Check your email.');
      setStep(2);
      setCode('');
      setNewPassword('');
      startResendCooldown();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || 'A new reset code has been sent.');
      setCode('');
      setNewPassword('');
      startResendCooldown();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/auth/reset-password', { email, code, newPassword });
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full lc-card p-6 sm:p-8 border-border bg-surface">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <span className="text-3xl sm:text-4xl">🔐</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">Code<span className="text-brand">Hunt</span></h1>
          <p className="text-muted font-medium text-sm">
            {step === 1 ? 'Reset Your Password' : 'Enter Reset Code'}
          </p>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs sm:text-sm text-center font-bold">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-xs sm:text-sm text-center font-bold">
            {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-5 sm:space-y-6">
            <p className="text-xs sm:text-sm text-muted text-center">Enter your email address and we'll send you a reset code.</p>
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full lc-input bg-input border-border text-foreground focus:border-brand text-sm"
                required
                placeholder="your@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full lc-btn-primary py-3 sm:py-3.5 text-base sm:text-lg shadow-[0_0_20px_rgba(255,161,22,0.2)] disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest mb-2">Reset Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full lc-input bg-input border-border text-foreground focus:border-brand text-sm text-center tracking-[0.3em] font-mono"
                required
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full lc-input bg-input border-border text-foreground focus:border-brand text-sm"
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full lc-btn-primary py-3 sm:py-3.5 text-base sm:text-lg shadow-[0_0_20px_rgba(255,161,22,0.2)] disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading || resendCooldown > 0}
              className="w-full text-center text-xs sm:text-sm text-brand hover:underline font-medium transition-colors disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend code in ${Math.ceil(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, '0')}` : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setMessage(''); setError(''); }}
              className="w-full text-center text-xs sm:text-sm text-muted hover:text-brand font-medium transition-colors"
            >
              ← Back to email entry
            </button>
          </form>
        )}

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border flex flex-col items-center gap-3 sm:gap-4">
          <Link to="/login" className="text-xs sm:text-sm text-brand hover:underline font-medium">Back to Login</Link>
          <Link to="/" className="text-[10px] text-muted hover:text-brand uppercase tracking-widest font-bold transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
