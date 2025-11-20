import React from 'react';
import { Card, List, Typography, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCourseware } from '../context/CoursewareContext';
import { FileTextOutlined } from '@ant-design/icons';

const { Title } = Typography;

const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseware, currentCoursewareIndex } = useCourseware();

  if (!courseware) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={3}>暂无课件</Title>
        <p>请先在首页导入课件</p>
        <Button type="primary" onClick={() => navigate('/')}>
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>{courseware.title}</Title>
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
  );
};

export default CatalogPage;

