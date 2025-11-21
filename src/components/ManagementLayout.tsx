import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Button } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  SettingOutlined,
  FileTextOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface ManagementLayoutProps {
  children: React.ReactNode;
}

const ManagementLayout: React.FC<ManagementLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // 侧边栏菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/'),
    },
    {
      key: '/navigation',
      icon: <FileTextOutlined />,
      label: '课件导航',
      onClick: () => navigate('/navigation'),
    },
    {
      key: '/config',
      icon: <SettingOutlined />,
      label: '配置中心',
      onClick: () => navigate('/config'),
    },
  ];

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = isAuthenticated
    ? [
        {
          key: 'email',
          label: <Text strong>{user?.email}</Text>,
          disabled: true,
        },
        {
          type: 'divider',
        },
        {
          key: 'config',
          label: '配置中心',
          icon: <SettingOutlined />,
          onClick: () => navigate('/config'),
        },
        {
          type: 'divider',
        },
        {
          key: 'logout',
          label: '退出登录',
          icon: <LogoutOutlined />,
          onClick: async () => {
            await signOut();
            navigate('/');
          },
        },
      ]
    : [
        {
          key: 'login',
          label: '登录 / 注册',
          icon: <LoginOutlined />,
          onClick: () => navigate('/auth'),
        },
      ];

  // 获取当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    // 精确匹配
    if (menuItems?.some((item: any) => item?.key === path)) {
      return [path];
    }
    // 默认选中首页
    return ['/'];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo 区域 */}
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '20px',
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {collapsed ? 'R' : 'Reedu'}
        </div>

        {/* 菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>

      {/* 主体内容 */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        {/* 顶部导航栏 */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          {/* 左侧：折叠按钮 */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 48, height: 48 }}
          />

          {/* 右侧：用户信息 */}
          <Space>
            {!isAuthenticated && (
              <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate('/auth')}>
                登录
              </Button>
            )}
            {isAuthenticated && (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar
                    size="default"
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#1890ff' }}
                  />
                  <Text strong>{user?.email?.split('@')[0] || '用户'}</Text>
                </Space>
              </Dropdown>
            )}
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            margin: 0,
            overflow: 'auto',
            minHeight: 'calc(100vh - 64px)',
            background: '#f5f5f5',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ManagementLayout;

