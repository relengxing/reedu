import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseware } from '../context/CoursewareContext';
import ManagementLayout from '../components/ManagementLayout';

const NavigationPage: React.FC = () => {
  const navigate = useNavigate();
  const { bundledCoursewareGroups, coursewares, addBundledCourseware, isLoading } = useCourseware();
  const [pendingNavigation, setPendingNavigation] = useState<{ sourcePath: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const prevCoursewaresLengthRef = useRef(coursewares.length);
  
  // 不再在这里手动调用 loadUserRepos，由 CoursewareContext 统一管理加载时机

  // 监听coursewares变化，当新课件添加完成后自动跳转
  useEffect(() => {
    if (pendingNavigation && coursewares.length > prevCoursewaresLengthRef.current) {
      // 找到新添加的课件索引
      const targetIndex = coursewares.findIndex(cw => cw.sourcePath === pendingNavigation.sourcePath);
      if (targetIndex >= 0) {
        const courseware = coursewares[targetIndex];
        // 构建语义化URL
        if (courseware.platform && courseware.owner && courseware.repo && courseware.filePath) {
          const courseFileName = courseware.filePath.split('/').pop()?.replace('.html', '') || '';
          const folder = courseware.groupId || '';
          navigate(`/${courseware.platform}/${courseware.owner}/${courseware.repo}/${folder}/${courseFileName}/0`);
        } else {
          navigate(`/player/${targetIndex}/0`);
        }
        setPendingNavigation(null);
      }
    }
    prevCoursewaresLengthRef.current = coursewares.length;
  }, [coursewares, pendingNavigation, navigate]);

  // 处理点击课件组，进入该组的第一页
  const handleGroupClick = (group: typeof bundledCoursewareGroups[0]) => {
    if (group.coursewares.length === 0) {
      return;
    }

    const firstCourseware = group.coursewares[0];
    
    // 使用语义化URL跳转
    if (firstCourseware.platform && firstCourseware.owner && firstCourseware.repo && firstCourseware.filePath) {
      // 构建语义化URL: /platform/owner/repo/folder/course
      const pathParts = firstCourseware.filePath.split('/');
      const courseFileName = pathParts[pathParts.length - 1].replace('.html', '');
      const folder = group.folder || group.id;
      
      const semanticUrl = `/${firstCourseware.platform}/${firstCourseware.owner}/${firstCourseware.repo}/${folder}/${courseFileName}/0`;
      navigate(semanticUrl);
    } else {
      // 降级处理：使用旧的索引方式
      const existingIndex = coursewares.findIndex(cw => cw.sourcePath === firstCourseware.sourcePath);
      if (existingIndex >= 0) {
        navigate(`/player/${existingIndex}/0`);
        return;
      }

      // 如果不存在，添加该组的所有课件到使用列表
      group.coursewares.forEach(cw => {
        const isAlreadyAdded = cw.sourcePath && coursewares.some(usedCw => usedCw.sourcePath === cw.sourcePath);
        if (!isAlreadyAdded) {
          addBundledCourseware(cw);
        }
      });
      
      setPendingNavigation({ sourcePath: firstCourseware.sourcePath! });
    }
  };

  const handleCopyUrl = (e: React.MouseEvent, group: typeof bundledCoursewareGroups[0]) => {
    e.stopPropagation();
    const firstCourseware = group.coursewares[0];
    const courseFileName = firstCourseware.filePath?.split('/').pop()?.replace('.html', '') || '';
    const folder = group.folder || group.id;
    const url = `${window.location.origin}/${firstCourseware.platform}/${firstCourseware.owner}/${firstCourseware.repo}/${folder}/${courseFileName}/0`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(group.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      alert('复制失败');
    });
  };

  // 添加调试日志
  useEffect(() => {
    console.log('[NavigationPage] bundledCoursewareGroups:', bundledCoursewareGroups.length);
    console.log('[NavigationPage] 课件组详情:', bundledCoursewareGroups.map(g => ({
      id: g.id,
      name: g.name,
      courseId: g.courseId,
      count: g.coursewares.length
    })));
  }, [bundledCoursewareGroups]);

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="text-6xl mb-6 animate-bounce">📚</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">加载中...</h3>
          <p className="text-gray-600 mb-6">正在加载课件，请稍候</p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // 加载完成后，如果没有课件组，显示空状态
  if (bundledCoursewareGroups.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="text-6xl mb-6">📚</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">暂无课件组</h3>
          <p className="text-gray-600 mb-6">请先在课件目录中添加课件文件</p>
          <button 
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:scale-105 transition-all duration-300 shadow-lg"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <ManagementLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">课件导航</h2>
          <p className="text-gray-600">点击任意课件组，进入该组的第一页</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bundledCoursewareGroups.map((group, index) => (
            <div
              key={group.id}
              onClick={() => handleGroupClick(group)}
              className="glass-card-hover cursor-pointer p-6 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="text-4xl bg-gradient-to-br from-blue-400 to-cyan-400 p-3 rounded-xl shadow-lg">
                    📁
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-gray-800 truncate">
                      {group.name}
                    </h4>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-xl">📄</span>
                  <span className="text-sm font-medium">{group.coursewares.length} 个课件</span>
                </div>

                {/* Course List */}
                {group.coursewares.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">包含课件：</p>
                    <div className="flex flex-wrap gap-2">
                      {group.coursewares.slice(0, 3).map((cw, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 bg-blue-100/80 text-blue-700 text-xs font-medium rounded-full backdrop-blur-sm"
                        >
                          {cw.title}
                        </span>
                      ))}
                      {group.coursewares.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100/80 text-gray-700 text-xs font-medium rounded-full backdrop-blur-sm">
                          +{group.coursewares.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* URL Section */}
                {group.coursewares.length > 0 && group.coursewares[0].platform && (
                  <div className="pt-3 border-t border-gray-200/50">
                    <p className="text-xs text-gray-500 mb-2">课程链接（第1页）：</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0 bg-gray-50/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200/50">
                        <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                          <span>🔗</span>
                          <span className="truncate">
                            {(() => {
                              const firstCourseware = group.coursewares[0];
                              const courseFileName = firstCourseware.filePath?.split('/').pop()?.replace('.html', '') || '';
                              const folder = group.folder || group.id;
                              return `${window.location.origin}/${firstCourseware.platform}/${firstCourseware.owner}/${firstCourseware.repo}/${folder}/${courseFileName}/0`;
                            })()}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleCopyUrl(e, group)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                          copiedId === group.id
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {copiedId === group.id ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center gap-2">
                  <span>▶️</span> 开始学习
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ManagementLayout>
  );
};

export default NavigationPage;
