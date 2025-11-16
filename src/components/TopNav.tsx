import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Tabs, Button, Modal, List } from 'antd';
import type { TabsProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, ToolOutlined, FileTextOutlined, UnorderedListOutlined, SettingOutlined } from '@ant-design/icons';
import { useCourseware } from '../context/CoursewareContext';
import ToolsModal from './ToolsModal';

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
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [tabItemColors, setTabItemColors] = useState<Map<string, string>>(new Map());
  const [chaptersModalVisible, setChaptersModalVisible] = useState(false);

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
        const key = `/player/${cwIndex}/${page.index}`;
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
    } else if (key.startsWith('/player/')) {
      // 解析路径：/player/{coursewareIndex}/{pageIndex}
      const match = key.match(/\/player\/(\d+)\/(\d+)/);
      if (match) {
        const cwIndex = parseInt(match[1], 10);
        if (cwIndex >= 0 && cwIndex < coursewares.length) {
          setCurrentCoursewareIndex(cwIndex);
          navigate(key);
        }
      } else {
        navigate(key);
      }
    } else {
      navigate(key);
    }
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
          dataSource={tabItems?.filter(item => item.key && item.key.startsWith('/player/')) || []}
          renderItem={(item) => {
            if (!item.key) return null;
            const match = item.key.match(/\/player\/(\d+)\/(\d+)/);
            if (!match) return null;
            const cwIndex = parseInt(match[1], 10);
            const pageIndex = parseInt(match[2], 10);
            const courseware = coursewares[cwIndex];
            if (!courseware) return null;
            const page = courseware.pages[pageIndex];
            if (!page) return null;
            
            return (
              <List.Item
                style={{
                  cursor: 'pointer',
                  backgroundColor: location.pathname === item.key ? '#e6f7ff' : 'transparent',
                }}
                onClick={() => {
                  setCurrentCoursewareIndex(cwIndex);
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

