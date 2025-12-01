import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseware } from '../context/CoursewareContext';
import ManagementLayout from '../components/ManagementLayout';

const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseware, currentCoursewareIndex } = useCourseware();

  if (!courseware) {
    return (
      <ManagementLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="glass-card p-12 text-center max-w-md">
            <div className="text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">暂无课件</h3>
            <p className="text-gray-600 mb-6">请先在配置中心添加课件，或在课件导航中选择课件组</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/config')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:scale-105 transition-all duration-300 shadow-lg"
              >
                前往配置
              </button>
              <button
                onClick={() => navigate('/navigation')}
                className="px-6 py-3 glass border-2 border-white/40 text-gray-800 font-semibold rounded-full hover:scale-105 transition-all duration-300"
              >
                课件导航
              </button>
            </div>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-3xl font-bold text-gray-800">{courseware.title}</h2>
          <button
            onClick={() => {
              // 使用语义化URL跳转到第一页
              if (courseware.platform && courseware.owner && courseware.repo && courseware.filePath) {
                const courseFileName = courseware.filePath.split('/').pop()?.replace('.html', '') || '';
                const folder = courseware.groupId || '';
                navigate(`/${courseware.platform}/${courseware.owner}/${courseware.repo}/${folder}/${courseFileName}/0`);
              } else {
                navigate(`/player/${currentCoursewareIndex}/0`);
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2 justify-center whitespace-nowrap"
          >
            <span>▶️</span> 开始播放
          </button>
        </div>

        {/* Metadata */}
        {courseware.metadata && (
          <div className="glass-card p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span> 课件信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courseware.metadata.subject && (
                <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200/50">
                  <p className="text-sm text-blue-600 font-medium mb-1">学科</p>
                  <p className="text-gray-800 font-semibold">{courseware.metadata.subject}</p>
                </div>
              )}
              {courseware.metadata.grade && (
                <div className="bg-green-50/80 backdrop-blur-sm p-4 rounded-xl border border-green-200/50">
                  <p className="text-sm text-green-600 font-medium mb-1">年级</p>
                  <p className="text-gray-800 font-semibold">{courseware.metadata.grade}</p>
                </div>
              )}
              {courseware.metadata.semester && (
                <div className="bg-purple-50/80 backdrop-blur-sm p-4 rounded-xl border border-purple-200/50">
                  <p className="text-sm text-purple-600 font-medium mb-1">学期</p>
                  <p className="text-gray-800 font-semibold">{courseware.metadata.semester}</p>
                </div>
              )}
              {courseware.metadata.author && (
                <div className="bg-amber-50/80 backdrop-blur-sm p-4 rounded-xl border border-amber-200/50">
                  <p className="text-sm text-amber-600 font-medium mb-1">作者</p>
                  <p className="text-gray-800 font-semibold">{courseware.metadata.author}</p>
                </div>
              )}
              {courseware.metadata.unit && (
                <div className="bg-pink-50/80 backdrop-blur-sm p-4 rounded-xl border border-pink-200/50">
                  <p className="text-sm text-pink-600 font-medium mb-1">单位</p>
                  <p className="text-gray-800 font-semibold">{courseware.metadata.unit}</p>
                </div>
              )}
              {courseware.metadata.version && (
                <div className="bg-cyan-50/80 backdrop-blur-sm p-4 rounded-xl border border-cyan-200/50">
                  <p className="text-sm text-cyan-600 font-medium mb-1">教材版本</p>
                  <p className="text-gray-800 font-semibold">{courseware.metadata.version}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Page List */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📄</span> 课件目录
          </h3>
          <div className="space-y-3">
            {courseware.pages.map((page, index) => (
              <div
                key={index}
                onClick={() => {
                  // 使用语义化URL
                  if (courseware.platform && courseware.owner && courseware.repo && courseware.filePath) {
                    const courseFileName = courseware.filePath.split('/').pop()?.replace('.html', '') || '';
                    const folder = courseware.groupId || '';
                    navigate(`/${courseware.platform}/${courseware.owner}/${courseware.repo}/${folder}/${courseFileName}/${index}`);
                  } else {
                    navigate(`/player/${currentCoursewareIndex}/${index}`);
                  }
                }}
                className="group bg-white/60 backdrop-blur-sm hover:bg-white/80 border border-white/40 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl bg-gradient-to-br from-blue-400 to-cyan-400 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                      {page.title || `第${index + 1}页`}
                    </h4>
                    <p className="text-sm text-gray-600">
                      页面 {index + 1} / {courseware.pages.length}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ManagementLayout>
  );
};

export default CatalogPage;
