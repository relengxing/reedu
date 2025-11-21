import React from 'react';
import { Card, List, Typography, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCourseware } from '../context/CoursewareContext';
import { FileTextOutlined, PlayCircleOutlined } from '@ant-design/icons';
import ManagementLayout from '../components/ManagementLayout';

const { Title } = Typography;

const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseware, currentCoursewareIndex } = useCourseware();

  if (!courseware) {
    return (
      <ManagementLayout>
        <div style={{ padding: '24px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Title level={3}>暂无课件</Title>
          <p>请先在配置中心添加课件，或在课件导航中选择课件组</p>
          <Space>
            <Button type="primary" onClick={() => navigate('/config')}>
              前往配置
            </Button>
            <Button onClick={() => navigate('/navigation')}>
              课件导航
            </Button>
          </Space>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>{courseware.title}</Title>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => {
              // 使用语义化URL跳转到第一页
              if (courseware.platform && courseware.owner && courseware.repo && courseware.filePath) {
                const courseFileName = courseware.filePath.split('/').pop()?.replace('.html', '') || '';
                const folder = courseware.groupId || '';
                navigate(`/${courseware.platform}/${courseware.owner}/${courseware.repo}/${folder}/${courseFileName}/0`);
              } else {
                navigate(`/player/${currentCoursewareIndex}/0`);
              }
            }}
          >
            开始播放
          </Button>
        </div>
      {courseware.metadata && (
        <Card style={{ marginBottom: '24px' }}>
          <Space direction="vertical">
            {courseware.metadata.subject && <p>学科：{courseware.metadata.subject}</p>}
            {courseware.metadata.grade && <p>年级：{courseware.metadata.grade}</p>}
            {courseware.metadata.semester && <p>学期：{courseware.metadata.semester}</p>}
            {courseware.metadata.author && <p>作者：{courseware.metadata.author}</p>}
            {courseware.metadata.unit && <p>单位：{courseware.metadata.unit}</p>}
            {courseware.metadata.version && <p>教材版本：{courseware.metadata.version}</p>}
          </Space>
        </Card>
      )}
      <Card>
        <List
          dataSource={courseware.pages}
          renderItem={(page, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={<FileTextOutlined style={{ fontSize: '24px' }} />}
                title={
                  <Button
                    type="link"
                    onClick={() => {
                      // 使用语义化URL
                      if (courseware.platform && courseware.owner && courseware.repo && courseware.filePath) {
                        const courseFileName = courseware.filePath.split('/').pop()?.replace('.html', '') || '';
                        const folder = courseware.groupId || '';
                        navigate(`/${courseware.platform}/${courseware.owner}/${courseware.repo}/${folder}/${courseFileName}/${index}`);
                      } else {
                        navigate(`/player/${currentCoursewareIndex}/${index}`);
                      }
                    }}
                    style={{ padding: 0, height: 'auto' }}
                  >
                    {page.title || `第${index + 1}页`}
                  </Button>
                }
                description={`页面 ${index + 1} / ${courseware.pages.length}`}
              />
            </List.Item>
          )}
        />
      </Card>
      </div>
    </ManagementLayout>
  );
};

export default CatalogPage;

