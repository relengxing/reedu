import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import NavigationPage from './pages/NavigationPage';
import CatalogPage from './pages/CatalogPage';
import CoursewarePlayer from './pages/CoursewarePlayer';
import CoursePage from './pages/CoursePage';
import ConfigPage from './pages/ConfigPage';
import DynamicCoursePage from './pages/DynamicCoursePage';
import CoursewareSquare from './pages/CoursewareSquare';
import AuthPage from './pages/AuthPage';
import { CoursewareProvider } from './context/CoursewareContext';
import { AuthProvider } from './context/AuthContext';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <CoursewareProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/navigation" element={<NavigationPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/square" element={<CoursewareSquare />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/player/:coursewareIndex/:pageIndex" element={<CoursewarePlayer />} />
            <Route path="/player/:pageIndex" element={<CoursewarePlayer />} />
            {/* 新路由格式：/:platform/:owner/:repo/:folder/:course/:pageIndex? */}
            <Route path="/github/:owner/:repo/*" element={<DynamicCoursePage />} />
            <Route path="/gitee/:owner/:repo/*" element={<DynamicCoursePage />} />
            {/* 课程URL：32位MD5字符串 + 页面索引，格式：/:courseId/:pageIndex */}
            <Route path="/:courseId/:pageIndex" element={<CoursePage />} />
            {/* 课程URL：32位MD5字符串（无页面索引时跳转到第0页），放在其他路由之后，避免与固定路由冲突 */}
            <Route path="/:courseId" element={<CoursePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CoursewareProvider>
    </AuthProvider>
  );
};

export default App;

