import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: '🚀',
      title: '课件导航',
      description: '浏览和管理您的课件组',
      path: '/navigation',
      gradient: 'from-blue-400 to-cyan-400',
    },
    {
      icon: '⚙️',
      title: '配置中心',
      description: '管理仓库和上传课件',
      path: '/config',
      gradient: 'from-amber-400 to-orange-400',
    }
  ];

  const steps = [
    {
      emoji: '1️⃣',
      title: '添加课件',
      description: '前往配置中心绑定您的 GitHub/Gitee 仓库，或直接上传本地课件文件',
      bgColor: 'bg-blue-50/80',
      textColor: 'text-blue-600',
    },
    {
      emoji: '2️⃣',
      title: '浏览课件',
      description: '在课件导航中选择课件组，浏览您的课件',
      bgColor: 'bg-green-50/80',
      textColor: 'text-green-600',
    },
    {
      emoji: '3️⃣',
      title: '开始播放',
      description: '点击任意课件组即可进入沉浸式播放模式，享受无干扰的教学体验',
      bgColor: 'bg-amber-50/80',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <div className="min-h-screen gradient-bg p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            欢迎使用 Reedu 课件系统
          </h1>
          <p className="text-xl text-white/90 mb-6">
            {isAuthenticated && user?.email
              ? `你好，${user.email.split('@')[0]}！开始您的教学之旅`
              : '欢迎使用！开始您的教学之旅'}
          </p>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-3 glass-card hover:bg-white/90 text-gray-800 font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
            >
              登录以使用云端同步
            </button>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 animate-slide-up">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={() => navigate(feature.path)}
              className="glass-card-hover cursor-pointer p-8 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`text-6xl mb-2 animate-float bg-gradient-to-br ${feature.gradient} p-4 rounded-2xl shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 group-hover:gradient-text transition-all">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Start Guide */}
        <div className="glass-card p-8 md:p-12 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <span className="text-4xl">▶️</span> 快速开始
            </h2>
          </div>

          <div className="space-y-6 mb-8">
            <p className="text-lg text-center text-gray-700">
              👋 欢迎使用 Reedu 课件系统！以下是使用步骤：
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`${step.bgColor} backdrop-blur-sm p-6 rounded-2xl border border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                >
                  <h3 className={`text-2xl font-bold ${step.textColor} mb-3 flex items-center gap-2`}>
                    <span>{step.emoji}</span> {step.title}
                  </h3>
                  <p className="text-gray-700">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/config')}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center gap-2"
            >
              <span>⚙️</span> 立即配置
            </button>
            <button
              onClick={() => navigate('/navigation')}
              className="px-8 py-4 glass border-2 border-white/40 text-gray-800 font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:bg-white/20 flex items-center gap-2"
            >
              <span>🚀</span> 浏览课件
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-white/70 text-sm">
            Reedu 课件系统 © 2025 - 让教学更简单
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
