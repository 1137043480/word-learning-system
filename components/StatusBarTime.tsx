import { useEffect, useState } from 'react';

/**
 * 状态栏时钟。时间只在客户端挂载后渲染，
 * 避免 SSR 烙入构建时时间导致 React 水合不一致。
 */
export default function StatusBarTime() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, []);

  return <span>{time}</span>;
}
