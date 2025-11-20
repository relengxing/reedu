import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Tabs, Button, Modal, List, Dropdown, Avatar, Space, Typography } from 'antd';
import type { TabsProps, MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, ToolOutlined, FileTextOutlined, UnorderedListOutlined, SettingOutlined, GlobalOutlined, UserOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import { useCourseware } from '../context/CoursewareContext';
import { useAuth } from '../context/AuthContext';
import ToolsModal from './ToolsModal';
import type { CoursewareData } from '../types';

const { Text } = Typography;

// 构建课件页面URL - 优先使用语义化URL
function buildCoursewarePageUrl(courseware: CoursewareData, coursewareIndex: number, pageIndex: number): string {
  // 如果有仓库信息，使用语义化URL
  if (courseware.platform && courseware.owner && courseware.repo && courseware.filePath) {
    const courseFileName = courseware.filePath.split('/').pop()?.replace('.html', '') || '';
    const folder = courseware.groupId || '';
    return `/${courseware.platform}/${courseware.owner}/${courseware.repo}/${folder}/${courseFileName}/${pageIndex}`;
  }
  // 否则使用传统格式
  return `/player/${coursewareIndex}/${pageIndex}`;
}

interface TopNavProps {
  onToolsClick?: () => void;
  countdownTime?: number;
  isCountdownRunning?: boolean;
  isCountdownPaused?: boolean;
  onCountdownTimeChange?: (seconds: number) => void;
  onCountdownStart?: () => void;
  onCountdownPause?: () => void;
  onCountdownStop?: () => void;
  toolsModalVisible?: boolean;
  onToolsModalClose?: () => void;
  onRollCallStart?: (names: string[]) => void;
}

// 淡色背景颜色数组，每个课件使用不同颜色
const COURSEWARE_COLORS = [
  '#f0f5ff', // 淡蓝色
  '#f6ffed', // 淡绿色
  '#fff7e6', // 淡橙色
  '#fff0f6', // 淡粉色
  '#f0f9ff', // 淡青色
  '#f9f0ff', // 淡紫色
  '#fffbf0', // 淡黄色
  '#f0fff4', // 淡薄荷绿
];

const TopNav: React.FC<TopNavProps> = ({
  onToolsClick,
  countdownTime = 0,
  isCountdownRunning = false,
  isCountdownPaused = false,
  onCountdownTimeChange,
  onCountdownStart,
  onCountdownPause,
  onCountdownStop,
  toolsModalVisible = false,
  onToolsModalClose,
  onRollCallStart,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { coursewares, setCurrentCoursewareIndex } = useCourseware();
  const { user, isAuthenticated, signOut } = useAuth();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [tabItemColors, setTabItemColors] = useState<Map<string, string>>(new Map());
  const [chaptersModalVisible, setChaptersModalVisible] = useState(false);

  // 用户菜单
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
          label: '我的课件',
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

  // 构建 Tabs 项：首页、工具、每个课件的页面
  const { tabItems, tabItemColors: computedColors } = useMemo(() => {
    const items: TabsProps['items'] = [
      {
        key: '/',
        label: (
          <span>
            <HomeOutlined /> 首页
          </span>
        ),
      },
      {
        key: '/square',
        label: (
          <span>
            <GlobalOutlined /> 课件广场
          </span>
        ),
      },
      {
        key: '/config',
        label: (
          <span>
            <SettingOutlined /> 配置
          </span>
        ),
      },
      {
        key: 'tools',
        label: (
          <span>
            <ToolOutlined /> 工具
          </span>
        ),
      },
    ];

    const colorMap = new Map<string, string>();
    
    // 为每个课件添加页面标签，使用不同的背景颜色
    coursewares.forEach((cw, cwIndex) => {
      const bgColor = COURSEWARE_COLORS[cwIndex % COURSEWARE_COLORS.length];
      cw.pages.forEach((page) => {
        // 使用语义化URL作为key（如果有仓库信息）
        const key = buildCoursewarePageUrl(cw, cwIndex, page.index);
        items.push({
          key,
          label: (
            <span>
              <FileTextOutlined /> {page.title || `第${page.index + 1}页`}
            </span>
          ),
        });
        colorMap.set(key, bgColor);
      });
    });

    return { tabItems: items, tabItemColors: colorMap };
  }, [coursewares]);

  // 更新颜色映射状态
  useEffect(() => {
    setTabItemColors(computedColors);
  }, [computedColors]);

  const handleTabChange = (key: string) => {
    if (key === 'tools') {
      if (onToolsClick) {
        onToolsClick();
      }
      return;
    }
    
    // 处理课件页面的tab（可能是语义化URL或传统格式）
    // 语义化格式: /platform/owner/repo/folder/course/pageIndex
    // 传统格式: /player/coursewareIndex/pageIndex
    
    // 尝试匹配传统格式
    const playerMatch = key.match(/\/player\/(\d+)\/(\d+)/);
    if (playerMatch) {
      const cwIndex = parseInt(playerMatch[1], 10);
      if (cwIndex >= 0 && cwIndex < coursewares.length) {
        setCurrentCoursewareIndex(cwIndex);
      }
      navigate(key);
      return;
    }
    
    // 尝试匹配语义化URL格式
    const semanticMatch = key.match(/^\/(github|gitee)\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(\d+)$/);
    if (semanticMatch) {
      const pageIndex = parseInt(semanticMatch[6], 10);
      // 找到对应的课件索引
      const platform = semanticMatch[1];
      const owner = semanticMatch[2];
      const repo = semanticMatch[3];
      const folder = semanticMatch[4];
      const course = semanticMatch[5];
      
      const cwIndex = coursewares.findIndex(cw => 
        cw.platform === platform &&
        cw.owner === owner &&
        cw.repo === repo &&
        cw.groupId === folder &&
        cw.filePath?.includes(`${course}.html`)
      );
      
      if (cwIndex >= 0) {
        setCurrentCoursewareIndex(cwIndex);
      }
      navigate(key);
      return;
    }
    
    // 其他路由直接导航
    navigate(key);
  };

  // 滚动到当前标签并居中
  const scrollToCurrentTab = () => {
    if (!tabsContainerRef.current) return;
    const selectedTab = tabsContainerRef.current.querySelector('.ant-tabs-tab-active') as HTMLElement;
    if (selectedTab) {
      const container = tabsContainerRef.current.querySelector('.ant-tabs-nav-list') as HTMLElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const itemRect = selectedTab.getBoundingClientRect();
        const itemLeft = itemRect.left - containerRect.left + container.scrollLeft;
        const itemWidth = itemRect.width;
        const containerWidth = container.clientWidth;
        const scrollPosition = itemLeft - (containerWidth / 2) + (itemWidth / 2);
        container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      }
    }
  };

  // 当路由变化时，滚动到当前标签
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToCurrentTab();
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, coursewares]);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: '#fff', borderBottom: '1px solid #f0f0f0', height: '33px' }}>
      <div
        ref={tabsContainerRef}
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
        }}
      >
        <Tabs
          activeKey={location.pathname}
          onChange={handleTabChange}
          type="card"
          size="small"
          items={tabItems}
          style={{
            height: '100%',
            margin: 0,
          }}
          tabBarStyle={{
            margin: 0,
            height: '33px',
            border: 'none',
          }}
        />
        <style>{`
          ${Array.from(tabItemColors.entries()).map(([key, bgColor]) => {
            // 使用更通用的选择器来匹配 Tabs
            const selector = `.ant-tabs-tab[data-node-key="${key}"], .ant-tabs-tab-btn[data-node-key="${key}"]`;
            return `
              ${selector} {
                background: ${bgColor} !important;
              }
              ${selector}:hover {
                background: ${bgColor} !important;
                opacity: 0.85;
              }
              .ant-tabs-tab[data-node-key="${key}"].ant-tabs-tab-active,
              .ant-tabs-tab-active ${selector} {
                background: ${bgColor} !important;
                opacity: 1;
              }
            `;
          }).join('')}
        `}</style>
      </div>
      {/* 用户菜单 */}
      <div style={{
        position: 'absolute',
        right: '48px',
        zIndex: 10,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
      }}>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{ backgroundColor: isAuthenticated ? '#1890ff' : '#999' }}
            />
            {isAuthenticated && (
              <Text style={{ fontSize: '13px', maxWidth: '100px' }} ellipsis>
                {user?.email?.split('@')[0]}
              </Text>
            )}
          </div>
        </Dropdown>
      </div>
      {/* 所有章节按钮 */}
      <Button
        type="text"
        icon={<UnorderedListOutlined />}
        onClick={() => setChaptersModalVisible(true)}
        style={{
          position: 'absolute',
          right: 0,
          zIndex: 10,
          height: '100%',
          padding: '0 12px',
        }}
        title="查看所有章节"
      />
      {/* 所有章节Modal */}
      <Modal
        title="所有章节"
        open={chaptersModalVisible}
        onCancel={() => setChaptersModalVisible(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={tabItems?.filter(item => {
            if (!item.key) return false;
            // 匹配课件页面（传统格式或语义化格式）
            return item.key.startsWith('/player/') || 
                   item.key.match(/^\/(github|gitee)\/([^\/]+)\/([^\/]+)\/.+\/\d+$/);
          }) || []}
          renderItem={(item) => {
            if (!item.key) return null;
            
            // 尝试解析传统格式
            let cwIndex = -1;
            let pageIndex = 0;
            let courseware = null;
            let page = null;
            
            const playerMatch = item.key.match(/\/player\/(\d+)\/(\d+)/);
            if (playerMatch) {
              cwIndex = parseInt(playerMatch[1], 10);
              pageIndex = parseInt(playerMatch[2], 10);
              courseware = coursewares[cwIndex];
              page = courseware?.pages[pageIndex];
            } else {
              // 尝试解析语义化格式
              const semanticMatch = item.key.match(/^\/(github|gitee)\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(\d+)$/);
              if (semanticMatch) {
                pageIndex = parseInt(semanticMatch[6], 10);
                const platform = semanticMatch[1];
                const owner = semanticMatch[2];
                const repo = semanticMatch[3];
                const folder = semanticMatch[4];
                const course = semanticMatch[5];
                
                cwIndex = coursewares.findIndex(cw => 
                  cw.platform === platform &&
                  cw.owner === owner &&
                  cw.repo === repo &&
                  cw.groupId === folder &&
                  cw.filePath?.includes(`${course}.html`)
                );
                
                if (cwIndex >= 0) {
                  courseware = coursewares[cwIndex];
                  page = courseware?.pages[pageIndex];
                }
              }
            }
            
            if (!courseware || !page) return null;
            
            return (
              <List.Item
                style={{
                  cursor: 'pointer',
                  backgroundColor: location.pathname === item.key ? '#e6f7ff' : 'transparent',
                }}
                onClick={() => {
                  if (cwIndex >= 0) {
                    setCurrentCoursewareIndex(cwIndex);
                  }
                  navigate(item.key!);
                  setChaptersModalVisible(false);
                }}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {courseware.title} - {page.title || `第${pageIndex + 1}页`}
                    </span>
                  }
                  description={`课件 ${cwIndex + 1} / 页面 ${pageIndex + 1}`}
                />
              </List.Item>
            );
          }}
        />
      </Modal>
      <ToolsModal
        visible={toolsModalVisible}
        onClose={onToolsModalClose || (() => {})}
        countdownTime={countdownTime || 0}
        isCountdownRunning={isCountdownRunning || false}
        isCountdownPaused={isCountdownPaused || false}
        onCountdownTimeChange={onCountdownTimeChange || (() => {})}
        onCountdownStart={onCountdownStart || (() => {})}
        onCountdownPause={onCountdownPause || (() => {})}
        onCountdownStop={onCountdownStop || (() => {})}
        onRollCallStart={onRollCallStart}
      />
    </div>
  );
};

export default TopNav;

