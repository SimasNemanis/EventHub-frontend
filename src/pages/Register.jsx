import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { eventhub } from "@/api/eventhubClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Lock, Mail, User, AlertCircle, CheckCircle } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("At least one uppercase letter (A-Z)");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("At least one lowercase letter (a-z)");
    }
    if (!/\d/.test(password)) {
      errors.push("At least one number (0-9)");
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passErrors = validatePassword(formData.password);
    if (passErrors.length > 0) {
      setError("Password does not meet requirements");
      setPasswordErrors(passErrors);
      return;
    }

    setLoading(true);

    try {
      console.log('Registering user:', formData.email);
      const response = await eventhub.auth.register(
        formData.fullName,
        formData.email,
        formData.password
      );
      
      console.log('Registration response:', response);
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        navigate('/login');
      }, 500);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || "Failed to register. Please try again.");
      setLoading(false);
    }
  };

  const passwordStrength = (password) => {
    if (!password) return null;
    if (password.length < 6) return { label: "Weak", color: "red" };
    if (password.length < 10) return { label: "Medium", color: "yellow" };
    return { label: "Strong", color: "green" };
  };

  const strength = passwordStrength(formData.password);
  const currentPasswordErrors = formData.password ? validatePassword(formData.password) : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="max-w-md w-full mx-4">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: 'var(--md-primary, #6366f1)' }}>
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join EventHub to manage events and resources</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 mb-2 block">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="pl-10"
                  required
                />
              </div>
              {strength && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all`}
                        style={{ 
                          width: strength.label === 'Weak' ? '33%' : strength.label === 'Medium' ? '66%' : '100%',
                          backgroundColor: strength.color === 'red' ? '#ef4444' : strength.color === 'yellow' ? '#eab308' : '#22c55e'
                        }}
                      />
                    </div>
                    <span className={`text-xs font-medium`} style={{ color: strength.color === 'red' ? '#dc2626' : strength.color === 'yellow' ? '#ca8a04' : '#16a34a' }}>
                      {strength.label}
                    </span>
                  </div>
                  {currentPasswordErrors.length > 0 && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-medium">Password requirements:</p>
                      {currentPasswordErrors.map((err, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-red-500">✗</span>
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="pl-10"
                  required
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="w-4 h-4 mt-0.5 rounded" required />
              <span className="text-gray-600">
                I agree to the{' '}
                <a href="#" className="font-medium" style={{ color: 'var(--md-primary, #6366f1)' }}>
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="#" className="font-medium" style={{ color: 'var(--md-primary, #6366f1)' }}>
                  Privacy Policy
                </a>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-medium ripple material-button transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--md-primary, #6366f1)' }}
              onMouseEnter={(e) => !loading && (e.target.style.opacity = '0.9')}
              onMouseLeave={(e) => !loading && (e.target.style.opacity = '1')}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium" style={{ color: 'var(--md-primary, #6366f1)' }}>
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2026 EventHub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
