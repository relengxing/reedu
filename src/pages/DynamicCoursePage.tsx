/**
 * 动态课件页面
 * 处理新路由格式: /:platform/:owner/:repo/:folder/:course/:pageIndex?
 * 按需加载课件HTML并直接显示，不跳转到播放器
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Spin, Typography, Button, message } from 'antd';
import { parseCoursewareUrlPath } from '../utils/urlParser';
import { useCourseware } from '../context/CoursewareContext';
import { parseHTMLCourseware, setAudioPathMap } from '../utils/coursewareParser';
import CoursewarePlayer from './CoursewarePlayer';
import type { CoursewareData } from '../types';

const { Title, Text } = Typography;

const DynamicCoursePage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { coursewares, addCourseware, setCurrentCoursewareIndex, bundledCoursewareGroups, addBundledCourseware } = useCourseware();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coursewareData, setCoursewareData] = useState<CoursewareData | null>(null);
  const [coursewareIndex, setCoursewareIndex] = useState<number>(-1);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [shouldRenderPlayer, setShouldRenderPlayer] = useState(false);

  useEffect(() => {
    const loadCourseware = async () => {
      try {
        setLoading(true);
        setError(null);
        setShouldRenderPlayer(false); // 重置播放器状态

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
        const currentPageIndex = remainingParts[2] ? parseInt(remainingParts[2], 10) : 0;
        
        setPageIndex(currentPageIndex);

        console.log('[DynamicCoursePage] 解析参数:', {
          platform,
          owner,
          repo,
          folder,
          courseFileName,
          pageIndex: currentPageIndex,
        });

        // 构建课件的完整URL
        const baseUrl = platform === 'github'
          ? `https://raw.githubusercontent.com/${owner}/${repo}/main/`
          : `https://gitee.com/${owner}/${repo}/raw/main/`;

        const coursewarePath = `${folder}/${courseFileName}.html`;
        const coursewareUrl = `${baseUrl}${coursewarePath}`;

        // 构建课程ID用于匹配课件组
        const courseId = `${platform}/${owner}/${repo}/${folder}`;

        // 首先检查是否在已加载的课件组中
        const existingGroup = bundledCoursewareGroups.find(
          g => g.courseId === courseId || 
               (g.platform === platform && g.owner === owner && g.repo === repo && g.folder === folder)
        );

        if (existingGroup && existingGroup.coursewares.length > 0) {
          console.log('[DynamicCoursePage] 找到已加载的课件组，包含', existingGroup.coursewares.length, '个课件');
          
          // 将该组的所有课件添加到使用列表（如果还没有添加）
          let targetCourseware: CoursewareData | null = null;
          let needsToAdd = false;
          
          for (const cw of existingGroup.coursewares) {
            // 检查是否已经在使用列表中
            const existingIndex = coursewares.findIndex(
              usedCw => usedCw.sourcePath === cw.sourcePath ||
                        (usedCw.platform === platform &&
                         usedCw.owner === owner &&
                         usedCw.repo === repo &&
                         usedCw.groupId === folder &&
                         usedCw.filePath === cw.filePath)
            );
            
            if (existingIndex < 0) {
              // 如果不在使用列表中，添加它
              addBundledCourseware(cw);
              needsToAdd = true;
            }
            
            // 找到目标课件（URL中指定的那个）
            if (!targetCourseware && 
                (cw.filePath === coursewarePath || 
                 cw.filePath?.endsWith(`${courseFileName}.html`) ||
                 (cw.filePath && cw.filePath.split('/').pop()?.replace('.html', '') === courseFileName))) {
              targetCourseware = cw;
            }
          }
          
          // 如果找到了目标课件
          if (targetCourseware) {
            // 再次检查目标课件是否已经在coursewares中
            const finalIndex = coursewares.findIndex(
              usedCw => usedCw.sourcePath === targetCourseware!.sourcePath ||
                        (usedCw.platform === platform &&
                         usedCw.owner === owner &&
                         usedCw.repo === repo &&
                         usedCw.groupId === folder &&
                         usedCw.filePath === targetCourseware!.filePath)
            );
            
            if (finalIndex >= 0) {
              // 已经在coursewares中，直接使用
              console.log('[DynamicCoursePage] 使用已加载的课件组，目标索引:', finalIndex);
              console.log('[DynamicCoursePage] coursewares总数:', coursewares.length);
              console.log('[DynamicCoursePage] 目标课件数据:', coursewares[finalIndex]?.title, '页数:', coursewares[finalIndex]?.pages?.length);
              setCurrentCoursewareIndex(finalIndex);
              setCoursewareIndex(finalIndex);
              setCoursewareData(coursewares[finalIndex]);
              setShouldRenderPlayer(true);
              setLoading(false);
              return;
            } else if (needsToAdd) {
              // 需要等待coursewares更新
              console.log('[DynamicCoursePage] 已添加课件到列表，等待更新，预期索引:', coursewares.length);
              setCoursewareData(targetCourseware);
              setCoursewareIndex(coursewares.length);
              setCurrentCoursewareIndex(coursewares.length);
              setLoading(false);
              // 不设置shouldRenderPlayer，等待useEffect检测到coursewares更新后再显示
              return;
            } else {
              // 目标课件已经在列表中，但是上面的查找没找到（不应该发生）
              console.warn('[DynamicCoursePage] 目标课件状态异常，尝试按索引查找');
              // 尝试在 coursewares 中查找
              const cwIndex = coursewares.findIndex(c => c.groupId === folder);
              if (cwIndex >= 0) {
                console.log('[DynamicCoursePage] 找到课件，索引:', cwIndex);
                setCurrentCoursewareIndex(cwIndex);
                setCoursewareIndex(cwIndex);
                setCoursewareData(coursewares[cwIndex]);
                setShouldRenderPlayer(true);
                setLoading(false);
                return;
              }
            }
          }
        }

        // 如果没有找到已加载的组，检查单个课件是否已存在
        const existingIndex = coursewares.findIndex(
          cw => cw.sourcePath === coursewareUrl ||
                (cw.platform === platform &&
                 cw.owner === owner &&
                 cw.repo === repo &&
                 cw.groupId === folder &&
                 cw.filePath === coursewarePath)
        );

        if (existingIndex >= 0) {
          // 已存在,直接显示
          console.log('[DynamicCoursePage] 课件已存在，索引:', existingIndex);
          setCurrentCoursewareIndex(existingIndex);
          setCoursewareIndex(existingIndex);
          setCoursewareData(coursewares[existingIndex]);
          setShouldRenderPlayer(true);
          setLoading(false);
          return;
        }

        // 加载manifest.json来获取组信息
        let groupName = folder;
        let groupFiles: string[] = [];
        try {
          const manifestUrl = `${baseUrl}manifest.json`;
          const manifestResponse = await fetch(manifestUrl);
          if (manifestResponse.ok) {
            const manifest = await manifestResponse.json();
            const group = manifest.groups?.find((g: any) => g.id === folder);
            if (group) {
              groupName = group.name;
              groupFiles = group.files || [];
              console.log('[DynamicCoursePage] 从manifest.json找到组，包含', groupFiles.length, '个文件');
            }
          }
        } catch (e) {
          console.warn('[DynamicCoursePage] 无法加载manifest.json:', e);
        }

        // 如果manifest中有该组的所有文件，加载整个组
        if (groupFiles.length > 0) {
          console.log('[DynamicCoursePage] 开始加载整个课件组，共', groupFiles.length, '个文件');
          
          const audioPathMap = new Map<string, string>();
          let targetCourseware: CoursewareData | null = null;
          let targetIndex = coursewares.length;
          
          // 加载该组的所有课件
          for (const filePath of groupFiles) {
            try {
              const fileUrl = `${baseUrl}${filePath}`;
              console.log('[DynamicCoursePage] 加载课件:', filePath);
              
              const response = await fetch(fileUrl);
              if (!response.ok) {
                console.warn(`[DynamicCoursePage] 加载失败: ${filePath}, HTTP ${response.status}`);
                continue;
              }
              
              const htmlContent = await response.text();
              const filename = filePath.split('/').pop()?.replace(/\.html$/, '') || '未命名';
              
              // 处理音频路径
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
              
              // 解析课件
              const courseware = parseHTMLCourseware(htmlContent, filename);
              courseware.isBundled = true;
              courseware.sourcePath = fileUrl;
              courseware.groupId = folder;
              courseware.groupName = groupName;
              courseware.platform = platform;
              courseware.owner = owner;
              courseware.repo = repo;
              courseware.branch = 'main';
              courseware.filePath = filePath;
              
              // 添加到课件列表
              addCourseware(courseware);
              
              // 检查是否是目标课件
              if (filePath === coursewarePath || filename === courseFileName) {
                targetCourseware = courseware;
                targetIndex = coursewares.length; // 添加前的长度
              }
            } catch (err) {
              console.error(`[DynamicCoursePage] 加载课件失败: ${filePath}`, err);
            }
          }
          
          // 设置音频路径映射
          setAudioPathMap(audioPathMap);
          
          if (targetCourseware) {
            console.log('[DynamicCoursePage] 课件组加载完成，目标索引:', targetIndex);
            setCoursewareData(targetCourseware);
            setCurrentCoursewareIndex(targetIndex);
            setCoursewareIndex(targetIndex);
          } else {
            throw new Error('未找到目标课件');
          }
        } else {
          // 如果没有manifest或组信息，只加载单个文件（降级处理）
          console.log('[DynamicCoursePage] 未找到组信息，只加载单个课件:', coursewareUrl);
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
          courseware.platform = platform;
          courseware.owner = owner;
          courseware.repo = repo;
          courseware.branch = 'main';
          courseware.filePath = coursewarePath;

          setCoursewareData(courseware);
          addCourseware(courseware);
          
          const newIndex = coursewares.length;
          setCurrentCoursewareIndex(newIndex);
          setCoursewareIndex(newIndex);
          console.log('[DynamicCoursePage] 单个课件已添加，预期索引:', newIndex);
        }

      } catch (err) {
        console.error('[DynamicCoursePage] 加载课件失败:', err);
        setError(err instanceof Error ? err.message : '加载课件失败');
        message.error('加载课件失败');
      } finally {
        setLoading(false);
      }
    };

    loadCourseware();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // 监听coursewares变化，当课件添加完成后显示播放器
  useEffect(() => {
    if (coursewareIndex >= 0 && coursewareIndex < coursewares.length && !shouldRenderPlayer) {
      // 如果coursewareData存在但不在coursewares中，尝试从coursewares中找到它
      if (coursewareData) {
        const foundIndex = coursewares.findIndex(
          cw => cw.sourcePath === coursewareData.sourcePath ||
                (cw.platform === coursewareData.platform &&
                 cw.owner === coursewareData.owner &&
                 cw.repo === coursewareData.repo &&
                 cw.groupId === coursewareData.groupId &&
                 cw.filePath === coursewareData.filePath)
        );
        
        if (foundIndex >= 0 && foundIndex !== coursewareIndex) {
          // 找到了，更新索引和数据
          console.log('[DynamicCoursePage] 在coursewares中找到目标课件，更新索引:', foundIndex);
          setCoursewareIndex(foundIndex);
          setCurrentCoursewareIndex(foundIndex);
          setCoursewareData(coursewares[foundIndex]);
        }
      }
      
      // 确保使用coursewares中的实际数据
      if (coursewareIndex >= 0 && coursewareIndex < coursewares.length) {
        const actualCourseware = coursewares[coursewareIndex];
        if (actualCourseware) {
          console.log('[DynamicCoursePage] 课件已就绪，显示播放器，索引:', coursewareIndex);
          setCoursewareData(actualCourseware);
          setShouldRenderPlayer(true);
        }
      }
    }
  }, [coursewares, coursewareIndex, coursewareData, shouldRenderPlayer]);

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

  // 渲染播放器
  if (shouldRenderPlayer && coursewareIndex >= 0) {
    console.log('[DynamicCoursePage] 渲染播放器，索引:', coursewareIndex, '页面:', pageIndex);
    console.log('[DynamicCoursePage] 当前 coursewares 总数:', coursewares.length);
    console.log('[DynamicCoursePage] coursewareIndex 在范围内:', coursewareIndex < coursewares.length);
    if (coursewareIndex < coursewares.length) {
      console.log('[DynamicCoursePage] 播放器将显示:', coursewares[coursewareIndex]?.title, '页数:', coursewares[coursewareIndex]?.pages?.length);
    }
    return <CoursewarePlayer />;
  }

  // 加载中或等待状态
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
      <Text style={{ marginTop: '16px', display: 'block' }}>正在准备课件...</Text>
    </div>
  );
};

export default DynamicCoursePage;

