import React, { useState } from 'react';
import { Card, Tabs, Upload, Button, message, Space, Typography, List, Popconfirm, Tag } from 'antd';
import { UploadOutlined, DragOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCourseware } from '../context/CoursewareContext';
import { parseHTMLCourseware } from '../utils/coursewareParser';
import PromptGenerator from '../components/PromptGenerator';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    addCourseware, 
    coursewares, 
    setCurrentCoursewareIndex, 
    reorderCoursewares,
    bundledCoursewares,
    bundledCoursewareGroups,
    addBundledCourseware,
    removeCourseware,
  } = useCourseware();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleUpload = async (file: File) => {
    try {
      const text = await file.text();
      const coursewareData = parseHTMLCourseware(text, file.name);
      addCourseware(coursewareData);
      message.success(`课件"${coursewareData.title}"导入成功！`);
      // 不自动跳转，让用户继续选择其他课件
      return false; // 阻止默认上传行为
    } catch (error) {
      message.error('课件导入失败：' + (error as Error).message);
      return false;
    }
  };

  const uploadProps = {
    beforeUpload: handleUpload,
    fileList,
    onChange: ({ fileList }: { fileList: UploadFile[] }) => {
      setFileList(fileList);
    },
    accept: '.html',
    multiple: true, // 支持多选
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>通用课件播放框架</Title>
      <Tabs
        defaultActiveKey="import"
        items={[
          {
            key: 'import',
            label: '导入课件',
            children: (
              <Card>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Title level={4}>导入HTML课件</Title>
                    <Paragraph>
                      请上传符合规范的HTML课件文件。课件将被自动切分为多个页面，并统一处理数学公式。
                    </Paragraph>
                  </div>
                  <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />}>选择HTML文件（可多选）</Button>
                  </Upload>
                  
                  {/* 预编译课件资源管理 */}
                  {bundledCoursewares.length > 0 && (
                    <div style={{ marginTop: '32px' }}>
                      <Title level={5}>预编译课件资源（{bundledCoursewares.length}个）：</Title>
                      <Paragraph type="secondary" style={{ marginBottom: '16px' }}>
                        这些是编译期导入的课件资源，可以选择使用或删除。删除后不会影响资源本身，只是从使用列表中移除。
                      </Paragraph>
                      <List
                        dataSource={bundledCoursewares}
                        renderItem={(cw, index) => {
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
                                        message.success('已从使用列表移除');
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
                                      message.success(`已添加课件"${cw.title}"到使用列表`);
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
                    </div>
                  )}

                  {/* 正在使用的课件列表 */}
                  {coursewares.length > 0 && (
                    <div style={{ marginTop: '32px' }}>
                      <Title level={5}>正在使用的课件（{coursewares.length}个）：</Title>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {coursewares.map((cw, index) => (
                          <Card
                            key={index}
                            size="small"
                            style={{
                              background: '#f5f5f5',
                              cursor: 'move',
                              opacity: draggedIndex === index ? 0.5 : 1,
                              border: dragOverIndex === index ? '2px dashed #1890ff' : '1px solid #d9d9d9',
                              transition: 'all 0.2s',
                            }}
                            draggable
                            onDragStart={(e) => {
                              setDraggedIndex(index);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              setDragOverIndex(index);
                            }}
                            onDragLeave={() => {
                              setDragOverIndex(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedIndex !== null && draggedIndex !== index) {
                                reorderCoursewares(draggedIndex, index);
                              }
                              setDraggedIndex(null);
                              setDragOverIndex(null);
                            }}
                            onDragEnd={() => {
                              setDraggedIndex(null);
                              setDragOverIndex(null);
                            }}
                          >
                            <Space>
                              <DragOutlined style={{ color: '#999', cursor: 'grab' }} />
                              <span>{index + 1}. {cw.title}</span>
                              {cw.isBundled && <Tag>预编译</Tag>}
                              <Button
                                size="small"
                                type="link"
                                onClick={() => {
                                  setCurrentCoursewareIndex(index);
                                  navigate('/catalog');
                                }}
                              >
                                查看目录
                              </Button>
                              <Popconfirm
                                title="确定要删除这个课件吗？"
                                onConfirm={() => {
                                  removeCourseware(index);
                                  message.success('已删除');
                                }}
                              >
                                <Button size="small" danger type="link" icon={<DeleteOutlined />}>
                                  删除
                                </Button>
                              </Popconfirm>
                            </Space>
                          </Card>
                        ))}
                      </Space>
                      <Paragraph type="secondary" style={{ marginTop: '8px', fontSize: '12px' }}>
                        提示：拖拽课件卡片可以调整顺序
                      </Paragraph>
                    </div>
                  )}
                  <div>
                    <Title level={5}>课件要求：</Title>
                    <ul>
                      <li>页面宽高比为16:9</li>
                      <li>使用KaTeX或MathJax处理数学公式</li>
                      <li>建议使用section标签或特定class标记章节</li>
                      <li>支持目录结构，便于导航</li>
                    </ul>
                  </div>
                </Space>
              </Card>
            ),
          },
          {
            key: 'prompt',
            label: '生成提示词',
            children: <PromptGenerator />,
          },
        ]}
      />
    </div>
  );
};

export default HomePage;

