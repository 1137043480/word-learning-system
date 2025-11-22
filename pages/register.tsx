import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Battery, Signal, Wifi, Eye, EyeOff } from 'lucide-react';
import { buildApiUrl } from "@/src/lib/apiClient";

const Register = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    native_language: 'English'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 客户端验证
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少6个字符');
      return;
    }

    if (!formData.username.trim()) {
      setError('用户名不能为空');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email || null,
          native_language: formData.native_language
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        // 3秒后自动跳转到登录页
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(result.error || '注册失败');
      }
    } catch (err) {
      setError('网络错误，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-[320px] h-[640px] bg-black rounded-[40px] overflow-hidden shadow-xl relative">
          <div className="absolute inset-0 bg-black rounded-[40px]">
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-orange-100 rounded-[32px] m-3 overflow-hidden">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-6 bg-black rounded-b-3xl"></div>
              
              <div className="h-full flex flex-col items-center justify-center p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">注册成功！</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    您的账户已创建成功
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    即将跳转到登录页面...
                  </p>
                  <Button
                    onClick={() => router.push('/login')}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    立即登录
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-[320px] h-[640px] bg-black rounded-[40px] overflow-hidden shadow-xl relative">
        <div className="absolute inset-0 bg-black rounded-[40px]">
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-orange-100 rounded-[32px] m-3 overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-6 bg-black rounded-b-3xl"></div>

            {/* Status Bar */}
            <div className="relative z-10 flex justify-between items-center px-4 pt-1.5 text-black text-xs h-6">
              <span>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              <div className="flex items-center space-x-1">
                <Signal size={14} />
                <Wifi size={14} />
                <Battery size={14} />
              </div>
            </div>

            {/* Content */}
            <div className="h-full pt-6 pb-4 flex flex-col">
              {/* Header */}
              <div className="bg-orange-200 p-3">
                <h1 className="text-xl font-bold">用户注册</h1>
                <p className="text-xs text-gray-700 mt-1">
                  创建新账户
                </p>
              </div>

              {/* Form */}
              <div className="flex-1 p-3 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && (
                    <Card className="border-red-300 bg-red-50">
                      <CardContent className="p-3">
                        <p className="text-xs text-red-600">❌ {error}</p>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardContent className="p-3 space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="username" className="text-sm">
                          用户名 <span className="text-red-500">*</span>
                        </Label>
                        <input
                          id="username"
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="输入用户名"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="email" className="text-sm">
                          邮箱（可选）
                        </Label>
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="输入邮箱"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="password" className="text-sm">
                          密码 <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                            placeholder="至少6个字符"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="confirmPassword" className="text-sm">
                          确认密码 <span className="text-red-500">*</span>
                        </Label>
                        <input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="再次输入密码"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="language" className="text-sm">
                          母语
                        </Label>
                        <select
                          id="language"
                          value={formData.native_language}
                          onChange={(e) => setFormData({ ...formData, native_language: e.target.value })}
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Español</option>
                          <option value="French">Français</option>
                          <option value="German">Deutsch</option>
                          <option value="Japanese">日本語</option>
                          <option value="Korean">한국어</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg"
                  >
                    {loading ? '注册中...' : '注册'}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      已有账户？立即登录
                    </button>
                  </div>
                </form>
              </div>

              {/* Bottom Actions */}
              <div className="p-3 pt-0">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  返回首页
                </Button>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

