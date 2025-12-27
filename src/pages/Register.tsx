import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Building2 } from 'lucide-react';
import { AuthLayout } from '../components/auth';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export function Register() {
  const { signUp, signInWithGoogle, signInWithGithub } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyName: '',
    companySize: '',
    agreeToTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      // Validate password requirements
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (!/[A-Z]/.test(formData.password)) {
        setError('Password must contain at least one uppercase letter');
        return;
      }
      if (!/[0-9]/.test(formData.password)) {
        setError('Password must contain at least one number');
        return;
      }
      setError(null);
      setStep(2);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error } = await signUp(formData.email, formData.password, {
      full_name: formData.fullName,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      // Show success message and redirect to login
      navigate('/login', {
        state: { message: 'Check your email to confirm your account!' }
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    const { error } = await signInWithGithub();
    if (error) {
      setError(error.message);
    }
  };

  return (
    <AuthLayout
      title={step === 1 ? 'Create your account' : 'Set up your workspace'}
      subtitle={step === 1 ? 'Start your 14-day free trial' : 'Tell us about your organization'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <>
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Work email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (min. 8 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
                  One uppercase letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                  One number
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Company Name */}
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Company or organization name"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team size
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['1-5', '6-20', '21-50', '51-200', '201-1000', '1000+'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFormData({ ...formData, companySize: size })}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      formData.companySize === size
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {size} people
                  </button>
                ))}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                required
              />
              <span className="text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                  Privacy Policy
                </Link>
              </span>
            </label>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {step === 2 && (
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
          )}
          <Button type="submit" className="flex-1" size="lg" isLoading={isLoading}>
            {step === 1 ? 'Continue' : 'Create account'}
          </Button>
        </div>

        {step === 1 && (
          <>
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={handleGithubSignIn}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </button>
            </div>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
                Sign in
              </Link>
            </p>
          </>
        )}
      </form>
    </AuthLayout>
  );
}
