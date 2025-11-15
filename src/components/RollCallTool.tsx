import React, { useState } from 'react';
import { Card, Input, Button, Space, Typography } from 'antd';
import { UserOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface RollCallToolProps {
  onStart: (names: string[]) => void;
}

const RollCallTool: React.FC<RollCallToolProps> = ({ onStart }) => {
  const [nameList, setNameList] = useState('');
  const [names, setNames] = useState<string[]>([]);

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

  const handleStart = () => {
    if (names.length > 0) {
      onStart(names);
    }
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>点名工具</Title>
          <Text type="secondary">输入学生名单，用逗号、分号、换行或空格分隔</Text>
        </div>

        <div>
          <TextArea
            rows={6}
            placeholder="例如：张三,李四,王五&#10;或者：张三 李四 王五&#10;或者：张三；李四；王五"
            value={nameList}
            onChange={handleNameListChange}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <Text>已识别 {names.length} 个名字</Text>
          {names.length > 0 && (
            <div style={{ marginTop: '10px', maxHeight: '100px', overflow: 'auto' }}>
              {names.map((name, index) => (
                <span key={index} style={{ marginRight: '8px', display: 'inline-block' }}>
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleStart}
          disabled={names.length === 0}
          block
        >
          开始点名
        </Button>
      </Space>
    </Card>
  );
};

export default RollCallTool;

