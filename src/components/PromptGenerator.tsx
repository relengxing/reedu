import React, { useState } from 'react';
import { Input, Button, message, Select } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { PROMPT_TEMPLATES, generatePrompt, type PromptType } from '../utils/promptTemplates';

const { TextArea } = Input;
const { Option } = Select;

const PromptGenerator: React.FC = () => {
  const [userRequirement, setUserRequirement] = useState('');
  const [promptType, setPromptType] = useState<PromptType>('courseware');
  const [copied, setCopied] = useState(false);

  const getCurrentPrompt = () => {
    return generatePrompt(promptType, userRequirement);
  };

  const handleCopy = () => {
    const prompt = getCurrentPrompt();
    navigator.clipboard.writeText(prompt).then(() => {
      message.success('提示词已复制到剪贴板！');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const prompt = getCurrentPrompt();
  
  // 获取当前选择的模板信息
  const currentTemplate = PROMPT_TEMPLATES.find(t => t.type === promptType);

  return (
    <div className="glass-card p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">课件生成提示词工具</h3>
          <p className="text-gray-600">
            选择课件类型，输入具体要求，系统会自动生成包含技术规范的完整提示词供大模型使用。
          </p>
        </div>

        {/* Type Selection */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">选择课件类型：</h4>
          <Select
            value={promptType}
            onChange={(value) => setPromptType(value)}
            className="w-full"
            size="large"
          >
            {PROMPT_TEMPLATES.map(template => (
              <Option key={template.type} value={template.type}>
                <div className="py-1">
                  <div className="font-semibold">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.description}</div>
                </div>
              </Option>
            ))}
          </Select>
          {currentTemplate && (
            <div className="mt-2 p-3 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-200/50">
              <p className="text-sm text-gray-700">{currentTemplate.description}</p>
            </div>
          )}
        </div>

        {/* User Requirements */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">您的具体要求：</h4>
          <TextArea
            rows={6}
            placeholder={
              promptType === 'catalog' ? '例如：生成初中数学七年级上册完整目录...' :
              promptType === 'courseware' ? '例如：生成一个关于二元一次方程组的数学课件，包含实际问题应用...' :
              promptType === 'practice' ? '例如：生成10道关于一元二次方程的随堂练习题，难度适中...' :
              '例如：生成5道关于函数的课后作业题，包含综合应用题...'
            }
            value={userRequirement}
            onChange={(e) => setUserRequirement(e.target.value)}
            className="rounded-lg"
          />
        </div>

        {/* Generated Prompt */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-800">完整提示词：</h4>
            <Button
              type="primary"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
              size="large"
              className="rounded-lg"
            >
              {copied ? '已复制' : '复制提示词'}
            </Button>
          </div>
          <TextArea
            rows={20}
            value={prompt}
            readOnly
            className="font-mono text-sm rounded-lg"
          />
        </div>

        {/* Instructions */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">使用说明：</h4>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1 pt-1">
                <p className="font-semibold text-gray-800">选择类型</p>
                <p className="text-gray-600 text-sm">根据需要选择课件类型（目录页、课件内容、随堂练习、课后作业）</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="flex-1 pt-1">
                <p className="font-semibold text-gray-800">填写要求</p>
                <p className="text-gray-600 text-sm">在输入框中填写您对课件的具体要求</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1 pt-1">
                <p className="font-semibold text-gray-800">复制提示词</p>
                <p className="text-gray-600 text-sm">点击"复制提示词"按钮，将生成的提示词复制到剪贴板</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <div className="flex-1 pt-1">
                <p className="font-semibold text-gray-800">生成课件</p>
                <p className="text-gray-600 text-sm">将提示词提供给大模型（如ChatGPT、Claude、Deepseek等）生成课件</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-400 to-rose-400 rounded-full flex items-center justify-center text-white font-bold">
                5
              </div>
              <div className="flex-1 pt-1">
                <p className="font-semibold text-gray-800">导入课件</p>
                <p className="text-gray-600 text-sm">生成完成后，在"本地上传课件"标签页导入生成的HTML文件</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50">
            <div className="flex gap-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 mb-1">提示</p>
                <p className="text-gray-700 text-sm">
                  不同类型的课件有不同的要求和格式。选择正确的类型可以生成更符合需求的课件。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptGenerator;
