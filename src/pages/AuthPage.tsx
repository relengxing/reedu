/**
 * 认证页面 - 登录和注册
 */

import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Link } = Typography;

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px',
    }}>
      <Card style={{ width: '100%', maxWidth: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <Button icon={<HomeOutlined />} onClick={() => navigate('/')} type="link">
            返回首页
          </Button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>Reedu 课件系统</Title>
          <Text type="secondary">登录或注册以使用完整功能</Text>
        </div>

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
              label: '登录',
              children: (
                <Form
                  form={form}
                  name="signin"
                  onFinish={handleSignIn}
                  autoComplete="off"
                  layout="vertical"
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
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large">
                      登录
                    </Button>
                  </Form.Item>

                  <div style={{ textAlign: 'center' }}>
                    <Link onClick={() => setActiveTab('reset')}>忘记密码?</Link>
                  </div>
                </Form>
              ),
            },
            {
              key: 'signup',
              label: '注册',
              children: (
                <Form
                  form={form}
                  name="signup"
                  onFinish={handleSignUp}
                  autoComplete="off"
                  layout="vertical"
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
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large">
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'reset',
              label: '重置密码',
              children: (
                <Form
                  form={form}
                  name="reset"
                  onFinish={handleResetPassword}
                  autoComplete="off"
                  layout="vertical"
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
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large">
                      发送重置邮件
                    </Button>
                  </Form.Item>

                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      我们将发送密码重置链接到您的邮箱
                    </Text>
                  </div>
                </Form>
              ),
            },
          ]}
        />

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Button type="link" onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AuthPage;

