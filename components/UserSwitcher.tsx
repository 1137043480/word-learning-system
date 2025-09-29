import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLearningContext } from '@/src/context/LearningContext';

const UserSwitcher: React.FC = () => {
  const {
    userId,
    setUserId,
    availableUsers,
    apiBaseUrl,
    setApiBaseUrl,
    resetApiBaseUrl
  } = useLearningContext();

  const [panelOpen, setPanelOpen] = useState(false);
  const [customUserId, setCustomUserId] = useState(userId);
  const [apiInput, setApiInput] = useState(apiBaseUrl);

  useEffect(() => {
    setCustomUserId(userId);
  }, [userId]);

  useEffect(() => {
    setApiInput(apiBaseUrl);
  }, [apiBaseUrl]);

  const handleApplyUser = () => {
    if (customUserId.trim()) {
      setUserId(customUserId.trim());
    }
  };

  const handleApplyApiBase = () => {
    setApiBaseUrl(apiInput);
  };

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
              {availableUsers.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
        </div>
      )}
    </div>
  );
};

export default UserSwitcher;

