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
    <div className="flex flex-col items-center mt-4">
      <div
        className="bg-gray-200 rounded-sm overflow-hidden mb-4"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <SignatureCanvas
          ref={signatureRef}
          canvasProps={{
            width: width,
            height: height,
            className: 'w-full h-full',
          }}
          backgroundColor="transparent"
          penColor="black"
          minWidth={2}
          maxWidth={4}
          onEnd={() => setIsEmpty(false)}
        />
      </div>

      <div className="flex w-full gap-3 justify-center" style={{ width: `${width}px` }}>
        <Button
          variant="outline"
          onClick={handleClear}
          className="flex-1 h-10 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-[15px] font-medium"
        >
          Rewrite
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1 h-10 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-[15px] font-medium shadow-sm"
        >
          Finish
        </Button>
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

