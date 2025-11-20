/**
 * 系统状态检查页面
 * 检查所有服务状态并提供功能导航
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { buildApiUrl, getApiBaseUrl } from "@/src/lib/apiClient";

interface ServiceStatus {
  name: string;
  url: string;
  status: 'checking' | 'online' | 'offline' | 'error';
  responseTime?: number;
  version?: string;
  error?: string;
}

const SystemStatus: React.FC = () => {
  const router = useRouter();
  const apiBaseUrl = getApiBaseUrl();
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Next.js 前端服务', url: 'http://localhost:3000/', status: 'checking' },
    { name: '第二阶段 API', url: `${apiBaseUrl}/api/stats`, status: 'checking' },
    { name: '第一阶段 API (5002)', url: 'http://localhost:5002/', status: 'checking' },
    { name: '原始 API (5001)', url: 'http://localhost:5001/', status: 'checking' },
  ]);
  
  const [isChecking, setIsChecking] = useState(false);

  const checkServiceStatus = async (service: ServiceStatus): Promise<ServiceStatus> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(service.url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        let version = 'Unknown';
        try {
          const data = await response.json();
          version = data.version || data.message || 'Running';
        } catch {
          version = 'Running';
        }
        
        return {
          ...service,
          status: 'online',
          responseTime,
          version,
        };
      } else {
        return {
          ...service,
          status: 'error',
          responseTime,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        ...service,
        status: 'offline',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const checkAllServices = async () => {
    setIsChecking(true);
    
    const updatedServices = await Promise.all(
      services.map(service => checkServiceStatus(service))
    );
    
    setServices(updatedServices);
    setIsChecking(false);
  };

  useEffect(() => {
    checkAllServices();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'offline':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500">在线</Badge>;
      case 'offline':
        return <Badge variant="destructive">离线</Badge>;
      case 'error':
        return <Badge variant="secondary" className="bg-yellow-500">错误</Badge>;
      default:
        return <Badge variant="outline">检查中</Badge>;
    }
  };

  const navigateToFeature = (path: string) => {
    router.push(path);
  };

  const mainFeatures = [
    {
      title: '🎯 第二阶段功能演示',
      description: '查看自适应推荐、学习分析等核心功能',
      path: '/phase2-demo',
      requiresApi: true,
    },
    {
      title: '📊 学习分析Dashboard',
      description: '完整的学习数据可视化和智能分析',
      path: '/learning-stats',
      requiresApi: true,
    },
    {
      title: '⏱️ 时间追踪演示',
      description: '精确的学习行为追踪和数据记录',
      path: '/time-tracking-demo',
      requiresApi: false,
    },
    {
      title: '🚀 开始自适应学习',
      description: 'VKS测试引导的个性化学习体验',
      path: '/word-learning-entrance',
      requiresApi: false,
    },
  ];

  const apiEndpoints = [
    {
      name: '系统统计',
      endpoint: '/api/stats',
      description: '获取系统整体运行统计',
    },
    {
      name: '智能推荐',
      endpoint: '/api/adaptive/recommendation/test_user_001',
      description: '获取个性化学习推荐',
    },
    {
      name: '学习Dashboard数据',
      endpoint: '/api/analytics/user/test_user_001/dashboard',
      description: '获取学习分析数据',
    },
    {
      name: '到期复习',
      endpoint: '/api/review/user/test_user_001/due',
      description: '获取需要复习的内容',
    },
  ];

  const phase2ApiOnline = services.find(s => s.name.includes('第二阶段'))?.status === 'online';

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 页面标题 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🖥️ 自适应学习系统状态</span>
              <Button 
                onClick={checkAllServices} 
                disabled={isChecking}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                刷新状态
              </Button>
            </CardTitle>
            <CardDescription>
              检查所有服务状态并快速访问系统功能
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 服务状态 */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 服务状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      <p className="text-sm text-gray-500">{service.url}</p>
                      {service.error && (
                        <p className="text-sm text-red-500">错误: {service.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {service.responseTime && (
                      <span className="text-sm text-gray-500">{service.responseTime}ms</span>
                    )}
                    {getStatusBadge(service.status)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 启动指引 */}
            {!phase2ApiOnline && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  第二阶段API服务未运行。请在终端执行以下命令启动：
                  <br />
                  <code className="bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                    python app_phase2.py
                  </code>
                  <br />
                  或者运行启动脚本：
                  <code className="bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                    ./start_system.sh
                  </code>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 主要功能入口 */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 主要功能</CardTitle>
            <CardDescription>快速访问系统的核心功能模块</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mainFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    feature.requiresApi && !phase2ApiOnline 
                      ? 'bg-gray-100 opacity-60' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => feature.requiresApi && !phase2ApiOnline ? null : navigateToFeature(feature.path)}
                >
                  <h3 className="font-medium mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                  {feature.requiresApi && !phase2ApiOnline && (
                    <p className="text-sm text-red-500 mt-2">需要第二阶段API服务</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API测试 */}
        {phase2ApiOnline && (
          <Card>
            <CardHeader>
              <CardTitle>🔌 API接口测试</CardTitle>
              <CardDescription>测试第二阶段核心API功能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {apiEndpoints.map((api, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded bg-white">
                    <div>
                      <h4 className="font-medium">{api.name}</h4>
                      <p className="text-sm text-gray-500">{api.description}</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        GET {buildApiUrl(api.endpoint)}
                      </code>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(buildApiUrl(api.endpoint), '_blank')}
                    >
                      测试
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 系统信息 */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ 系统信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">🎨 第一阶段功能</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 毫秒级时间追踪</li>
                  <li>• 详细行为记录</li>
                  <li>• 学习会话管理</li>
                  <li>• 练习数据记录</li>
                  <li>• 用户进度跟踪</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-green-600">⚙️ 第二阶段功能</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 智能推荐引擎</li>
                  <li>• 间隔重复算法</li>
                  <li>• 学习分析Dashboard</li>
                  <li>• 个性化学习路径</li>
                  <li>• 自适应复习调度</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🎯 使用建议</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. 确保第二阶段API服务在运行 (http://localhost:5004)</li>
                <li>2. 访问"第二阶段功能演示"了解所有新功能</li>
                <li>3. 体验"学习分析Dashboard"查看数据可视化</li>
                <li>4. 通过"开始自适应学习"体验完整学习流程</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* 底部导航 */}
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/')}>
            返回首页
          </Button>
          <Button onClick={() => checkAllServices()}>
            重新检查状态
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
