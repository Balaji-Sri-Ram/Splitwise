import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { useState } from 'react';

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const loginStore = useAuthStore((state) => state.login);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/auth/register', data);
      loginStore(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-charcoal">Create an account</h1>
        <p className="text-graphite mt-2">Start splitting expenses with your friends.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Full Name</label>
          <input
            {...register('name', { required: 'Name is required' })}
            type="text"
            className="w-full px-4 py-2 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-bg-base"
            placeholder="Ram Parasa"
          />
          {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
          <input
            {...register('email', { required: 'Email is required' })}
            type="email"
            className="w-full px-4 py-2 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-bg-base"
            placeholder="you@example.com"
          />
          {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Password</label>
          <input
            {...register('password', { 
              required: 'Password is required',
              minLength: { value: 6, message: 'Minimum 6 characters' }
            })}
            type="password"
            className="w-full px-4 py-2 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-bg-base"
            placeholder="••••••••"
          />
          {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password.message}</span>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-light text-white font-medium py-2.5 rounded-lg transition-colors mt-2"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-graphite">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
