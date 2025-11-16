import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Button, Space, Row, Col, Tag, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCourseware } from '../context/CoursewareContext';
import { FolderOutlined, FileTextOutlined, PlayCircleOutlined, LinkOutlined, CopyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const NavigationPage: React.FC = () => {
  const navigate = useNavigate();
  const { bundledCoursewareGroups, coursewares, addBundledCourseware } = useCourseware();
  const [pendingNavigation, setPendingNavigation] = useState<{ sourcePath: string } | null>(null);
  const prevCoursewaresLengthRef = useRef(coursewares.length);

  // 监听coursewares变化，当新课件添加完成后自动跳转
  useEffect(() => {
    if (pendingNavigation && coursewares.length > prevCoursewaresLengthRef.current) {
      // 找到新添加的课件索引
      const targetIndex = coursewares.findIndex(cw => cw.sourcePath === pendingNavigation.sourcePath);
      if (targetIndex >= 0) {
        navigate(`/player/${targetIndex}/0`);
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
    
    // 检查第一个课件是否已经在使用列表中
    const existingIndex = coursewares.findIndex(cw => cw.sourcePath === firstCourseware.sourcePath);
    if (existingIndex >= 0) {
      // 如果已存在，直接跳转
      navigate(`/player/${existingIndex}/0`);
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
  };

  if (bundledCoursewareGroups.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <Title level={3}>暂无课件组</Title>
        <Text type="secondary">请先在课件目录中添加课件文件</Text>
        <div style={{ marginTop: '24px' }}>
          <Button type="primary" onClick={() => navigate('/home')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        课件导航
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '32px' }}>
        点击任意课件组，进入该组的第一页
      </Text>

      <Row gutter={[24, 24]}>
        {bundledCoursewareGroups.map((group) => (
          <Col xs={24} sm={12} md={8} lg={6} key={group.id}>
            <Card
              hoverable
              style={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onClick={() => handleGroupClick(group)}
              bodyStyle={{ padding: '20px' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FolderOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                  <Title level={4} style={{ margin: 0, flex: 1 }}>
                    {group.name}
                  </Title>
                </div>
                
                <div>
                  <Text type="secondary">
                    <FileTextOutlined /> {group.coursewares.length} 个课件
                  </Text>
                </div>

                {group.coursewares.length > 0 && (
                  <div>
                    <Text strong>包含课件：</Text>
                    <div style={{ marginTop: '8px' }}>
                      {group.coursewares.slice(0, 3).map((cw, idx) => (
                        <Tag key={idx} style={{ marginBottom: '4px' }}>
                          {cw.title}
                        </Tag>
                      ))}
                      {group.coursewares.length > 3 && (
                        <Tag>+{group.coursewares.length - 3} 个</Tag>
                      )}
                    </div>
                  </div>
                )}

                {/* 课程URL */}
                <div style={{ marginTop: '12px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>课程链接：</Text>
                  <Input.Group compact style={{ marginTop: '4px' }}>
                    <Input
                      readOnly
                      value={`${window.location.origin}/${group.courseId}`}
                      style={{ fontSize: '11px' }}
                      prefix={<LinkOutlined />}
                    />
                    <Button
                      icon={<CopyOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}/${group.courseId}`;
                        navigator.clipboard.writeText(url).then(() => {
                          message.success('课程链接已复制到剪贴板');
                        }).catch(() => {
                          message.error('复制失败');
                        });
                      }}
                    >
                      复制
                    </Button>
                  </Input.Group>
                </div>

                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  block
                  style={{ marginTop: '8px' }}
                >
                  开始学习
                </Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default NavigationPage;

