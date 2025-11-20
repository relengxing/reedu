/**
 * 配置页面 - 重新设计
 * 包含:用户仓库管理、本地上传课件、课件发布、提示词生成器
 */

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, List, Tabs, Upload, Tag, Popconfirm, Switch, Modal, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, DragOutlined, GithubOutlined, GlobalOutlined, EditOutlined, EyeOutlined, LikeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCourseware } from '../context/CoursewareContext';
import { useAuth } from '../context/AuthContext';
import { parseHTMLCourseware } from '../utils/coursewareParser';
import type { UploadFile } from 'antd';
import PromptGenerator from '../components/PromptGenerator';
import * as userRepoService from '../services/userRepoService';
import * as coursewareSquareService from '../services/coursewareSquareService';
import type { UserRepo } from '../services/userRepoService';
import type { PublicCourseware } from '../services/coursewareSquareService';

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
  const [publishForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // 用户仓库相关
  const [userRepos, setUserRepos] = useState<UserRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  
  // 公开课件相关
  const [publicCoursewares, setPublicCoursewares] = useState<PublicCourseware[]>([]);
  const [loadingPublicCoursewares, setLoadingPublicCoursewares] = useState(false);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // 加载用户仓库
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserRepos();
      loadPublicCoursewares();
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

  const loadPublicCoursewares = async () => {
    if (!user) return;
    setLoadingPublicCoursewares(true);
    try {
      const coursewares = await coursewareSquareService.getUserPublicCoursewares(user.id);
      setPublicCoursewares(coursewares);
    } catch (error) {
      console.error('加载公开课件失败:', error);
    } finally {
      setLoadingPublicCoursewares(false);
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
      const { success, error } = await userRepoService.removeUserRepo(repoId);
      if (success) {
        message.success('仓库已删除');
        // 刷新仓库列表显示
        await loadUserRepos();
        // 触发CoursewareContext重新加载课件
        await loadUserReposFromContext();
      } else {
        message.error(error || '删除失败');
      }
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

  // 打开发布课件对话框
  const handleOpenPublishModal = (group: any) => {
    setSelectedGroup(group);
    publishForm.setFieldsValue({
      title: group.name,
      description: '',
    });
    setPublishModalVisible(true);
  };

  // 发布课件
  const handlePublishCourseware = async () => {
    if (!user || !selectedGroup) return;

    try {
      const values = await publishForm.validateFields();
      const { success, error } = await coursewareSquareService.publishCourseware(
        user.id,
        selectedGroup.coursewares[0]?.sourcePath || '', // 使用第一个课件的sourcePath作为repoUrl
        selectedGroup.id,
        selectedGroup.name,
        values.title,
        values.description
      );

      if (success) {
        message.success('课件发布成功');
        setPublishModalVisible(false);
        loadPublicCoursewares();
      } else {
        message.error(error || '发布失败');
      }
    } catch (error) {
      message.error('发布失败');
    }
  };

  // 切换课件公开状态
  const handleTogglePublic = async (courseware: PublicCourseware) => {
    try {
      const { success, error } = await coursewareSquareService.updateCourseware(
        courseware.id,
        { isPublic: !courseware.isPublic }
      );

      if (success) {
        message.success(courseware.isPublic ? '已取消公开' : '已公开');
        loadPublicCoursewares();
      } else {
        message.error(error || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 删除公开课件
  const handleDeletePublicCourseware = async (coursewareId: string) => {
    try {
      const { success, error } = await coursewareSquareService.deleteCourseware(coursewareId);
      if (success) {
        message.success('已删除');
        loadPublicCoursewares();
      } else {
        message.error(error || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
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
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>配置中心</Title>

      <Tabs
        defaultActiveKey="upload"
        items={[
          // 我的仓库 - 需要登录
          {
            key: 'my-repos',
            label: '我的仓库',
            children: isAuthenticated ? (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Alert
                  message="绑定您的GitHub或Gitee仓库"
                  description="添加仓库后,系统会自动加载仓库中的课件。您可以绑定多个仓库。"
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
            ) : (
              <Card>
                <Alert
                  message="需要登录"
                  description="请先登录以管理您的课件仓库"
                  type="warning"
                  showIcon
                  action={
                    <Button type="primary" onClick={() => navigate('/auth')}>
                      去登录
                    </Button>
                  }
                />
              </Card>
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

          // 我的公开课件
          {
            key: 'public-coursewares',
            label: '我的公开课件',
            children: isAuthenticated ? (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Alert
                  message="管理您的公开课件"
                  description="您可以将课件发布到课件广场,让其他用户发现和学习。"
                  type="info"
                  showIcon
                />

                <Card title="发布课件到广场">
                  <Paragraph>
                    从已加载的课件组中选择要发布的课件:
                  </Paragraph>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {bundledCoursewareGroups.map((group) => (
                      <Card key={group.id} size="small">
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <div>
                            <Text strong>{group.name}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {group.coursewares.length} 个课件
                            </Text>
                          </div>
                          <Button
                            type="primary"
                            icon={<GlobalOutlined />}
                            onClick={() => handleOpenPublishModal(group)}
                          >
                            发布到广场
                          </Button>
                        </Space>
                      </Card>
                    ))}
                  </Space>
                </Card>

                <Card title="已发布的课件" loading={loadingPublicCoursewares}>
                  <List
                    dataSource={publicCoursewares}
                    renderItem={(courseware) => (
                      <List.Item
                        actions={[
                          <Switch
                            checked={courseware.isPublic}
                            onChange={() => handleTogglePublic(courseware)}
                            checkedChildren="公开"
                            unCheckedChildren="私密"
                          />,
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              // TODO: 实现编辑功能
                              message.info('编辑功能即将上线');
                            }}
                          >
                            编辑
                          </Button>,
                          <Popconfirm
                            title="确定要删除吗?"
                            onConfirm={() => handleDeletePublicCourseware(courseware.id)}
                          >
                            <Button size="small" danger icon={<DeleteOutlined />}>
                              删除
                            </Button>
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta
                          title={courseware.title}
                          description={
                            <Space direction="vertical">
                              <Text type="secondary">{courseware.description || '暂无描述'}</Text>
                              <Space>
                                <Tag icon={<EyeOutlined />}>{courseware.viewsCount} 浏览</Tag>
                                <Tag icon={<LikeOutlined />}>{courseware.likesCount} 点赞</Tag>
                                <Tag color={courseware.isPublic ? 'green' : 'default'}>
                                  {courseware.isPublic ? '已公开' : '未公开'}
                                </Tag>
                              </Space>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                    locale={{ emptyText: '暂无发布的课件' }}
                  />
                </Card>
              </Space>
            ) : (
              <Card>
                <Alert
                  message="需要登录"
                  description="请先登录以发布和管理公开课件"
                  type="warning"
                  showIcon
                  action={
                    <Button type="primary" onClick={() => navigate('/auth')}>
                      去登录
                    </Button>
                  }
                />
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

      {/* 发布课件对话框 */}
      <Modal
        title="发布课件到广场"
        open={publishModalVisible}
        onOk={handlePublishCourseware}
        onCancel={() => setPublishModalVisible(false)}
        width={600}
      >
        <Form form={publishForm} layout="vertical">
          <Form.Item
            name="title"
            label="课件标题"
            rules={[{ required: true, message: '请输入课件标题' }]}
          >
            <Input placeholder="请输入课件标题" />
          </Form.Item>
          <Form.Item
            name="description"
            label="课件描述"
            rules={[{ required: true, message: '请输入课件描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="请简要描述课件内容、适用年级、知识点等信息"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigPage;

