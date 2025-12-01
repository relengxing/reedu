import React, { useState, useEffect } from 'react';
import { Drawer, Switch, Divider, Space, Typography, Button, InputNumber, Tabs, Select } from 'antd';
import { HomeOutlined, ClockCircleOutlined, UserOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import SimplifiedRollCall from './SimplifiedRollCall';

const { Text } = Typography;

// Live2D 模型列表
export const LIVE2D_MODELS = [
  {
    label: 'Haru - 打招呼',
    value: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json',
  },
  {
    label: 'Shizuku - 经典',
    value: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json',
  },
  {
    label: 'Hijiki - 可爱',
    value: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/hijiki/hijiki.model.json',
  },
  {
    label: 'Miku - 初音未来',
    value: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/miku/miku.model.json',
  },
];

interface PlayerDrawerProps {
  visible: boolean;
  onClose: () => void;
  showPageButtons: boolean;
  onShowPageButtonsChange: (show: boolean) => void;
  showCatalog: boolean;
  onShowCatalogChange: (show: boolean) => void;
  showLive2D: boolean;
  onShowLive2DChange: (show: boolean) => void;
  live2DModel: string;
  onLive2DModelChange: (model: string) => void;
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
  showLive2D,
  onShowLive2DChange,
  live2DModel,
  onLive2DModelChange,
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

  // 处理分钟变化
  const handleMinutesChange = (value: number | null) => {
    const newMinutes = value || 0;
    setMinutes(newMinutes);
    if (!isCountdownRunning && !isCountdownPaused) {
      onCountdownTimeChange(newMinutes * 60 + seconds);
    }
  };

  // 处理秒数变化
  const handleSecondsChange = (value: number | null) => {
    const newSeconds = value || 0;
    setSeconds(newSeconds);
    if (!isCountdownRunning && !isCountdownPaused) {
      onCountdownTimeChange(minutes * 60 + newSeconds);
    }
  };

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

  useEffect(() => {
    localStorage.setItem('player_showLive2D', String(showLive2D));
  }, [showLive2D]);

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
                  onChange={handleMinutesChange}
                  disabled={isCountdownRunning || isCountdownPaused}
                  style={{ width: 70, marginLeft: '8px' }}
                />
              </div>
              <div>
                <Text style={{ fontSize: '12px' }}>秒</Text>
                <InputNumber
                  min={0}
                  max={59}
                  value={seconds}
                  onChange={handleSecondsChange}
                  disabled={isCountdownRunning || isCountdownPaused}
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

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>显示目录</Text>
              <Switch
                checked={showCatalog}
                onChange={onShowCatalogChange}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <Text>显示数字人</Text>
              <Switch
                checked={showLive2D}
                onChange={onShowLive2DChange}
              />
            </div>
            {showLive2D && (
              <div style={{ marginTop: '8px' }}>
                <Text style={{ fontSize: '12px', color: '#666' }}>选择模型</Text>
                <Select
                  value={live2DModel}
                  onChange={onLive2DModelChange}
                  style={{ width: '100%', marginTop: '8px' }}
                  options={LIVE2D_MODELS}
                />
                <Text style={{ fontSize: '11px', color: '#999', display: 'block', marginTop: '8px' }}>
                  💡 提示：按住数字人可以拖动位置
                </Text>
              </div>
            )}
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

