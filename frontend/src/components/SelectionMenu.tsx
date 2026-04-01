import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Typography, Tooltip, Divider } from 'antd';
import { RobotOutlined, SendOutlined, ExperimentOutlined, ScissorOutlined, BookOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { Text } = Typography;

interface SelectionMenuProps {
  selection: { text: string; rect: DOMRect } | null;
  onApply: (instruction: string) => void;
  loading: boolean;
}

const SelectionMenu: React.FC<SelectionMenuProps> = ({ selection, onApply, loading }) => {
  const [instruction, setInstruction] = useState('');
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (selection) {
      setInstruction('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selection]);

  if (!selection) return null;

  const quickActions = [
    { label: 'Formalize', icon: <ExperimentOutlined />, color: '#1677ff', prompt: 'Make this more formal and academic' },
    { label: 'Shorten', icon: <ScissorOutlined />, color: '#722ed1', prompt: 'Shorten this text while keeping key points' },
    { label: 'Explain', icon: <BookOutlined />, color: '#fa8c16', prompt: 'Explain this in simpler terms' },
    { label: 'Grammar', icon: <CheckCircleOutlined />, color: '#52c41a', prompt: 'Fix grammar and punctuation' }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{
          position: 'fixed',
          top: selection.rect.top - 210, // Adjusted for grid height
          left: Math.min(window.innerWidth - 380, Math.max(20, selection.rect.left + selection.rect.width / 2 - 190)),
          zIndex: 1000,
          width: '380px'
        }}
      >
        <Card 
          size="small" 
          className="selection-hud"
          style={{ 
            border: '4px solid #111', 
            borderRadius: '20px', 
            boxShadow: '12px 12px 0 #111',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text strong style={{ fontSize: '0.85rem', color: '#111', letterSpacing: '1px' }}>
              <RobotOutlined style={{ marginRight: '8px' }} /> AI COMMAND CENTER
            </Text>
            <div style={{ padding: '2px 8px', background: '#52c41a', color: '#fff', border: '2px solid #111', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900 }}>
              LAB MODE
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {quickActions.map(action => (
              <Tooltip key={action.label} title={action.prompt}>
                <Button 
                  size="small"
                  icon={action.icon}
                  disabled={loading}
                  onClick={() => onApply(action.prompt)}
                  style={{ 
                    border: '2px solid #111', 
                    borderRadius: '8px', 
                    fontWeight: 800, 
                    fontSize: '0.75rem',
                    boxShadow: '3px 3px 0 #111',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ marginLeft: '4px' }}>{action.label}</span>
                </Button>
              </Tooltip>
            ))}
          </div>

          <Divider style={{ margin: '14px 0', borderTopColor: '#111' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#666' }}>CUSTOM PROMPT</span>
          </Divider>

          <Input.TextArea
            ref={inputRef}
            placeholder="Type custom command..."
            autoSize={{ minRows: 2, maxRows: 4 }}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={loading}
            style={{ 
              marginBottom: '10px', 
              borderRadius: '8px', 
              border: '2px solid #111', 
              background: '#fff',
              fontSize: '0.9rem',
              boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.05)'
            }}
            onPressEnter={(e) => {
              if (e.shiftKey) return;
              e.preventDefault();
              if (instruction.trim()) onApply(instruction);
            }}
          />

          <Button 
            type="primary" 
            block 
            icon={<SendOutlined />}
            loading={loading}
            onClick={() => onApply(instruction)}
            style={{ 
              fontWeight: 900, 
              height: '45px', 
              background: '#000', 
              border: '3px solid #000',
              boxShadow: '4px 4px 0 #52c41a',
              color: '#fff'
            }}
          >
            EXECUTE COMMAND
          </Button>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default SelectionMenu;
