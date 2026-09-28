import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  Building2,
  Phone,
  ArrowRight,
  ArrowLeft,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Zap,
  CreditCard,
  BarChart3,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';

export default function AuthPage({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password, 3 = Success
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');

  // Sign In Form State
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Sign Up Form State (Strictly Client)
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    company_name: '',
    phone: '',
    gstin: '',
    role: 'Client'
  });

  const demoAccounts = [
    { label: 'CEO (Nitin)', email: 'nitin@redescreation.com', password: 'password123', badge: 'Full Access' },
    { label: 'Finance (Chirag)', email: 'chirag@redescreation.com', password: 'password123', badge: 'Billing Ops' },
    { label: 'PM (Priya)', email: 'priya@redescreation.com', password: 'password123', badge: 'Projects' },
    { label: 'Client (Northstar)', email: 'billing@northstarlabs.in', password: 'password123', badge: 'Client Portal' },
  ];

  const fillDemoAccount = (email, password) => {
    setLoginForm({ email, password });
    setErrorMessage('');
  };

  const executeLogin = async (credentials) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.login(credentials);
      if (res.success) {
        localStorage.setItem('redes_auth_token', res.token);
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (e) {
      setErrorMessage(e.message || 'Unable to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    executeLogin(loginForm);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.register(signupForm);
      if (res.success) {
        localStorage.setItem('redes_auth_token', res.token);
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Registration failed.');
      }
    } catch (e) {
      setErrorMessage(e.message || 'Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgotPassword = () => {
    setIsForgotPassword(true);
    setForgotStep(1);
    setForgotEmail(loginForm.email || '');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setDevOtpHint('');
    setErrorMessage('');
  };

  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotError('Please enter your work email address.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      if (res.success) {
        setForgotStep(2);
        if (res.dev_otp) setDevOtpHint(res.dev_otp);
      } else {
        setForgotError(res.message || 'No registered user found with this email.');
      }
    } catch (err) {
      setForgotError(err.message || 'Network error while requesting password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 4) {
      setForgotError('New password must be at least 4 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please verify and try again.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await api.resetPassword({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword
      });
      if (res.success) {
        setForgotStep(3);
      } else {
        setForgotError(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      setForgotError(err.message || 'Error occurred while resetting password.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f1d] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans antialiased relative overflow-x-hidden">
      {/* Dynamic ambient background glow */}
      <div className="absolute -top-32 -left-32 w-64 sm:w-96 h-64 sm:h-96 bg-amber-500/15 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 sm:w-96 h-64 sm:h-96 bg-blue-600/15 rounded-full blur-[90px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[700px] h-[350px] sm:h-[700px] bg-slate-800/20 rounded-full blur-[100px] sm:blur-[160px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-slate-700/30 overflow-hidden z-10 grid grid-cols-1 lg:grid-cols-12 min-h-auto lg:min-h-[640px] my-auto">
        
        {/* Left Side: Brand & Visual Showcase (5 columns on desktop, sleek compact header on mobile) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0c1322] via-[#131b2e] to-[#0f172a] text-white p-5 sm:p-7 lg:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d12_1px,transparent_1px),linear-gradient(to_bottom,#1f293d12_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <div className="relative z-10 space-y-4 lg:space-y-6">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 font-black text-lg sm:text-xl shadow-lg shadow-amber-400/25 tracking-tight shrink-0">
                RC
              </div>
              <div>
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white block leading-tight">
                  Redes Creation
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-amber-400 tracking-wider uppercase block">
                  Enterprise ERP Suite
                </span>
              </div>
            </div>

            {/* Tagline */}
            <div className="pt-1 sm:pt-2 lg:pt-4 space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] sm:text-xs font-semibold">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                <span>Finance & Billing Engine</span>
              </div>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug sm:leading-tight">
                Complete Financial Lifecycle Management
              </h2>
              <p className="hidden sm:block text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                Seamless billing workflow from Quotation to Invoice, automated reminders, verified payment collection, and audit trails.
              </p>
            </div>

            {/* Key Value Highlights - Shown on Desktop/Tablet, hidden on mobile to avoid 500px scroll */}
            <div className="hidden lg:block space-y-3.5 pt-4">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">1-Click Invoice Workflow</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Generate GST tax invoices directly from approved quotations.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Instant Payments & Links</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Razorpay, UPI, Net Banking, and manual verification receipts.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Real-Time Reconciliation</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Aging analysis, automated D-3 to D+15 reminders & audit logs.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer Info (shown on desktop) */}
          <div className="hidden lg:flex relative z-10 pt-6 mt-6 border-t border-slate-800/80 items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>256-Bit SSL Encrypted</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">v2.4.0 Active</span>
          </div>
        </div>

        {/* Right Side: Auth Form (7 columns) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-8 lg:p-12 flex flex-col justify-between">
          <div className="max-w-md mx-auto w-full space-y-5 sm:space-y-6">
            
            {isForgotPassword ? (
              /* Simple Email-Based Forgot Password Flow */
              <div className="space-y-6">
                {/* Back button & Step Badge */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setForgotError(''); }}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back to Sign In</span>
                  </button>
                  {forgotStep < 3 && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                      Step {forgotStep} of 2
                    </span>
                  )}
                </div>

                {/* Header title */}
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {forgotStep === 3
                      ? 'Password Reset Successful'
                      : forgotStep === 2
                      ? 'Verify Code & Set Password'
                      : 'Reset Your Password'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {forgotStep === 3
                      ? 'Your account password has been updated. You can now sign in.'
                      : forgotStep === 2
                      ? `We sent a 6-digit verification code to ${forgotEmail}.`
                      : 'Enter your registered work email to receive a password reset verification code.'}
                  </p>
                </div>

                {/* Error Banner */}
                {forgotError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2.5 animate-fadeIn">
                    <Shield className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-medium">{forgotError}</span>
                  </div>
                )}

                {/* STEP 1: Enter Email */}
                {forgotStep === 1 && (
                  <form onSubmit={handleSendOtp} className="space-y-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 tracking-wide mb-1.5 uppercase">
                        Work Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. nitin@redescreation.com"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all duration-150 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-6 cursor-pointer"
                    >
                      <span>{forgotLoading ? 'Sending Verification Code...' : 'Send Verification Code'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </form>
                )}

                {/* STEP 2: Enter OTP & New Password */}
                {forgotStep === 2 && (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-1">
                    {/* Demo auto-fill chip */}
                    {devOtpHint && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>OTP Code: <strong className="font-mono text-sm tracking-wider">{devOtpHint}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForgotOtp(devOtpHint)}
                          className="text-[11px] font-bold text-amber-800 bg-amber-200/60 hover:bg-amber-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                        >
                          Auto-fill
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 tracking-wide mb-1.5 uppercase">
                        6-Digit Verification Code
                      </label>
                      <div className="relative">
                        <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 tracking-wide mb-1.5 uppercase">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={forgotShowPassword ? 'text' : 'password'}
                          required
                          minLength={4}
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setForgotShowPassword(!forgotShowPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {forgotShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 tracking-wide mb-1.5 uppercase">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={forgotShowPassword ? 'text' : 'password'}
                          required
                          minLength={4}
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all duration-150 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-6 cursor-pointer"
                    >
                      <span>{forgotLoading ? 'Updating Password...' : 'Save New Password'}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={forgotLoading}
                        className="text-xs text-amber-700 hover:text-amber-800 font-semibold cursor-pointer underline"
                      >
                        Didn't receive the code? Resend Code
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Success Screen */}
                {forgotStep === 3 && (
                  <div className="text-center py-6 space-y-5 animate-fadeIn">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">Password Changed Successfully!</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        Your password has been updated. You can now sign in with your new password.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setLoginForm({ email: forgotEmail, password: forgotNewPassword });
                      }}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all duration-150 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Top Bar: Switcher Pill */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      {isSignUp ? 'Client Portal Registration' : 'Welcome Back'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {isSignUp
                        ? 'Register your client account to view invoices, download receipts & pay online'
                        : 'Sign in with your email to access your console'}
                    </p>
                  </div>
                </div>

                {/* Segmented Pill Switcher */}
                <div className="flex bg-slate-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setErrorMessage(''); }}
                    className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      !isSignUp
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setErrorMessage(''); }}
                    className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      isSignUp
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Client Sign Up
                  </button>
                </div>

                {/* Quick 1-Tap Demo Logins Pill Helper */}
                {!isSignUp && (
                  <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200/80 rounded-xl sm:rounded-2xl space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Quick Demo Fill (1-Tap):</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Tap to auto-fill</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      {demoAccounts.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => fillDemoAccount(acc.email, acc.password)}
                          className={`p-2 rounded-lg sm:rounded-xl text-left border transition-all text-xs cursor-pointer flex flex-col justify-center ${
                            loginForm.email === acc.email
                              ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-semibold shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span className="truncate font-semibold text-[11px] sm:text-xs">{acc.label}</span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 truncate">{acc.badge}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Message Notification */}
                {errorMessage && (
                  <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl sm:rounded-2xl flex items-center gap-2.5 animate-fadeIn">
                    <Shield className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                )}

                {/* Sign In Form */}
                {!isSignUp ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-3.5 sm:space-y-4 pt-1 sm:pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 tracking-wide mb-1.5 uppercase">
                        Work Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          placeholder="name@redescreation.com"
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={handleOpenForgotPassword}
                          className="text-xs text-amber-600 hover:text-amber-700 font-semibold cursor-pointer transition-colors"
                        >
                          Forgot?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all duration-150 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-6 cursor-pointer"
                    >
                      <span>{loading ? 'Authenticating...' : 'Sign In to Console'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </form>
                ) : (
                  /* Sign Up Form (Strictly Client Registration) */
                  <form onSubmit={handleSignupSubmit} className="space-y-3 pt-2">
                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-950 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        <strong>Client Registration:</strong> Create your billing account to access your invoices, receipts, and make payments. Internal staff logins (CEO, Finance, PM) are provisioned internally.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 tracking-wide mb-1 uppercase">
                        Contact Person Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={signupForm.name}
                          onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                          placeholder="e.g. Rajesh Singhania"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 tracking-wide mb-1 uppercase">
                        Company / Entity Name *
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={signupForm.company_name}
                          onChange={(e) => setSignupForm({ ...signupForm, company_name: e.target.value })}
                          placeholder="e.g. Northstar Labs Pvt. Ltd."
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 tracking-wide mb-1 uppercase">
                          Billing Email *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={signupForm.email}
                            onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                            placeholder="billing@company.com"
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 tracking-wide mb-1 uppercase">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            required
                            value={signupForm.phone}
                            onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                            placeholder="+91..."
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 tracking-wide mb-1 uppercase">
                          Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="password"
                            required
                            value={signupForm.password}
                            onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                            placeholder="Min 6 chars"
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 tracking-wide mb-1 uppercase">
                          GSTIN (Optional)
                        </label>
                        <input
                          type="text"
                          value={signupForm.gstin}
                          onChange={(e) => setSignupForm({ ...signupForm, gstin: e.target.value })}
                          placeholder="e.g. 29ABCDE1234F1Z5"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all duration-150 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
                    >
                      <span>{loading ? 'Creating Client Account...' : 'Register Client Account'}</span>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </form>
                )}
              </>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center text-[11px] sm:text-xs text-slate-400 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-100">
            Redes Creation ERP &copy; 2026. Enterprise Role-Based Architecture.
          </div>
        </div>
      </div>
    </div>
  );
}
