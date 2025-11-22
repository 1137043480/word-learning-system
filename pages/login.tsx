import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Battery, Signal, Wifi, Eye, EyeOff } from 'lucide-react';
import { buildApiUrl } from "@/src/lib/apiClient";

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember_me: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // 允许cookie
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        // 保存session token到localStorage
        localStorage.setItem('session_token', result.data.session_token);
        localStorage.setItem('user_id', result.data.user_id);
        localStorage.setItem('username', result.data.username);

        // 跳转到首页
        router.push('/');
      } else {
        setError(result.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

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
                <h1 className="text-xl font-bold">用户登录</h1>
                <p className="text-xs text-gray-700 mt-1">
                  登录您的账户开始学习
                </p>
              </div>

              {/* Form */}
              <div className="flex-1 p-3 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
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
                          用户名或邮箱
                        </Label>
                        <input
                          id="username"
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="输入用户名或邮箱"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="password" className="text-sm">
                          密码
                        </Label>
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                            placeholder="输入密码"
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

                      <div className="flex items-center">
                        <input
                          id="remember"
                          type="checkbox"
                          checked={formData.remember_me}
                          onChange={(e) => setFormData({ ...formData, remember_me: e.target.checked })}
                          className="mr-2"
                        />
                        <Label htmlFor="remember" className="text-xs cursor-pointer">
                          记住我（7天内免登录）
                        </Label>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg"
                  >
                    {loading ? '登录中...' : '登录'}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => router.push('/register')}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      还没有账户？立即注册
                    </button>
                  </div>

                  <Card className="bg-blue-50 border-blue-300">
                    <CardContent className="p-3">
                      <p className="text-xs text-blue-800 mb-1">
                        💡 <strong>测试账号提示</strong>
                      </p>
                      <p className="text-xs text-blue-700">
                        所有现有测试用户默认密码：<code className="bg-blue-200 px-1 rounded">password123</code>
                      </p>
                    </CardContent>
                  </Card>
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

export default Login;

