import React from 'react';
import { Drawer, List, Typography, Tag } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { CoursewareData } from '../../types';

const { Text } = Typography;

interface CatalogDrawerProps {
  visible: boolean;
  onClose: () => void;
  coursewares: CoursewareData[];
  currentCoursewareIndex: number;
}

const CatalogDrawer: React.FC<CatalogDrawerProps> = ({
  visible,
  onClose,
  coursewares,
  currentCoursewareIndex,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 构建课件页面URL
  const buildCoursewarePageUrl = (courseware: CoursewareData, coursewareIndex: number, pageIndex: number): string => {
    // 如果有仓库信息，使用语义化URL
    if (courseware.platform && courseware.owner && courseware.repo && courseware.filePath) {
      const courseFileName = courseware.filePath.split('/').pop()?.replace('.html', '') || '';
      const folder = courseware.groupId || '';
      return `/${courseware.platform}/${courseware.owner}/${courseware.repo}/${folder}/${courseFileName}/${pageIndex}`;
    }
    // 否则使用传统格式
    return `/player/${coursewareIndex}/${pageIndex}`;
  };

  const handlePageClick = (coursewareIndex: number, pageIndex: number) => {
    const courseware = coursewares[coursewareIndex];
    const url = buildCoursewarePageUrl(courseware, coursewareIndex, pageIndex);
    navigate(url);
    onClose();
  };

  // 获取当前激活的页面
  const getCurrentPage = () => {
    // 尝试匹配传统格式
    const playerMatch = location.pathname.match(/\/player\/(\d+)\/(\d+)/);
    if (playerMatch) {
      return {
        coursewareIndex: parseInt(playerMatch[1], 10),
        pageIndex: parseInt(playerMatch[2], 10),
      };
    }
    
    // 尝试匹配语义化格式
    const semanticMatch = location.pathname.match(/^\/(github|gitee)\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(\d+)$/);
    if (semanticMatch) {
      const pageIndex = parseInt(semanticMatch[6], 10);
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
      
      return {
        coursewareIndex: cwIndex,
        pageIndex,
      };
    }

    return {
      coursewareIndex: currentCoursewareIndex,
      pageIndex: 0,
    };
  };

  const currentPage = getCurrentPage();

  return (
    <Drawer
      title="课件目录"
      placement="left"
      onClose={onClose}
      open={visible}
      width={300}
    >
      <div>
        {coursewares.map((courseware, cwIndex) => (
          <div key={cwIndex} style={{ marginBottom: '24px' }}>
            {/* 课件标题 */}
            {coursewares.length > 1 && (
              <div style={{ 
                marginBottom: '12px',
                padding: '8px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
              }}>
                <Text strong>{courseware.title || `课件 ${cwIndex + 1}`}</Text>
                <Tag color="blue" style={{ marginLeft: '8px', fontSize: '12px' }}>
                  {courseware.pages.length} 页
                </Tag>
              </div>
            )}

            {/* 页面列表 */}
            <List
              size="small"
              dataSource={courseware.pages}
              renderItem={(page, pageIndex) => {
                const isActive = currentPage.coursewareIndex === cwIndex && currentPage.pageIndex === pageIndex;
                return (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      padding: '8px 12px',
                      backgroundColor: isActive ? '#e6f7ff' : 'transparent',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      border: isActive ? '1px solid #1890ff' : '1px solid transparent',
                      transition: 'all 0.3s',
                    }}
                    onClick={() => handlePageClick(cwIndex, pageIndex)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined style={{ color: isActive ? '#1890ff' : '#999' }} />}
                      title={
                        <Text 
                          style={{ 
                            fontSize: '13px',
                            color: isActive ? '#1890ff' : 'inherit',
                            fontWeight: isActive ? 500 : 400,
                          }}
                        >
                          {page.title || `第 ${pageIndex + 1} 页`}
                        </Text>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </div>
        ))}
      </div>
    </Drawer>
  );
};

export default CatalogDrawer;

