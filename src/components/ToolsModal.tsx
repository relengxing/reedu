import React, { useState, useEffect } from 'react';
import { Modal, InputNumber, Button, Space, Typography, Card, Tabs } from 'antd';
import { ClockCircleOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined, UserOutlined } from '@ant-design/icons';
import RollCallTool from './RollCallTool';

const { Title, Text } = Typography;

interface CountdownTimerProps {
  onTimeChange: (seconds: number) => void;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  isRunning: boolean;
  isPaused: boolean;
  currentTime: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  onTimeChange,
  onStart,
  onPause,
  onStop,
  isRunning,
  isPaused,
  currentTime,
}) => {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const totalSeconds = minutes * 60 + seconds;
    onTimeChange(totalSeconds);
  }, [minutes, seconds, onTimeChange]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>倒计时设置</Title>
          <Space size="middle">
            <div>
              <Text>分钟：</Text>
              <InputNumber
                min={0}
                max={59}
                value={minutes}
                onChange={(value) => setMinutes(value || 0)}
                disabled={isRunning}
                style={{ width: 80 }}
              />
            </div>
            <div>
              <Text>秒：</Text>
              <InputNumber
                min={0}
                max={59}
                value={seconds}
                onChange={(value) => setSeconds(value || 0)}
                disabled={isRunning}
                style={{ width: 80 }}
              />
            </div>
          </Space>
        </div>

        <div>
          <Text strong>当前倒计时：</Text>
          <Text style={{ fontSize: '24px', marginLeft: '10px' }}>
            {formatTime(currentTime)}
          </Text>
        </div>

        <Space>
          {!isRunning && !isPaused && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={onStart}
              disabled={minutes === 0 && seconds === 0}
            >
              开始
            </Button>
          )}
          {isRunning && (
            <Button
              icon={<PauseCircleOutlined />}
              onClick={onPause}
            >
              暂停
            </Button>
          )}
          {isPaused && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={onStart}
            >
              继续
            </Button>
          )}
          {(isRunning || isPaused) && (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={onStop}
            >
              停止
            </Button>
          )}
        </Space>
      </Space>
    </Card>
  );
};

interface ToolsModalProps {
  visible: boolean;
  onClose: () => void;
  countdownTime: number;
  isCountdownRunning: boolean;
  isCountdownPaused: boolean;
  onCountdownTimeChange: (seconds: number) => void;
  onCountdownStart: () => void;
  onCountdownPause: () => void;
  onCountdownStop: () => void;
  onRollCallStart?: (names: string[]) => void;
}

const ToolsModal: React.FC<ToolsModalProps> = ({
  visible,
  onClose,
  countdownTime,
  isCountdownRunning,
  isCountdownPaused,
  onCountdownTimeChange,
  onCountdownStart,
  onCountdownPause,
  onCountdownStop,
  onRollCallStart,
}) => {
  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined />
          <span>工具</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Tabs
        items={[
          {
            key: 'countdown',
            label: (
              <Space>
                <ClockCircleOutlined />
                <span>倒计时</span>
              </Space>
            ),
            children: (
              <CountdownTimer
                onTimeChange={onCountdownTimeChange}
                onStart={onCountdownStart}
                onPause={onCountdownPause}
                onStop={onCountdownStop}
                isRunning={isCountdownRunning}
                isPaused={isCountdownPaused}
                currentTime={countdownTime}
              />
            ),
          },
          {
            key: 'rollcall',
            label: (
              <Space>
                <UserOutlined />
                <span>点名</span>
              </Space>
            ),
            children: (
              <RollCallTool
                onStart={onRollCallStart || (() => {})}
              />
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default ToolsModal;

