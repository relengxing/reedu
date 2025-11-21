/**
 * 课件广场页面
 * 展示所有公开的课件,支持搜索、排序和分页
 */

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Input, Select, Spin, Typography, Tag, Button, Empty, Pagination, Space } from 'antd';
import { SearchOutlined, EyeOutlined, LikeOutlined, HeartOutlined, HeartFilled, PlayCircleOutlined } from '@ant-design/icons';
import ManagementLayout from '../components/ManagementLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as coursewareSquareService from '../services/coursewareSquareService';
import type { PublicCourseware, CoursewareFilters } from '../services/coursewareSquareService';
import { buildCoursewareUrlPath } from '../utils/urlParser';
import { parseRawUrl } from '../utils/urlParser';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const CoursewareSquare: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [coursewares, setCoursewares] = useState<PublicCourseware[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<CoursewareFilters>({
    search: '',
    sortBy: 'latest',
    page: 1,
    pageSize: 12,
  });

  // 加载课件列表
  const loadCoursewares = async () => {
    setLoading(true);
    try {
      const { coursewares: data, total: count } = await coursewareSquareService.getPublicCoursewares(
        filters,
        user?.id
      );
      setCoursewares(data);
      setTotal(count);
    } catch (error) {
      console.error('[CoursewareSquare] 加载课件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoursewares();
  }, [filters, user]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  // 处理排序
  const handleSortChange = (value: 'latest' | 'popular' | 'likes') => {
    setFilters(prev => ({ ...prev, sortBy: value, page: 1 }));
  };

  // 处理分页
  const handlePageChange = (page: number, pageSize?: number) => {
    setFilters(prev => ({ ...prev, page, pageSize: pageSize || prev.pageSize }));
  };

  // 处理点赞
  const handleLike = async (courseware: PublicCourseware, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/config'); // 跳转到配置页面登录
      return;
    }

    try {
      if (courseware.isLiked) {
        await coursewareSquareService.unlikeCourseware(courseware.id, user!.id);
      } else {
        await coursewareSquareService.likeCourseware(courseware.id, user!.id);
      }
      // 重新加载列表
      loadCoursewares();
    } catch (error) {
      console.error('[CoursewareSquare] 点赞操作失败:', error);
    }
  };

  // 处理播放
  const handlePlay = (courseware: PublicCourseware) => {
    // 解析repo URL
    const parsed = parseRawUrl(courseware.repoUrl);
    if (!parsed) {
      console.error('[CoursewareSquare] 无法解析仓库URL:', courseware.repoUrl);
      return;
    }

    // 构建课件URL路径
    // 假设groupId就是folder名称,title是课件文件名(去掉.html)
    const courseFileName = courseware.title.replace(/\.html$/, '');
    const path = buildCoursewareUrlPath(
      parsed.platform,
      parsed.owner,
      parsed.repo,
      courseware.groupId,
      courseFileName,
      0
    );

    // 增加浏览次数(异步,不等待)
    coursewareSquareService.incrementViewCount(courseware.id);

    navigate(path);
  };

  return (
    <ManagementLayout>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '16px' }}>课件广场</Title>
          <Text type="secondary">
            发现和学习优质课件,{isAuthenticated ? '您可以点赞和播放课件' : '登录后可以点赞和发布课件'}
          </Text>
        </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={16}>
            <Search
              placeholder="搜索课件标题或描述..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Select
              value={filters.sortBy}
              onChange={handleSortChange}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="latest">最新发布</Option>
              <Option value="popular">最受欢迎</Option>
              <Option value="likes">点赞最多</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 课件列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
        </div>
      ) : coursewares.length === 0 ? (
        <Empty
          description="暂无公开课件"
          style={{ padding: '48px' }}
        />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {coursewares.map(courseware => (
              <Col xs={24} sm={12} md={8} lg={6} key={courseware.id}>
                <Card
                  hoverable
                  style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                  onClick={() => handlePlay(courseware)}
                  cover={
                    <div style={{
                      height: '150px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '48px',
                    }}>
                      <PlayCircleOutlined />
                    </div>
                  }
                >
                  <div style={{ flex: 1 }}>
                    <Title level={5} ellipsis={{ rows: 2 }} style={{ marginBottom: '8px' }}>
                      {courseware.title}
                    </Title>
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      type="secondary"
                      style={{ fontSize: '13px', marginBottom: '12px' }}
                    >
                      {courseware.description || '暂无描述'}
                    </Paragraph>
                    <Space size={[8, 8]} wrap style={{ marginBottom: '12px' }}>
                      <Tag color="blue">{courseware.groupName}</Tag>
                    </Space>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #f0f0f0',
                    paddingTop: '12px',
                  }}>
                    <Space size={16}>
                      <span style={{ fontSize: '13px', color: '#888' }}>
                        <EyeOutlined /> {courseware.viewsCount}
                      </span>
                      <span style={{ fontSize: '13px', color: '#888' }}>
                        <LikeOutlined /> {courseware.likesCount}
                      </span>
                    </Space>
                    <Button
                      type="text"
                      icon={courseware.isLiked ? <HeartFilled style={{ color: '#f5222d' }} /> : <HeartOutlined />}
                      onClick={(e) => handleLike(courseware, e)}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* 分页 */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Pagination
              current={filters.page}
              pageSize={filters.pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger
              showTotal={(total) => `共 ${total} 个课件`}
            />
          </div>
        <        />
      )}
      </div>
    </ManagementLayout>
  );
};

export default CoursewareSquare;

