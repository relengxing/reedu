import React, { useState } from 'react';
import { Card, Tabs, Upload, Button, message, Space, Typography } from 'antd';
import { UploadOutlined, DragOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCourseware } from '../context/CoursewareContext';
import { parseHTMLCourseware } from '../utils/coursewareParser';
import PromptGenerator from '../components/PromptGenerator';
import { bundledCoursewaresCount } from '../coursewares';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { addCourseware, coursewares, setCurrentCoursewareIndex, reorderCoursewares } = useCourseware();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleUpload = async (file: File) => {
    try {
      const text = await file.text();
      const coursewareData = parseHTMLCourseware(text, file.name);
      addCourseware(coursewareData);
      message.success(`课件"${coursewareData.title}"导入成功！`);
      // 不自动跳转，让用户继续选择其他课件
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
    multiple: true, // 支持多选
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
                    {bundledCoursewaresCount > 0 && (
                      <Paragraph type="success" style={{ marginTop: '8px' }}>
                        ✓ 已检测到 {bundledCoursewaresCount} 个编译期导入的课件，已自动加载
                      </Paragraph>
                    )}
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
                              transition: 'all 0.2s',
                            }}
                            draggable
                            onDragStart={(e) => {
                              setDraggedIndex(index);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              setDragOverIndex(index);
                            }}
                            onDragLeave={() => {
                              setDragOverIndex(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedIndex !== null && draggedIndex !== index) {
                                reorderCoursewares(draggedIndex, index);
                              }
                              setDraggedIndex(null);
                              setDragOverIndex(null);
                            }}
                            onDragEnd={() => {
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
                            </Space>
                          </Card>
                        ))}
                      </Space>
                      <Paragraph type="secondary" style={{ marginTop: '8px', fontSize: '12px' }}>
                        提示：拖拽课件卡片可以调整顺序
                      </Paragraph>
                    </div>
                  )}
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

