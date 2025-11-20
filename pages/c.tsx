import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Battery, Signal, Wifi } from 'lucide-react'; // 确保安装了 lucide-react 模块
import Link from 'next/link';

export default function Component() {
  const [selectedOption, setSelectedOption] = useState("");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-[375px] h-[812px] bg-black rounded-[50px] overflow-hidden shadow-xl relative">
        {/* iPhone frame */}
        <div className="absolute inset-0 bg-black rounded-[50px]">
          {/* Screen */}
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-orange-100 rounded-[40px] m-3 overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[40%] h-7 bg-black rounded-b-3xl"></div>
            
            {/* Status Bar */}
            <div className="relative z-10 flex justify-between items-center px-6 pt-2 text-black text-sm h-7">
              <span>6:00 PM</span>
              <div className="flex items-center space-x-1">
                <Signal size={16} />
                <Wifi size={16} />
                <Battery size={16} />
              </div>
            </div>

            {/* Content */}
            <div className="h-full pt-8 pb-6 flex flex-col">
              <div className="bg-orange-200 p-4">
                <h1 className="text-xl font-semibold">word learning</h1>
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-lg mb-2">How about you know 发生?</p>
                    <p className="text-sm text-gray-600">Please choose one choice below and continue to next page.</p>
                  </div>
                  <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-2">
                    {[
                      "I have never seen this word.",
                      "I don't know what it means.",
                      "I know its meaning, but I don't know its collocations.",
                      "I know its collocation, but I don't know how to use it in a sentence.",
                      "I can use it in a sentence."
                    ].map((option, index) => (
                      <div key={index} className="flex items-center bg-white p-3 rounded-lg shadow">
                        <RadioGroupItem value={String.fromCharCode(65 + index)} id={String.fromCharCode(65 + index)} className="mr-3" />
                        <Label htmlFor={String.fromCharCode(65 + index)} className="text-sm flex-1">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg rounded-lg mt-4">
                  CONTINUE
                </Button>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}