/**
 * 动态课件页面
 * 处理新路由格式: /:platform/:owner/:repo/:folder/:course/:pageIndex?
 * 按需加载课件HTML
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Spin, Typography, Button, message } from 'antd';
import { parseCoursewareUrlPath } from '../utils/urlParser';
import { useCourseware } from '../context/CoursewareContext';
import { parseHTMLCourseware, setAudioPathMap } from '../utils/coursewareParser';
import type { CoursewareData } from '../types';

const { Title, Text } = Typography;

const DynamicCoursePage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { coursewares, addCourseware, setCurrentCoursewareIndex } = useCourseware();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coursewareData, setCoursewareData] = useState<CoursewareData | null>(null);

  useEffect(() => {
    const loadCourseware = async () => {
      try {
        setLoading(true);
        setError(null);

        // 解析URL路径
        // 路径格式: /:platform/:owner/:repo/其余部分
        // 例如: /github/user/repo/folder/course/0
        const pathMatch = location.pathname.match(/^\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)$/);
        if (!pathMatch) {
          setError('无效的URL格式');
          setLoading(false);
          return;
        }

        const platform = pathMatch[1];
        const owner = pathMatch[2];
        const repo = pathMatch[3];
        const remainingPath = pathMatch[4];

        // 解析剩余路径: folder/course/pageIndex?
        const remainingParts = remainingPath.split('/');
        if (remainingParts.length < 2) {
          setError('URL缺少必要的参数');
          setLoading(false);
          return;
        }

        const folder = decodeURIComponent(remainingParts[0]);
        const courseFileName = decodeURIComponent(remainingParts[1]);
        const pageIndex = remainingParts[2] ? parseInt(remainingParts[2], 10) : 0;

        console.log('[DynamicCoursePage] 解析参数:', {
          platform,
          owner,
          repo,
          folder,
          courseFileName,
          pageIndex,
        });

        // 构建课件的完整URL
        const baseUrl = platform === 'github'
          ? `https://raw.githubusercontent.com/${owner}/${repo}/main/`
          : `https://gitee.com/${owner}/${repo}/raw/main/`;

        const coursewarePath = `${folder}/${courseFileName}.html`;
        const coursewareUrl = `${baseUrl}${coursewarePath}`;

        // 检查是否已经加载过这个课件
        const existingIndex = coursewares.findIndex(
          cw => cw.sourcePath === coursewareUrl
        );

        if (existingIndex >= 0) {
          // 已存在,直接跳转到播放器
          console.log('[DynamicCoursePage] 课件已存在,跳转到播放器');
          setCurrentCoursewareIndex(existingIndex);
          navigate(`/player/${existingIndex}/${pageIndex}`, { replace: true });
          return;
        }

        // 加载manifest.json来获取组信息(可选)
        let groupName = folder;
        try {
          const manifestUrl = `${baseUrl}manifest.json`;
          const manifestResponse = await fetch(manifestUrl);
          if (manifestResponse.ok) {
            const manifest = await manifestResponse.json();
            const group = manifest.groups?.find((g: any) => g.id === folder);
            if (group) {
              groupName = group.name;
            }
          }
        } catch (e) {
          console.warn('[DynamicCoursePage] 无法加载manifest.json:', e);
        }

        // 加载课件HTML
        console.log('[DynamicCoursePage] 加载课件:', coursewareUrl);
        const response = await fetch(coursewareUrl);
        if (!response.ok) {
          throw new Error(`加载课件失败: HTTP ${response.status}`);
        }

        const htmlContent = await response.text();

        // 处理音频路径
        const audioPathMap = new Map<string, string>();
        const audioRegex = /new\s+Audio\s*\(\s*(['"])([^'"]+\.mp3)\1\s*\)/g;
        let match;
        while ((match = audioRegex.exec(htmlContent)) !== null) {
          const audioPath = match[2];
          const audioUrl = audioPath.startsWith('./')
            ? `${baseUrl}${folder}/${audioPath.replace(/^\.\//, '')}`
            : `${baseUrl}${audioPath}`;
          audioPathMap.set(audioPath, audioUrl);
          audioPathMap.set(`./${audioPath}`, audioUrl);
        }

        setAudioPathMap(audioPathMap);

        // 解析课件
        const courseware = parseHTMLCourseware(htmlContent, courseFileName);
        courseware.isBundled = true;
        courseware.sourcePath = coursewareUrl;
        courseware.groupId = folder;
        courseware.groupName = groupName;

        setCoursewareData(courseware);

        // 添加到课件列表
        addCourseware(courseware);

        // 跳转到播放器
        // 等待课件添加完成后再跳转
        setTimeout(() => {
          const newIndex = coursewares.length;
          setCurrentCoursewareIndex(newIndex);
          navigate(`/player/${newIndex}/${pageIndex}`, { replace: true });
        }, 100);

      } catch (err) {
        console.error('[DynamicCoursePage] 加载课件失败:', err);
        setError(err instanceof Error ? err.message : '加载课件失败');
        message.error('加载课件失败');
      } finally {
        setLoading(false);
      }
    };

    loadCourseware();
  }, [location.pathname]);

  if (loading) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh'
      }}>
        <Spin size="large" />
        <Text style={{ marginTop: '16px', display: 'block' }}>正在加载课件...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <Title level={3}>加载失败</Title>
        <Text type="danger">{error}</Text>
        <div style={{ marginTop: '24px' }}>
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  // 正常情况下会自动跳转,不应该显示这个页面
  return (
    <div style={{
      padding: '48px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh'
    }}>
      <Spin size="large" />
      <Text style={{ marginTop: '16px', display: 'block' }}>正在跳转到播放器...</Text>
    </div>
  );
};

export default DynamicCoursePage;

