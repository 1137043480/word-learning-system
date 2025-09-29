import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Battery, Signal, Wifi } from 'lucide-react';
import { useRouter } from 'next/router';
import { useComprehensiveTracking } from '@/hooks/useTimeTracking';

export default function Component() {
  const [selectedOption, setSelectedOption] = useState("");
  const [pageStartTime] = useState(new Date());
  const router = useRouter();

  // 时间追踪配置
  const tracking = useComprehensiveTracking({
    userId: 'user123', // 在实际应用中从认证系统获取
    wordId: 1, // 当前学习的词汇ID
    moduleType: 'entrance',
    sessionType: 'learning'
  });

  useEffect(() => {
    // 页面加载时记录事件
    tracking.pageTracking.trackPageEnter('word-learning-entrance');
    tracking.trackEvent('vks_test_start', 'entrance', {
      word: '发生',
      startTime: pageStartTime.toISOString()
    });

    return () => {
      // 页面离开时记录事件
      tracking.pageTracking.trackPageLeave('word-learning-entrance');
    };
  }, []);

  const handleOptionChange = (value: string) => {
    console.log('Option selected:', value);
    
    // 记录选项变更
    tracking.interactionTracking.trackSelectionChange('vks-level', selectedOption, value);
    
    if (selectedOption && selectedOption !== value) {
      tracking.trackEvent('option_change', 'vks-radio', {
        from: selectedOption,
        to: value,
        hesitation: true
      });
    }
    
    setSelectedOption(value);
  };

  // VKS测试改编的选项和对应的学习路径
  const learningOptions = [
    { value: "A", text: "I have never seen this word.", path: "/character-learning" },
    { value: "B", text: "I don't know what it means.", path: "/word-learning" },
    { value: "C", text: "I know its meaning, but I don't know its collocations.", path: "/collocation-learning" },
    { value: "D", text: "I know its collocation, but I don't know how to use it in a sentence.", path: "/sentence-learning" },
    { value: "E", text: "I can use it in a sentence.", path: "/exercise" }
  ];

  const handleContinue = async () => {
    console.log('Continue button clicked!', selectedOption);
    
    // 记录按钮点击
    tracking.interactionTracking.trackButtonClick('continue-button', 'CONTINUE', {
      selectedOption,
      timeToDecision: Date.now() - pageStartTime.getTime()
    });
    
    if (selectedOption) {
      const selectedLearning = learningOptions.find(option => option.value === selectedOption);
      console.log('Selected learning path:', selectedLearning);
      if (selectedLearning) {
        try {
          // 记录VKS测试完成
          tracking.trackEvent('vks_test_complete', 'entrance', {
            selectedLevel: selectedOption,
            selectedPath: selectedLearning.path,
            decisionTime: Date.now() - pageStartTime.getTime(),
            totalTime: Date.now() - pageStartTime.getTime()
          });

          // 记录用户选择，用于自适应算法
          localStorage.setItem('learningLevel', selectedOption);
          localStorage.setItem('currentWord', '发生');
          localStorage.setItem('currentWordId', '1');
          console.log('LocalStorage saved successfully');
          
          // 结束当前会话
          await tracking.endSession(true);
          
          // 记录导航事件
          tracking.pageTracking.trackNavigation('word-learning-entrance', selectedLearning.path);
          
          // 跳转到对应的学习页面
          console.log('Navigating to:', selectedLearning.path);
          router.push(selectedLearning.path);
        } catch (error) {
          console.error('Error in handleContinue:', error);
          tracking.trackEvent('error', 'handleContinue', {
            error: error.message,
            selectedOption
          });
          alert('发生错误: ' + error.message);
        }
      }
    } else {
      console.log('No option selected');
      tracking.trackEvent('validation_error', 'continue-button', {
        error: 'no_option_selected'
      });
      alert('请先选择一个选项');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-[320px] h-[640px] bg-black rounded-[40px] overflow-hidden shadow-xl relative">
        {/* iPhone frame */}
        <div className="absolute inset-0 bg-black rounded-[40px]">
          {/* Screen */}
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-orange-100 rounded-[32px] m-3 overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-6 bg-black rounded-b-3xl"></div>
            
            {/* Status Bar */}
            <div className="relative z-10 flex justify-between items-center px-4 pt-1.5 text-black text-xs h-6">
              <span>6:00 PM</span>
              <div className="flex items-center space-x-1">
                <Signal size={14} />
                <Wifi size={14} />
                <Battery size={14} />
              </div>
            </div>

            {/* Content */}
            <div className="h-full pt-6 pb-4 flex flex-col">
              <div className="bg-orange-200 p-3">
                <h1 className="text-lg font-semibold">word learning</h1>
              </div>
              <div className="flex-1 p-3 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg shadow">
                    <p className="text-base mb-2">How about you know 发生?</p>
                    <p className="text-xs text-gray-600">Please choose one choice below and continue to next page.</p>
                    {selectedOption && (
                      <p className="text-xs text-green-600 mt-1">已选择: {selectedOption}</p>
                    )}
                  </div>
                  <RadioGroup value={selectedOption} onValueChange={handleOptionChange} className="space-y-2">
                    {learningOptions.map((option) => (
                      <div key={option.value} className="flex items-center bg-white p-2.5 rounded-lg shadow hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value={option.value} id={option.value} className="mr-2" />
                        <Label htmlFor={option.value} className="text-xs flex-1 cursor-pointer">{option.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <Button 
                  onClick={handleContinue}
                  disabled={!selectedOption}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 text-base rounded-lg mt-3"
                >
                  CONTINUE
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
}
