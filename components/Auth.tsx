import React, { useState } from 'react';
import { User, Theme } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  theme: Theme;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, theme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simulated Database Retrieval
    const dbString = localStorage.getItem('dailyflow_db_users');
    const usersDB: any[] = dbString ? JSON.parse(dbString) : [];

    if (isLogin) {
      // LOGIN LOGIC
      if (!email || !password) {
        setError("Please fill in all fields.");
        return;
      }

      const foundUser = usersDB.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        // Successful Login
        const user: User = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          isGuest: false,
        };
        onLogin(user);
      } else {
        setError("Invalid email or password. Please try again or sign up.");
      }

    } else {
      // SIGN UP LOGIC
      if (!name || !email || !password || !confirmPassword) {
        setError("Please fill in all fields.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      const existingUser = usersDB.find(u => u.email === email);
      if (existingUser) {
        setError("User already exists. Please log in.");
        return;
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // In a real app, never store plain text passwords!
      };

      // Save to "Database"
      usersDB.push(newUser);
      localStorage.setItem('dailyflow_db_users', JSON.stringify(usersDB));

      // Auto login after signup
      const user: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isGuest: false,
      };
      onLogin(user);
    }
  };

  const handleGuest = () => {
    onLogin({
      id: 'guest',
      name: 'Guest',
      isGuest: true,
    });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className={`${theme.primaryClass} p-8 text-center transition-colors duration-300`}>
          <h1 className="text-3xl font-bold text-white mb-2">DailyFlow</h1>
          <p className="text-blue-100">Organize your life with intelligence.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200 animate-pulse">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:outline-none ${theme.ringClass} transition-all`}
                  placeholder="Your Name"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:outline-none ${theme.ringClass} transition-all`}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:outline-none ${theme.ringClass} transition-all`}
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:outline-none ${theme.ringClass} transition-all`}
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-lg text-white font-medium ${theme.primaryClass} ${theme.hoverClass} transition-colors shadow-md`}
            >
              {isLogin ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <button
              onClick={handleGuest}
              className="mt-6 w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Continue as Guest
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className={`font-medium ${theme.textClass} hover:underline`}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};