import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, List, Tabs, Upload, Tag, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, DragOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCourseware } from '../context/CoursewareContext';
import { parseHTMLCourseware } from '../utils/coursewareParser';
import type { CoursewareRepoConfig } from '../services/coursewareLoader';
import type { UploadFile } from 'antd';
import PromptGenerator from '../components/PromptGenerator';
import { DEFAULT_REPO_URL } from '../services/coursewareLoader';

const { Title, Paragraph, Text } = Typography;

const ConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    loadFromRepos, 
    isLoading, 
    repoConfigs, 
    addRepo, 
    removeRepo,
    coursewares,
    addCourseware,
    removeCourseware,
    reorderCoursewares,
    setCurrentCoursewareIndex,
  } = useCourseware();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleAddRepo = async (values: { baseUrl: string }) => {
    try {
      addRepo({ baseUrl: values.baseUrl });
      form.resetFields();
      message.success('仓库已添加');
      // 自动重新加载
      await loadFromRepos();
    } catch (error) {
      message.error(`添加失败: ${(error as Error).message}`);
    }
  };

  const handleRemoveRepo = async (baseUrl: string) => {
    if (baseUrl === DEFAULT_REPO_URL) {
      message.warning('默认仓库不能删除');
      return;
    }
    try {
      removeRepo(baseUrl);
      message.success('仓库已删除');
      // 自动重新加载
      await loadFromRepos();
    } catch (error) {
      message.error(`删除失败: ${(error as Error).message}`);
    }
  };

  const handleLoad = async () => {
    try {
      await loadFromRepos();
      message.success('课件加载成功！');
    } catch (error) {
      message.error(`加载失败: ${(error as Error).message}`);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const text = await file.text();
      const coursewareData = parseHTMLCourseware(text, file.name);
      addCourseware(coursewareData);
      message.success(`课件"${coursewareData.title}"导入成功！`);
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
    multiple: true,
  };

  const isDefaultRepo = (baseUrl: string) => baseUrl === DEFAULT_REPO_URL;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>配置</Title>
      
      <Tabs
        defaultActiveKey="repos"
        items={[
          {
            key: 'repos',
            label: '课件仓库',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card>
                  <Title level={4}>仓库列表</Title>
                  <Paragraph>
                    系统会从所有配置的仓库加载课件。默认仓库已自动添加。
                  </Paragraph>
                  
                  <List
                    dataSource={repoConfigs}
                    renderItem={(repo) => (
                      <List.Item
                        actions={[
                          !isDefaultRepo(repo.baseUrl) && (
                            <Popconfirm
                              title="确定要删除这个仓库吗？"
                              onConfirm={() => handleRemoveRepo(repo.baseUrl)}
                            >
                              <Button size="small" danger icon={<DeleteOutlined />}>
                                删除
                              </Button>
                            </Popconfirm>
                          ),
                        ].filter(Boolean)}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <Text>{repo.baseUrl}</Text>
                              {isDefaultRepo(repo.baseUrl) && <Tag color="blue">默认</Tag>}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />

                  <Form
                    form={form}
                    layout="inline"
                    onFinish={handleAddRepo}
                    style={{ marginTop: '16px' }}
                  >
                    <Form.Item
                      name="baseUrl"
                      rules={[
                        { required: true, message: '请输入仓库URL' },
                        { type: 'url', message: '请输入有效的URL' },
                      ]}
                      style={{ flex: 1, minWidth: '400px' }}
                    >
                      <Input
                        placeholder="https://github.com/user/repo 或 https://raw.githubusercontent.com/user/repo/main/"
                        disabled={isLoading}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" icon={<PlusOutlined />} disabled={isLoading}>
                        添加仓库
                      </Button>
                    </Form.Item>
                  </Form>

                  <Button
                    type="primary"
                    onClick={handleLoad}
                    loading={isLoading}
                    block
                    style={{ marginTop: '16px' }}
                  >
                    {isLoading ? '加载中...' : '重新加载所有课件'}
                  </Button>
                </Card>

                <Card>
                  <Title level={4}>使用说明</Title>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>1. 默认仓库</Text>
                      <Paragraph>
                        系统默认从 <Text code>{DEFAULT_REPO_URL}</Text> 加载课件。
                      </Paragraph>
                    </div>

                    <div>
                      <Text strong>2. 添加仓库</Text>
                      <Paragraph>
                        在上方输入框中输入仓库URL。支持两种格式：
                      </Paragraph>
                      <ul>
                        <li>
                          <Text strong>GitHub仓库地址：</Text>
                          <Text code>https://github.com/user/repo</Text>
                          <Text type="secondary">（系统会自动转换为raw URL，默认使用main分支）</Text>
                        </li>
                        <li>
                          <Text strong>Raw内容URL：</Text>
                          <Text code>https://raw.githubusercontent.com/user/repo/main/</Text>
                          <Text type="secondary">（直接使用，必须包含分支名）</Text>
                        </li>
                      </ul>
                      <Paragraph>
                        <Text strong>示例：</Text>
                        <br />
                        <Text code>https://github.com/relengxing/reedu-coursewares</Text>
                        <br />
                        <Text type="secondary">会自动转换为：</Text>
                        <br />
                        <Text code>https://raw.githubusercontent.com/relengxing/reedu-coursewares/main/</Text>
                      </Paragraph>
                    </div>

                    <div>
                      <Text strong>3. 仓库要求</Text>
                      <Paragraph>
                        每个仓库必须包含 <Text code>manifest.json</Text> 文件来列出所有课件。
                      </Paragraph>
                    </div>
                  </Space>
                </Card>
              </Space>
            ),
          },
          {
            key: 'upload',
            label: '手动加载课件',
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
                  
                  {coursewares.length > 0 && (
                    <div>
                      <Title level={5}>已导入的课件（{coursewares.length}个）：</Title>
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

export default ConfigPage;
