import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLearningContext } from '@/src/context/LearningContext';

const UserSwitcher: React.FC = () => {
  const {
    userId,
    setUserId,
    availableUsers,
    apiBaseUrl,
    setApiBaseUrl,
    resetApiBaseUrl,
    usersLoading,
    refreshUsers
  } = useLearningContext();

  const [panelOpen, setPanelOpen] = useState(false);
  const [customUserId, setCustomUserId] = useState(userId);
  const [apiInput, setApiInput] = useState(apiBaseUrl);
  const [recentContext, setRecentContext] = useState<Record<string, { word?: string | null; level?: string | null }>>({});

  useEffect(() => {
    setCustomUserId(userId);
  }, [userId]);

  useEffect(() => {
    setApiInput(apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!panelOpen || typeof window === 'undefined') {
      return;
    }
    const next: Record<string, { word?: string | null; level?: string | null }> = {};
    availableUsers.forEach(user => {
      const word = window.localStorage.getItem(`learning:${user.userId}:currentWord`);
      const level = window.localStorage.getItem(`learning:${user.userId}:learningLevel`);
      next[user.userId] = { word, level };
    });
    setRecentContext(next);
  }, [availableUsers, panelOpen]);

  const handleApplyUser = () => {
    if (customUserId.trim()) {
      setUserId(customUserId.trim());
    }
  };

  const handleApplyApiBase = () => {
    setApiBaseUrl(apiInput);
  };

  const handleRefreshUsers = async () => {
    await refreshUsers();
  };

  const userOptions = useMemo(
    () =>
      availableUsers.map(user => ({
        value: user.userId,
        label: user.username ? `${user.username} (${user.userId})` : user.userId,
        subtitle: recentContext[user.userId]?.word,
        level: recentContext[user.userId]?.level,
        stats: typeof user.wordsStudied === 'number' ? user.wordsStudied : undefined
      })),
    [availableUsers, recentContext]
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 text-sm">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setPanelOpen(!panelOpen)}>
          {panelOpen ? '收起控制台' : '学习控制台'}
        </Button>
      </div>
      {panelOpen && (
        <div className="mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg p-4 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">当前用户</p>
            <select
              value={userId}
              onChange={event => setUserId(event.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {userOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
              <span>{usersLoading ? '同步用户列表中…' : `共 ${availableUsers.length} 个账号`}</span>
              <Button variant="ghost" size="sm" onClick={handleRefreshUsers} disabled={usersLoading}>
                刷新
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500" htmlFor="custom-user-id">
              自定义用户 ID
            </label>
            <div className="flex gap-2">
              <input
                id="custom-user-id"
                value={customUserId}
                onChange={event => setCustomUserId(event.target.value)}
                placeholder="例如 test_user_005"
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleApplyUser}>
                应用
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500" htmlFor="api-base-url">
              API Base URL
            </label>
            <div className="flex gap-2">
              <input
                id="api-base-url"
                value={apiInput}
                onChange={event => setApiInput(event.target.value)}
                placeholder="http://localhost:5004"
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <Button type="button" size="sm" onClick={handleApplyApiBase}>
                保存
              </Button>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={resetApiBaseUrl}>
              使用默认值
            </Button>
          </div>

          {userOptions.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-semibold text-gray-500">近期上下文</p>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {userOptions.map(option => {
                  const subtitle = option.subtitle;
                  const level = option.level;
                  const stats = option.stats;
                  if (!subtitle && !level && (typeof stats !== 'number' || stats === 0)) {
                    return null;
                  }
                  return (
                    <div key={option.value} className="rounded border border-dashed border-gray-200 px-2 py-1">
                      <p className="text-xs font-medium text-gray-700">{option.label}</p>
                      {subtitle && (
                        <p className="text-xs text-gray-500">最后词汇：{subtitle}</p>
                      )}
                      {level && (
                        <p className="text-xs text-gray-500">VKS 等级：{level}</p>
                      )}
                      {typeof stats === 'number' && stats > 0 && (
                        <p className="text-xs text-gray-500">掌握词汇数：{stats}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSwitcher;
