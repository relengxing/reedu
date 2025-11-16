import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Spin } from 'antd';
import { useCourseware } from '../context/CoursewareContext';

const { Title, Text } = Typography;

const CoursePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { bundledCoursewareGroups, coursewares, addBundledCourseware } = useCourseware();
  const [loading, setLoading] = useState(true);
  const [pendingNavigation, setPendingNavigation] = useState<{ sourcePath: string } | null>(null);
  const prevCoursewaresLengthRef = useRef(coursewares.length);

  // 监听coursewares变化，当新课件添加完成后自动跳转
  useEffect(() => {
    if (pendingNavigation && coursewares.length > prevCoursewaresLengthRef.current) {
      // 找到新添加的课件索引
      const targetIndex = coursewares.findIndex(cw => cw.sourcePath === pendingNavigation.sourcePath);
      if (targetIndex >= 0) {
        setLoading(false);
        navigate(`/player/${targetIndex}/0`, { replace: true });
        setPendingNavigation(null);
      }
    }
    prevCoursewaresLengthRef.current = coursewares.length;
  }, [coursewares, pendingNavigation, navigate]);

  useEffect(() => {
    if (!courseId) {
      navigate('/', { replace: true });
      return;
    }

    // 验证courseId格式（应该是32位十六进制字符串）
    if (!/^[0-9a-f]{32}$/i.test(courseId)) {
      console.warn(`[CoursePage] 无效的课程ID格式: ${courseId}`);
      setLoading(false);
      return;
    }

    // 查找对应的课程组
    const group = bundledCoursewareGroups.find(g => g.courseId === courseId);
    
    if (!group) {
      console.error(`[CoursePage] 未找到课程ID: ${courseId}`);
      setLoading(false);
      return;
    }

    if (group.coursewares.length === 0) {
      console.warn(`[CoursePage] 课程组 "${group.name}" 没有课件`);
      setLoading(false);
      return;
    }

    // 添加该组的所有课件到使用列表（如果还没有添加）
    const firstCourseware = group.coursewares[0];
    
    // 检查第一个课件是否已经在使用列表中
    const existingIndex = coursewares.findIndex(cw => cw.sourcePath === firstCourseware.sourcePath);
    if (existingIndex >= 0) {
      // 如果已存在，直接跳转
      setLoading(false);
      navigate(`/player/${existingIndex}/0`, { replace: true });
      return;
    }

    // 如果不存在，添加该组的所有课件到使用列表
    group.coursewares.forEach(cw => {
      // 检查是否已经在使用列表中
      const isAlreadyAdded = cw.sourcePath && coursewares.some(usedCw => usedCw.sourcePath === cw.sourcePath);
      if (!isAlreadyAdded) {
        addBundledCourseware(cw);
      }
    });

    // 设置待跳转的课件，useEffect会监听状态变化并自动跳转
    setPendingNavigation({ sourcePath: firstCourseware.sourcePath! });
  }, [courseId, bundledCoursewareGroups, coursewares, addBundledCourseware, navigate]);

  // 如果正在加载或跳转，显示加载状态
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
        <Text style={{ marginTop: '16px', display: 'block' }}>正在加载课程...</Text>
      </div>
    );
  }

  // 如果找不到课程，显示错误信息
  const group = bundledCoursewareGroups.find(g => g.courseId === courseId);
  if (!group) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <Title level={3}>课程不存在</Title>
        <Text type="secondary">未找到课程ID: {courseId}</Text>
        <div style={{ marginTop: '24px' }}>
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  // 正常情况下不应该到达这里（应该已经跳转了）
  return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <Spin size="large" />
      <Text style={{ marginTop: '16px', display: 'block' }}>正在跳转...</Text>
    </div>
  );
};

export default CoursePage;

