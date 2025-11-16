import React from 'react';
import { Card, Space, Typography, List, Popconfirm, Tag, Button } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCourseware } from '../context/CoursewareContext';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    coursewares, 
    setCurrentCoursewareIndex, 
    bundledCoursewares,
    addBundledCourseware,
    removeCourseware,
  } = useCourseware();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>课件资源管理</Title>
      <Paragraph>
        管理可用的课件资源。点击"使用"按钮将课件添加到使用列表，或访问"配置"页面进行更多操作。
      </Paragraph>

      {/* 课件资源列表 */}
      {bundledCoursewares.length > 0 && (
        <Card style={{ marginTop: '24px' }}>
          <Title level={4}>可用课件资源（{bundledCoursewares.length}个）</Title>
          <Paragraph type="secondary" style={{ marginBottom: '16px' }}>
            这些是已加载的课件资源，可以选择使用。删除后不会影响资源本身，只是从使用列表中移除。
          </Paragraph>
          <List
            dataSource={bundledCoursewares}
            renderItem={(cw) => {
              const isInUse = coursewares.some(usedCw => usedCw.sourcePath === cw.sourcePath);
              return (
                <List.Item
                  actions={[
                    isInUse ? (
                      <Popconfirm
                        title="确定要从使用列表中移除这个课件吗？"
                        onConfirm={() => {
                          const usedIndex = coursewares.findIndex(ucw => ucw.sourcePath === cw.sourcePath);
                          if (usedIndex >= 0) {
                            removeCourseware(usedIndex);
                          }
                        }}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                          移除
                        </Button>
                      </Popconfirm>
                    ) : (
                      <Button
                        size="small"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          addBundledCourseware(cw);
                        }}
                      >
                        使用
                      </Button>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{cw.title}</span>
                        {cw.groupName && <Tag>{cw.groupName}</Tag>}
                        {isInUse && <Tag color="green">使用中</Tag>}
                      </Space>
                    }
                    description={cw.sourcePath}
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      )}

      {/* 正在使用的课件列表 */}
      {coursewares.length > 0 && (
        <Card style={{ marginTop: '24px' }}>
          <Title level={4}>正在使用的课件（{coursewares.length}个）</Title>
          <List
            dataSource={coursewares}
            renderItem={(cw, index) => (
              <List.Item
                actions={[
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      setCurrentCoursewareIndex(index);
                      navigate('/catalog');
                    }}
                  >
                    查看目录
                  </Button>,
                  <Popconfirm
                    title="确定要删除这个课件吗？"
                    onConfirm={() => {
                      removeCourseware(index);
                    }}
                  >
                    <Button size="small" danger type="link" icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{index + 1}. {cw.title}</span>
                      {cw.isBundled && <Tag>预编译</Tag>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {bundledCoursewares.length === 0 && coursewares.length === 0 && (
        <Card>
          <Typography.Text type="secondary">
            暂无课件资源。请访问"配置"页面添加课件仓库或手动上传课件。
          </Typography.Text>
        </Card>
      )}
    </div>
  );
};

export default HomePage;

