import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/router';

export default function DebugTest() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('点击测试按钮');
  const router = useRouter();

  const handleClick = () => {
    setCount(count + 1);
    setMessage(`按钮被点击了 ${count + 1} 次！`);
    console.log('按钮点击事件触发');
  };

  const handleNavigation = () => {
    router.push('/word-learning-entrance');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">交互测试页面</h1>
        
        <div className="space-y-4">
          <div>
            <p className="text-lg">{message}</p>
            <p className="text-sm text-gray-600">计数: {count}</p>
          </div>
          
          <Button 
            onClick={handleClick}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2"
          >
            测试点击事件
          </Button>
          
          <Button 
            onClick={handleNavigation}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2"
          >
            测试路由跳转
          </Button>
          
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold">测试说明:</h3>
            <ul className="text-sm mt-2 space-y-1">
              <li>• 第一个按钮应该更新计数和消息</li>
              <li>• 第二个按钮应该跳转到学习入口页面</li>
              <li>• 如果都能正常工作，说明交互功能正常</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

