/**
 * 认证页面 - 登录和注册
 */

import React, { useState } from 'react';
import { Form, Input, Button, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [form] = Form.useForm();

  // 处理登录
  const handleSignIn = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) {
        message.error(error);
      } else {
        message.success('登录成功！');
        // 跳转到首页
        navigate('/', { replace: true });
      }
    } catch (error) {
      message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理注册
  const handleSignUp = async (values: { email: string; password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(values.email, values.password);
      if (error) {
        message.error(error);
      } else {
        message.success('注册成功！请查收邮箱验证邮件。');
        setActiveTab('signin');
        form.resetFields();
      }
    } catch (error) {
      message.error('注册失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理密码重置
  const handleResetPassword = async (values: { email: string }) => {
    setLoading(true);
    try {
      const { error } = await resetPassword(values.email);
      if (error) {
        message.error(error);
      } else {
        message.success('密码重置邮件已发送，请查收！');
        setActiveTab('signin');
        form.resetFields();
      }
    } catch (error) {
      message.error('发送失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-6">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 animate-slide-up">
          {/* Back to Home Button */}
          <div className="flex justify-center mb-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <HomeOutlined />
              <span>返回首页</span>
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Reedu 课件系统</h1>
            <p className="text-gray-600">登录或注册以使用完整功能</p>
          </div>

          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key as any);
              form.resetFields();
            }}
            centered
            items={[
              {
                key: 'signin',
                label: <span className="text-base font-medium">🔐 登录</span>,
                children: (
                  <Form
                    form={form}
                    name="signin"
                    onFinish={handleSignIn}
                    autoComplete="off"
                    layout="vertical"
                    className="mt-6"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' },
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="邮箱"
                        size="large"
                        className="rounded-lg"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: '请输入密码' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="密码"
                        size="large"
                        className="rounded-lg"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        size="large"
                        className="h-12 text-base font-semibold rounded-lg"
                      >
                        登录
                      </Button>
                    </Form.Item>

                    <div className="text-center">
                      <button
                        onClick={() => setActiveTab('reset')}
                        className="text-blue-600 hover:text-blue-700 hover:underline transition-all"
                      >
                        忘记密码?
                      </button>
                    </div>
                  </Form>
                ),
              },
              {
                key: 'signup',
                label: <span className="text-base font-medium">📝 注册</span>,
                children: (
                  <Form
                    form={form}
                    name="signup"
                    onFinish={handleSignUp}
                    autoComplete="off"
                    layout="vertical"
                    className="mt-6"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' },
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="邮箱"
                        size="large"
                        className="rounded-lg"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[
                        { required: true, message: '请输入密码' },
                        { min: 6, message: '密码至少6位' },
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="密码(至少6位)"
                        size="large"
                        className="rounded-lg"
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      rules={[{ required: true, message: '请确认密码' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="确认密码"
                        size="large"
                        className="rounded-lg"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        size="large"
                        className="h-12 text-base font-semibold rounded-lg"
                      >
                        注册
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'reset',
                label: <span className="text-base font-medium">🔑 重置密码</span>,
                children: (
                  <Form
                    form={form}
                    name="reset"
                    onFinish={handleResetPassword}
                    autoComplete="off"
                    layout="vertical"
                    className="mt-6"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' },
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="注册时使用的邮箱"
                        size="large"
                        className="rounded-lg"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        size="large"
                        className="h-12 text-base font-semibold rounded-lg"
                      >
                        发送重置邮件
                      </Button>
                    </Form.Item>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        我们将发送密码重置链接到您的邮箱
                      </p>
                    </div>
                  </Form>
                ),
              },
            ]}
          />

          {/* Footer */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-white/80 text-sm">
            使用 Reedu 课件系统，让教学更简单
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
