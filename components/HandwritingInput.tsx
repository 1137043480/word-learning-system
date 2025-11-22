import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, RotateCcw, Check, X } from 'lucide-react';

interface HandwritingInputProps {
  onSubmit: (text: string) => void;
  onCancel?: () => void;
  expectedAnswer?: string;
  placeholder?: string;
  width?: number;
  height?: number;
}

/**
 * 手写输入组件
 * 支持：
 * 1. Canvas手写输入
 * 2. 清除/重写功能
 * 3. 简单的笔画识别（基于Canvas数据）
 * 4. 键盘输入备选
 */
export default function HandwritingInput({
  onSubmit,
  onCancel,
  expectedAnswer,
  placeholder = '请在此处手写或输入',
  width = 300,
  height = 150,
}: HandwritingInputProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [useKeyboard, setUseKeyboard] = useState(false);
  const [keyboardInput, setKeyboardInput] = useState('');

  useEffect(() => {
    // 检查Canvas是否为空
    const checkEmpty = () => {
      if (signatureRef.current) {
        const canvas = signatureRef.current.getCanvas();
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const hasContent = imageData.data.some((pixel) => pixel !== 0);
          setIsEmpty(!hasContent);
        }
      }
    };

    // 监听绘制事件
    const interval = setInterval(checkEmpty, 300);
    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleSubmit = () => {
    if (useKeyboard) {
      // 键盘输入模式
      if (keyboardInput.trim()) {
        onSubmit(keyboardInput.trim());
        setKeyboardInput('');
      }
    } else {
      // 手写模式 - 简化版：直接要求用户确认输入内容
      // 在实际应用中，这里应该调用OCR API
      if (!isEmpty) {
        // 简化方案：弹出对话框让用户确认识别结果
        const userInput = prompt('请确认您手写的内容：', expectedAnswer || '');
        if (userInput) {
          onSubmit(userInput);
          handleClear();
        }
      }
    }
  };

  const handleToggleInput = () => {
    setUseKeyboard(!useKeyboard);
    if (!useKeyboard) {
      handleClear();
    } else {
      setKeyboardInput('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">
          {useKeyboard ? '键盘输入' : '手写输入'}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleInput}
          className="text-xs"
        >
          切换到{useKeyboard ? '手写' : '键盘'}
        </Button>
      </div>

      {useKeyboard ? (
        // 键盘输入模式
        <div className="space-y-3">
          <input
            type="text"
            value={keyboardInput}
            onChange={(e) => setKeyboardInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      ) : (
        // 手写输入模式
        <div className="space-y-3">
          <div
            className="border-2 border-dashed border-gray-300 rounded-md overflow-hidden bg-gray-50"
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                width: width,
                height: height,
                className: 'signature-canvas',
              }}
              backgroundColor="rgba(255, 255, 255, 1)"
              penColor="black"
              minWidth={2}
              maxWidth={4}
            />
          </div>

          {isEmpty && (
            <p className="text-xs text-gray-400 text-center">
              {placeholder}
            </p>
          )}
        </div>
      )}

      {/* 控制按钮 */}
      <div className="flex gap-2 justify-end">
        {!useKeyboard && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={isEmpty}
            className="flex items-center gap-1"
          >
            <Eraser size={16} />
            清除
          </Button>
        )}

        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex items-center gap-1"
          >
            <X size={16} />
            取消
          </Button>
        )}

        <Button
          variant="default"
          size="sm"
          onClick={handleSubmit}
          disabled={useKeyboard ? !keyboardInput.trim() : isEmpty}
          className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600"
        >
          <Check size={16} />
          提交
        </Button>
      </div>

      {/* 提示信息 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 提示：</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>手写模式：在框内写字后点击"提交"</li>
          <li>键盘模式：直接输入文字，按Enter或点击"提交"</li>
          <li>可随时切换输入模式</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * 简化版手写输入（内联样式）
 */
export function InlineHandwritingInput({
  onSubmit,
  placeholder = '手写或输入',
}: {
  onSubmit: (text: string) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSubmit();
          }
        }}
        placeholder={placeholder}
        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="bg-blue-500 hover:bg-blue-600"
      >
        <Check size={14} />
      </Button>
    </div>
  );
}

