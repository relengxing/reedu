import React, { useState, useEffect } from 'react';
import { Drawer, Switch, Divider, Space, Typography, Button, InputNumber, Tabs } from 'antd';
import { HomeOutlined, ClockCircleOutlined, UserOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import SimplifiedRollCall from './SimplifiedRollCall';

const { Text, Title } = Typography;

interface PlayerDrawerProps {
  visible: boolean;
  onClose: () => void;
  showPageButtons: boolean;
  onShowPageButtonsChange: (show: boolean) => void;
  showCatalog: boolean;
  onShowCatalogChange: (show: boolean) => void;
  countdownTime: number;
  isCountdownRunning: boolean;
  isCountdownPaused: boolean;
  onCountdownTimeChange: (seconds: number) => void;
  onCountdownStart: () => void;
  onCountdownPause: () => void;
  onCountdownStop: () => void;
}

const PlayerDrawer: React.FC<PlayerDrawerProps> = ({
  visible,
  onClose,
  showPageButtons,
  onShowPageButtonsChange,
  showCatalog,
  onShowCatalogChange,
  countdownTime,
  isCountdownRunning,
  isCountdownPaused,
  onCountdownTimeChange,
  onCountdownStart,
  onCountdownPause,
  onCountdownStop,
}) => {
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const totalSeconds = minutes * 60 + seconds;
    onCountdownTimeChange(totalSeconds);
  }, [minutes, seconds, onCountdownTimeChange]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleReturnHome = () => {
    onClose();
    navigate('/');
  };

  // 保存设置到 localStorage
  useEffect(() => {
    localStorage.setItem('player_showPageButtons', String(showPageButtons));
  }, [showPageButtons]);

  useEffect(() => {
    localStorage.setItem('player_showCatalog', String(showCatalog));
  }, [showCatalog]);

  const CountdownTab = (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>设置倒计时</Text>
          <div style={{ marginTop: '12px' }}>
            <Space size="middle">
              <div>
                <Text style={{ fontSize: '12px' }}>分钟</Text>
                <InputNumber
                  min={0}
                  max={59}
                  value={minutes}
                  onChange={(value) => setMinutes(value || 0)}
                  disabled={isCountdownRunning}
                  style={{ width: 70, marginLeft: '8px' }}
                />
              </div>
              <div>
                <Text style={{ fontSize: '12px' }}>秒</Text>
                <InputNumber
                  min={0}
                  max={59}
                  value={seconds}
                  onChange={(value) => setSeconds(value || 0)}
                  disabled={isCountdownRunning}
                  style={{ width: 70, marginLeft: '8px' }}
                />
              </div>
            </Space>
          </div>
        </div>

        <div>
          <Text strong>当前倒计时</Text>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            color: countdownTime > 0 ? '#1890ff' : '#999',
            marginTop: '8px',
          }}>
            {formatTime(countdownTime)}
          </div>
        </div>

        <Space>
          {!isCountdownRunning && !isCountdownPaused && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={onCountdownStart}
              disabled={minutes === 0 && seconds === 0}
            >
              开始
            </Button>
          )}
          {isCountdownRunning && (
            <Button
              icon={<PauseCircleOutlined />}
              onClick={onCountdownPause}
            >
              暂停
            </Button>
          )}
          {isCountdownPaused && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={onCountdownStart}
            >
              继续
            </Button>
          )}
          {(isCountdownRunning || isCountdownPaused) && (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={onCountdownStop}
            >
              停止
            </Button>
          )}
        </Space>
      </Space>
    </div>
  );

  return (
    <Drawer
      title="播放器设置"
      placement="right"
      onClose={onClose}
      open={visible}
      width={360}
      styles={{
        body: { paddingTop: '12px' }
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 显示设置 */}
        <div>
          <Text strong style={{ fontSize: '14px' }}>显示设置</Text>
          <Divider style={{ margin: '12px 0' }} />
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>显示翻页按钮</Text>
              <Switch
                checked={showPageButtons}
                onChange={onShowPageButtonsChange}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>显示目录</Text>
              <Switch
                checked={showCatalog}
                onChange={onShowCatalogChange}
              />
            </div>
          </div>
        </div>

        {/* 工具 */}
        <div>
          <Text strong style={{ fontSize: '14px' }}>工具</Text>
          <Divider style={{ margin: '12px 0' }} />
          
          <Tabs
            items={[
              {
                key: 'countdown',
                label: (
                  <Space size={4}>
                    <ClockCircleOutlined />
                    <span>倒计时</span>
                  </Space>
                ),
                children: CountdownTab,
              },
              {
                key: 'rollcall',
                label: (
                  <Space size={4}>
                    <UserOutlined />
                    <span>点名</span>
                  </Space>
                ),
                children: <SimplifiedRollCall />,
              },
            ]}
            size="small"
          />
        </div>

        {/* 返回首页 */}
        <div style={{ marginTop: '24px' }}>
          <Divider style={{ margin: '12px 0' }} />
          <Button
            block
            icon={<HomeOutlined />}
            onClick={handleReturnHome}
          >
            返回首页
          </Button>
        </div>
      </Space>
    </Drawer>
  );
};

export default PlayerDrawer;

