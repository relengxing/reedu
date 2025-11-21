/**
 * 配置页面 - 重新设计
 * 包含:用户仓库管理、本地上传课件、提示词生成器
 */

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, List, Tabs, Upload, Tag, Popconfirm, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, DragOutlined, GithubOutlined, GlobalOutlined } from '@ant-design/icons';
import ManagementLayout from '../components/ManagementLayout';
import { useNavigate } from 'react-router-dom';
import { useCourseware } from '../context/CoursewareContext';
import { useAuth } from '../context/AuthContext';
import { parseHTMLCourseware } from '../utils/coursewareParser';
import type { UploadFile } from 'antd';
import PromptGenerator from '../components/PromptGenerator';
import * as userRepoService from '../services/userRepoService';
import { deleteUserRepo } from '../services/userRepoService';
import type { UserRepo } from '../services/userRepoService';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const ConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const {
    coursewares,
    setCoursewares,
    addCourseware,
    removeCourseware,
    reorderCoursewares,
    setCurrentCoursewareIndex,
    bundledCoursewareGroups,
    loadUserRepos: loadUserReposFromContext,
  } = useCourseware();

  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // 用户仓库相关
  const [userRepos, setUserRepos] = useState<UserRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  // 加载用户仓库
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserRepos();
    }
  }, [isAuthenticated, user]);

  const loadUserRepos = async () => {
    if (!user) return;
    setLoadingRepos(true);
    try {
      const repos = await userRepoService.getUserRepos(user.id);
      setUserRepos(repos);
    } catch (error) {
      console.error('加载用户仓库失败:', error);
    } finally {
      setLoadingRepos(false);
    }
  };


  // 添加用户仓库
  const handleAddUserRepo = async (values: { repoUrl: string }) => {
    if (!user) {
      message.error('请先登录');
      return;
    }

    try {
      const { success, error } = await userRepoService.addUserRepo(user.id, values.repoUrl);
      if (success) {
        message.success('仓库添加成功');
        form.resetFields();
        // 刷新仓库列表显示
        await loadUserRepos();
        // 触发CoursewareContext重新加载课件
        await loadUserReposFromContext();
        message.success('课件已加载');
      } else {
        message.error(error || '添加失败');
      }
    } catch (error) {
      message.error('添加失败');
    }
  };

  // 删除用户仓库
  const handleRemoveUserRepo = async (repoId: string) => {
    try {
      await deleteUserRepo(repoId);
      message.success('仓库已删除');
      // 刷新仓库列表显示
      await loadUserRepos();
      // 触发CoursewareContext重新加载课件
      await loadUserReposFromContext();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 上传本地课件
  const handleUpload = async (file: File) => {
    try {
      const text = await file.text();
      const coursewareData = parseHTMLCourseware(text, file.name);
      addCourseware(coursewareData);
      message.success(`课件"${coursewareData.title}"导入成功！`);
      return false;
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


  // 清理缓存（清理localStorage中的课件数据）
  const handleClearCache = () => {
    try {
      localStorage.removeItem('reedu_coursewares');
      localStorage.removeItem('reedu_current_courseware_index');
      // 清空当前课件列表
      setCoursewares([]);
      setCurrentCoursewareIndex(0);
      message.success('缓存已清理，即将刷新页面');
      // 刷新页面以重新加载
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      message.error('清理缓存失败');
    }
  };

  return (
    <ManagementLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: '24px' }}>配置中心</Title>

      <Tabs
        defaultActiveKey="upload"
        items={[
          // 我的仓库 - 可选登录（登录后保存到云端，未登录保存到本地）
          {
            key: 'my-repos',
            label: '我的仓库',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {!isAuthenticated && (
                  <Alert
                    message="未登录 - 当前使用本地存储"
                    description={
                      <div>
                        <p>您当前未登录，添加的仓库将保存到浏览器本地存储（仅在本设备可用）。</p>
                        <Button type="link" style={{ padding: 0 }} onClick={() => navigate('/auth')}>
                          登录以启用云端同步，在任何设备访问您的课件
                        </Button>
                      </div>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                )}
                
                {isAuthenticated && (
                  <Alert
                    message="已登录 - 云端同步已启用"
                    description={`仓库配置将保存到云端（${user?.email}），您可以在任何设备访问。`}
                    type="success"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                )}

                <Alert
                  message={isAuthenticated ? "管理您的课件仓库" : "添加本地仓库"}
                  description="添加 GitHub 或 Gitee 仓库后，系统会自动加载仓库中的课件。您可以添加多个仓库。"
                  type="info"
                  showIcon
                  action={
                    <Popconfirm
                      title="确定要清理缓存吗?"
                      description="这将清除所有本地缓存的课件数据并刷新页面"
                      onConfirm={handleClearCache}
                    >
                      <Button size="small" danger>
                        清理缓存
                      </Button>
                    </Popconfirm>
                  }
                />

                <Card>
                  <Form form={form} layout="inline" onFinish={handleAddUserRepo}>
                    <Form.Item
                      name="repoUrl"
                      rules={[{ required: true, message: '请输入仓库URL' }]}
                      style={{ flex: 1, minWidth: '300px' }}
                    >
                      <Input
                        placeholder="https://github.com/user/repo 或 gitee/user/project"
                        prefix={<GithubOutlined />}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                        添加仓库
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>

                <Card title="我的仓库列表" loading={loadingRepos}>
                  <List
                    dataSource={userRepos}
                    renderItem={(repo) => (
                      <List.Item
                        actions={[
                          <Popconfirm
                            title="确定要删除这个仓库吗?"
                            onConfirm={() => handleRemoveUserRepo(repo.id)}
                          >
                            <Button size="small" danger icon={<DeleteOutlined />}>
                              删除
                            </Button>
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={repo.platform === 'github' ? <GithubOutlined style={{ fontSize: '24px' }} /> : <GlobalOutlined style={{ fontSize: '24px' }} />}
                          title={repo.repoUrl}
                          description={
                            <Space>
                              <Tag color={repo.platform === 'github' ? 'blue' : 'orange'}>
                                {repo.platform}
                              </Tag>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {new Date(repo.createdAt).toLocaleDateString()}
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                    locale={{ emptyText: '暂无仓库,请添加' }}
                  />
                  </Card>
                </Space>
              ),
          },

          // 本地上传课件
          {
            key: 'upload',
            label: '本地上传课件',
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
                            }}
                            draggable
                            onDragStart={() => setDraggedIndex(index)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverIndex(index);
                            }}
                            onDragLeave={() => setDragOverIndex(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedIndex !== null && draggedIndex !== index) {
                                reorderCoursewares(draggedIndex, index);
                              }
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
                                title="确定要删除这个课件吗?"
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
                    </div>
                  )}
                </Space>
              </Card>
            ),
          },

          // 提示词生成器
          {
            key: 'prompt',
            label: '生成提示词',
            children: <PromptGenerator />,
          },
        ]}
      />

      </div>
    </ManagementLayout>
  );
};

export default ConfigPage;

