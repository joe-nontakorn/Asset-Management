// File: src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import JastelLogo from "../assets/jastel.jpg";

const apiUrl = import.meta.env.VITE_API_URL;

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // ✅ Login successful
      localStorage.setItem("token", data.token);
      localStorage.setItem("login_time", Date.now().toString());

      navigate("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">

      {/* ✅ Logo ด้านบนสุด และอยู่กลาง */}
      <div className="mb-6 mt-4">
        <img
          src={JastelLogo}
          alt="Jastel Logo"
          className="w-50 h-25  "
        />
        <p className="text-center text-white">Asset Management System</p>

      </div>
      <div className="bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-200 shadow-2xl rounded-2xl px-10 pt-8 pb-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">

          <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
            Sign in to your Jastel account
          </p>
        </div>

        <form onSubmit={handleLogin} autoComplete="on" className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          {/* Username Field */}
          <div className="space-y-2">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 text-gray-900 dark:text-gray-200" // 👈 เพิ่มตรงนี้
                placeholder="Enter your username"
                required
              />

            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 py-3 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 text-gray-900 dark:text-gray-200" // 👈 เพิ่มตรงนี้
                placeholder="Enter your password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Sign In
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Powered by{' '}
            <span className="text-blue-600 font-semibold">
              Jastel
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;