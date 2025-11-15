import React, { useState } from 'react';
import { Card, Tabs, Upload, Button, message, Input, Space, Typography } from 'antd';
import { UploadOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCourseware } from '../context/CoursewareContext';
import { parseHTMLCourseware } from '../utils/coursewareParser';
import PromptGenerator from '../components/PromptGenerator';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setCourseware } = useCourseware();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleUpload = async (file: File) => {
    try {
      const text = await file.text();
      const coursewareData = parseHTMLCourseware(text, file.name);
      setCourseware(coursewareData);
      message.success('课件导入成功！');
      navigate('/catalog');
      return false; // 阻止默认上传行为
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
    maxCount: 1,
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>通用课件播放框架</Title>
      <Tabs
        defaultActiveKey="import"
        items={[
          {
            key: 'import',
            label: '导入课件',
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
                    <Button icon={<UploadOutlined />}>选择HTML文件</Button>
                  </Upload>
                  <div>
                    <Title level={5}>课件要求：</Title>
                    <ul>
                      <li>页面宽高比为16:9</li>
                      <li>使用KaTeX或MathJax处理数学公式</li>
                      <li>建议使用section标签或特定class标记章节</li>
                      <li>支持目录结构，便于导航</li>
                    </ul>
                  </div>
                </Space>
              </Card>
            ),
          },
          {
            key: 'prompt',
            label: '生成提示词',
            children: <PromptGenerator />,
          },
        ]}
      />
    </div>
  );
};

export default HomePage;

