/**
 * 配置页面 - 重新设计
 * 包含:用户仓库管理、本地上传课件、提示词生成器
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Space, List, Tabs, Upload, Tag, Popconfirm } from 'antd';
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
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">配置中心</h2>

        <Tabs
          defaultActiveKey="upload"
          items={[
            // 我的仓库 - 可选登录（登录后保存到云端，未登录保存到本地）
            {
              key: 'my-repos',
              label: <span className="text-base font-medium">📁 我的仓库</span>,
              children: (
                <div className="space-y-6">
                  {!isAuthenticated && (
                    <div className="glass-card p-6 border-l-4 border-amber-400">
                      <div className="flex gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-2">未登录 - 当前使用本地存储</h4>
                          <p className="text-gray-700 mb-2">您当前未登录，添加的仓库将保存到浏览器本地存储（仅在本设备可用）。</p>
                          <button
                            onClick={() => navigate('/auth')}
                            className="text-blue-600 hover:text-blue-700 font-medium underline"
                          >
                            登录以启用云端同步，在任何设备访问您的课件
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isAuthenticated && (
                    <div className="glass-card p-6 border-l-4 border-green-400">
                      <div className="flex gap-3">
                        <div className="text-2xl">✅</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-2">已登录 - 云端同步已启用</h4>
                          <p className="text-gray-700">仓库配置将保存到云端（{user?.email}），您可以在任何设备访问。</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="glass-card p-6 border-l-4 border-blue-400">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3 flex-1">
                        <div className="text-2xl">ℹ️</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-2">
                            {isAuthenticated ? "管理您的课件仓库" : "添加本地仓库"}
                          </h4>
                          <p className="text-gray-700">添加 GitHub 或 Gitee 仓库后，系统会自动加载仓库中的课件。您可以添加多个仓库。</p>
                        </div>
                      </div>
                      <Popconfirm
                        title="确定要清理缓存吗?"
                        description="这将清除所有本地缓存的课件数据并刷新页面"
                        onConfirm={handleClearCache}
                      >
                        <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200">
                          清理缓存
                        </button>
                      </Popconfirm>
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <Form form={form} layout="inline" onFinish={handleAddUserRepo} className="flex flex-wrap gap-3">
                      <Form.Item
                        name="repoUrl"
                        rules={[{ required: true, message: '请输入仓库URL' }]}
                        className="flex-1 min-w-[300px]"
                      >
                        <Input
                          placeholder="https://github.com/user/repo 或 gitee/user/project"
                          prefix={<GithubOutlined />}
                          size="large"
                        />
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<PlusOutlined />} size="large">
                          添加仓库
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">我的仓库列表</h3>
                    {loadingRepos ? (
                      <div className="text-center py-8 text-gray-500">加载中...</div>
                    ) : (
                      <List
                        dataSource={userRepos}
                        renderItem={(repo) => (
                          <List.Item
                            className="!border-b border-gray-200/50 last:!border-b-0"
                            actions={[
                              <Popconfirm
                                key="delete"
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
                              avatar={
                                <div className="text-4xl">
                                  {repo.platform === 'github' ? '🐙' : '🌐'}
                                </div>
                              }
                              title={<span className="font-semibold text-gray-800">{repo.repoUrl}</span>}
                              description={
                                <Space>
                                  <Tag color={repo.platform === 'github' ? 'blue' : 'orange'}>
                                    {repo.platform}
                                  </Tag>
                                  <span className="text-xs text-gray-500">
                                    {new Date(repo.createdAt).toLocaleDateString()}
                                  </span>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                        locale={{ emptyText: '暂无仓库,请添加' }}
                      />
                    )}
                  </div>
                </div>
              ),
            },

            // 本地上传课件
            {
              key: 'upload',
              label: <span className="text-base font-medium">📤 本地上传课件</span>,
              children: (
                <div className="glass-card p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">导入HTML课件</h3>
                      <p className="text-gray-600">
                        请上传符合规范的HTML课件文件。课件将被自动切分为多个页面，并统一处理数学公式。
                      </p>
                    </div>
                    <Upload {...uploadProps}>
                      <Button icon={<UploadOutlined />} size="large">选择HTML文件（可多选）</Button>
                    </Upload>

                    {coursewares.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-4">
                          已导入的课件（{coursewares.length}个）：
                        </h4>
                        <div className="space-y-3">
                          {coursewares.map((cw, index) => (
                            <div
                              key={index}
                              className={`bg-white/60 backdrop-blur-sm border border-white/40 p-4 rounded-xl transition-all duration-200 cursor-move ${
                                draggedIndex === index ? 'opacity-50' : ''
                              } ${
                                dragOverIndex === index ? 'border-2 border-dashed border-blue-400' : ''
                              }`}
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
                              <div className="flex items-center gap-3">
                                <DragOutlined className="text-gray-400 text-xl" />
                                <span className="flex-1 font-medium text-gray-800">
                                  {index + 1}. {cw.title}
                                </span>
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
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ),
            },

            // 提示词生成器
            {
              key: 'prompt',
              label: <span className="text-base font-medium">✨ 生成提示词</span>,
              children: <PromptGenerator />,
            },
          ]}
        />

      </div>
    </ManagementLayout>
  );
};

export default ConfigPage;
