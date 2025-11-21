import React, { useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  RocketOutlined,
  GlobalOutlined,
  SettingOutlined,
  BookOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 欢迎区域 */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <Title level={1} style={{ color: '#fff', fontSize: '48px', marginBottom: '16px' }}>
            欢迎使用 Reedu 课件系统
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '18px' }}>
            {isAuthenticated && user?.email ? `你好，${user.email.split('@')[0]}！` : '欢迎使用！'}
            开始您的教学之旅
          </Paragraph>
          {!isAuthenticated && (
            <Button
              size="large"
              type="default"
              style={{ marginTop: '16px', background: 'rgba(255, 255, 255, 0.9)' }}
              onClick={() => navigate('/auth')}
            >
              登录以使用云端同步
            </Button>
          )}
        </div>

        {/* 功能卡片 */}
        <Row gutter={[24, 24]}>
          {/* 课件导航 */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              onClick={() => navigate('/navigation')}
              style={{ height: '100%' }}
              styles={{
                body: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '32px',
                },
              }}
            >
              <RocketOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={4} style={{ marginBottom: '8px' }}>
                课件导航
              </Title>
              <Text type="secondary" style={{ textAlign: 'center' }}>
                浏览和管理您的课件组
              </Text>
            </Card>
          </Col>

          {/* 课件广场 */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              onClick={() => navigate('/square')}
              style={{ height: '100%' }}
              styles={{
                body: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '32px',
                },
              }}
            >
              <GlobalOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
              <Title level={4} style={{ marginBottom: '8px' }}>
                课件广场
              </Title>
              <Text type="secondary" style={{ textAlign: 'center' }}>
                发现和分享优质课件
              </Text>
            </Card>
          </Col>

          {/* 配置中心 */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              onClick={() => navigate('/config')}
              style={{ height: '100%' }}
              styles={{
                body: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '32px',
                },
              }}
            >
              <SettingOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
              <Title level={4} style={{ marginBottom: '8px' }}>
                配置中心
              </Title>
              <Text type="secondary" style={{ textAlign: 'center' }}>
                管理仓库和上传课件
              </Text>
            </Card>
          </Col>

          {/* 课件目录 */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              onClick={() => navigate('/catalog')}
              style={{ height: '100%' }}
              styles={{
                body: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '32px',
                },
              }}
            >
              <BookOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '16px' }} />
              <Title level={4} style={{ marginBottom: '8px' }}>
                课件目录
              </Title>
              <Text type="secondary" style={{ textAlign: 'center' }}>
                查看当前课件的详细目录
              </Text>
            </Card>
          </Col>
        </Row>

        {/* 快速开始 */}
        <div style={{ marginTop: '64px', textAlign: 'center' }}>
          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Title level={3} style={{ marginBottom: '24px' }}>
              <PlayCircleOutlined /> 快速开始
            </Title>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Paragraph style={{ fontSize: '16px', margin: 0 }}>
                👋 欢迎使用 Reedu 课件系统！以下是使用步骤：
              </Paragraph>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <div style={{ padding: '16px', background: '#f0f5ff', borderRadius: '8px' }}>
                    <Title level={4} style={{ color: '#1890ff' }}>
                      1️⃣ 添加课件
                    </Title>
                    <Paragraph>
                      前往<Text strong>配置中心</Text>绑定您的 GitHub/Gitee 仓库，或直接上传本地课件文件
                    </Paragraph>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ padding: '16px', background: '#f6ffed', borderRadius: '8px' }}>
                    <Title level={4} style={{ color: '#52c41a' }}>
                      2️⃣ 浏览课件
                    </Title>
                    <Paragraph>
                      在<Text strong>课件导航</Text>中选择课件组，或在<Text strong>课件广场</Text>发现优质课件
                    </Paragraph>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ padding: '16px', background: '#fff7e6', borderRadius: '8px' }}>
                    <Title level={4} style={{ color: '#faad14' }}>
                      3️⃣ 开始播放
                    </Title>
                    <Paragraph>
                      点击任意课件组即可进入沉浸式播放模式，享受无干扰的教学体验
                    </Paragraph>
                  </div>
                </Col>
              </Row>
              <div style={{ marginTop: '24px' }}>
                <Space size="large">
                  <Button
                    type="primary"
                    size="large"
                    icon={<SettingOutlined />}
                    onClick={() => navigate('/config')}
                  >
                    立即配置
                  </Button>
                  <Button
                    size="large"
                    icon={<RocketOutlined />}
                    onClick={() => navigate('/navigation')}
                  >
                    浏览课件
                  </Button>
                </Space>
              </div>
            </Space>
          </Card>
        </div>

        {/* 底部信息 */}
        <div style={{ marginTop: '48px', textAlign: 'center' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Reedu 课件系统 © 2025 - 让教学更简单
          </Text>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
