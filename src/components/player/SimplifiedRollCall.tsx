import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Space, Typography, Divider } from 'antd';
import { PlayCircleOutlined, StopOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text, Title } = Typography;

const SimplifiedRollCall: React.FC = () => {
  const [nameList, setNameList] = useState('');
  const [names, setNames] = useState<string[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [currentName, setCurrentName] = useState('');
  const [result, setResult] = useState('');
  const intervalRef = useRef<number | null>(null);

  const handleNameListChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNameList(value);
    // 按逗号、分号、换行、空格分割
    const splitNames = value
      .split(/[,，;；\n\s]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
    setNames(splitNames);
  };

  const startRollCall = () => {
    if (names.length === 0) return;
    
    setIsRolling(true);
    setResult('');
    
    let counter = 0;
    intervalRef.current = window.setInterval(() => {
      const randomIndex = Math.floor(Math.random() * names.length);
      setCurrentName(names[randomIndex]);
      counter++;
      
      // 滚动2秒后停止
      if (counter >= 20) {
        stopRollCall();
      }
    }, 100);
  };

  const stopRollCall = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRolling(false);
    if (currentName) {
      setResult(currentName);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text strong>学生名单</Text>
          <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
            用逗号、空格或换行分隔
          </Text>
        </div>

        <TextArea
          rows={4}
          placeholder="例如：张三 李四 王五"
          value={nameList}
          onChange={handleNameListChange}
          disabled={isRolling}
        />

        <Text type="secondary" style={{ fontSize: '12px' }}>
          已识别 {names.length} 个名字
        </Text>

        <Space>
          {!isRolling ? (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={startRollCall}
              disabled={names.length === 0}
            >
              开始点名
            </Button>
          ) : (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={stopRollCall}
            >
              停止
            </Button>
          )}
        </Space>

        {(isRolling || result) && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <div
              style={{
                padding: '20px',
                backgroundColor: isRolling ? '#f0f5ff' : '#f6ffed',
                borderRadius: '8px',
                textAlign: 'center',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
              }}
            >
              {isRolling ? (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                    正在点名...
                  </Text>
                  <Title
                    level={2}
                    style={{
                      margin: 0,
                      color: '#1890ff',
                      animation: 'pulse 0.3s ease-in-out infinite',
                    }}
                  >
                    {currentName}
                  </Title>
                </div>
              ) : (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                    点名结果
                  </Text>
                  <Title
                    level={2}
                    style={{
                      margin: 0,
                      color: '#52c41a',
                    }}
                  >
                    🎯 {result}
                  </Title>
                </div>
              )}
            </div>
          </>
        )}
      </Space>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default SimplifiedRollCall;

