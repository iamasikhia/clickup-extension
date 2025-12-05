import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface PasswordResetProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function PasswordReset({ onBack, onSuccess }: PasswordResetProps) {
  const [step, setStep] = useState<'request' | 'sent' | 'reset'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    resetCode: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Mock sending reset email
      console.log('Password reset requested for:', formData.email);
      setStep('sent');
    } catch (error) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.resetCode) {
      setError('Reset code is required');
      setLoading(false);
      return;
    }

    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Mock code verification (accept "123456" as valid code)
      if (formData.resetCode === '123456') {
        setStep('reset');
      } else {
        setError('Invalid reset code. Use "123456" for demo.');
      }
    } catch (error) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Both password fields are required');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Mock password reset
      console.log('Password reset successful');
      onSuccess();
    } catch (error) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    // Mock resend logic
    console.log('Reset code resent');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl">
                {step === 'request' && 'Reset Password'}
                {step === 'sent' && 'Check Your Email'}
                {step === 'reset' && 'Set New Password'}
              </CardTitle>
            </div>
            <p className="text-muted-foreground text-sm">
              {step === 'request' && 'Enter your email to receive a reset code'}
              {step === 'sent' && 'We sent a reset code to your email'}
              {step === 'reset' && 'Enter your new password'}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-9"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending reset code...
                    </div>
                  ) : (
                    'Send Reset Code'
                  )}
                </Button>
              </form>
            )}

            {step === 'sent' && (
              <>
                <div className="text-center py-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit code to <span className="font-medium">{formData.email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-code">Reset Code</Label>
                    <Input
                      id="reset-code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      className="text-center text-lg font-mono tracking-widest"
                      maxLength={6}
                      value={formData.resetCode}
                      onChange={(e) => setFormData({ ...formData, resetCode: e.target.value.replace(/\D/g, '') })}
                      disabled={loading}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || formData.resetCode.length !== 6}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Verifying...
                      </div>
                    ) : (
                      'Verify Code'
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <button
                    className="text-sm text-muted-foreground hover:text-primary"
                    onClick={resendCode}
                    disabled={loading}
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>

                {/* Demo Helper */}
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p className="font-medium text-muted-foreground mb-1">Demo Code:</p>
                  <p className="text-muted-foreground">
                    Use code: <span className="font-mono">123456</span>
                  </p>
                </div>
              </>
            )}

            {step === 'reset' && (
              <>
                <div className="text-center py-2">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>Password requirements:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>At least 6 characters long</li>
                      <li>Should contain letters and numbers</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Resetting password...
                      </div>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}