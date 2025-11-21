import React from 'react';
import { Button } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';

interface CatalogFloatingButtonProps {
  onClick: () => void;
  visible: boolean;
}

const CatalogFloatingButton: React.FC<CatalogFloatingButtonProps> = ({ onClick, visible }) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        top: '20px',
        zIndex: 1000,
      }}
    >
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<UnorderedListOutlined />}
        onClick={onClick}
        style={{
          width: '48px',
          height: '48px',
          backgroundColor: 'rgba(82, 196, 26, 0.9)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      />
    </div>
  );
};

export default CatalogFloatingButton;

