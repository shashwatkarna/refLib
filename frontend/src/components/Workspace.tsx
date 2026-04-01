import React, { useState, useRef } from 'react';
import { Card, Button, Typography, Layout, Space, message, Divider, Badge } from 'antd';
import { DownloadOutlined, LeftOutlined, BarChartOutlined, BulbOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from 'axios';
import SelectionMenu from './SelectionMenu';

const { Content, Header, Sider } = Layout;
const { Title, Text } = Typography;

interface WorkspaceProps {
  initialHtml: string;
  filePath: string;
  filename: string;
  onBack: () => void;
}

const Workspace: React.FC<WorkspaceProps> = ({ initialHtml, filePath, filename, onBack }) => {
  const [html, setHtml] = useState(initialHtml);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect; range?: Range } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.toString().trim().length > 3) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({ text: sel.toString().trim(), rect, range });
    } else {
      setSelection(null);
    }
  };

  const applyEdit = async (instruction: string) => {
    if (!selection) return;
    setLoading(true);
    
    // Create shimmer placeholder in the DOM
    const span = document.createElement("span");
    span.className = "ai-shimmer-active";
    span.textContent = selection.text;
    selection.range?.deleteContents();
    selection.range?.insertNode(span);
    
    setSelection(null);
    
    try {
      const formData = new FormData();
      formData.append('file_path', filePath);
      formData.append('original_text', selection.text);
      formData.append('instruction', instruction);

      const response = await axios.post('http://localhost:8000/api/refine', formData);
      
      if (response.data.success) {
        setHtml(response.data.html);
        message.success('Lab Refinement Complete!');
      }
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to refine document');
      setHtml(initialHtml); // Rollback on error
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/download?file_path=${filePath}&filename=${filename}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('Final document downloaded!');
    } catch (error) {
      message.error('Failed to download document');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#000', 
        backgroundColor: '#050505',
        backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Header style={{ 
        background: '#111', 
        borderBottom: '4px solid #333', 
        height: '70px', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <Space size="large">
          <Button 
            ghost
            icon={<LeftOutlined />} 
            onClick={onBack} 
            style={{ border: '2px solid #555', color: '#fff', fontWeight: 800 }}
          >
            EXIT LAB
          </Button>
          <div style={{ lineHeight: 1 }}>
            <Title level={4} style={{ margin: 0, fontWeight: 900, color: '#fff' }}>refLib AI LAB v3.0</Title>
            <Text style={{ fontSize: '0.7rem', color: '#888', fontWeight: 700 }}>SESSION ACTIVE: {filename}</Text>
          </div>
        </Space>
        
        <Space size="middle">
          <Badge status="processing" color="#52c41a" text={<span style={{color: '#aaa', fontSize: '0.8rem'}}>Sync: Active</span>} />
          <Button 
            type="primary" 
            size="large" 
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            style={{ 
              height: '45px', 
              padding: '0 25px', 
              fontSize: '0.9rem', 
              fontWeight: 900, 
              background: '#ffde03',
              color: '#000',
              border: '3px solid #000', 
              boxShadow: '4px 4px 0 #52c41a' 
            }}
          >
            FINAL EXPORT
          </Button>
        </Space>
      </Header>

      <Layout style={{ flex: 1, background: 'transparent' }}>
        <Content style={{ 
          padding: '40px',
          display: 'flex',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <div style={{ 
            maxWidth: '900px', 
            width: '100%', 
            height: '100%', 
            position: 'relative' 
          }}>
            <div 
              ref={scrollRef}
              onMouseUp={handleMouseUp}
              className="lab-paper-container"
              style={{
                height: '100%',
                background: '#fff', // White paper contrast
                border: '4px solid #333',
                borderRadius: '8px',
                padding: '80px 100px',
                overflowY: 'auto',
                boxShadow: '0 0 50px rgba(82, 196, 26, 0.15)',
                position: 'relative'
              }}
            >
              <div 
                className="academic-preview-rich"
                dangerouslySetInnerHTML={{ __html: html }} 
                style={{
                  fontFamily: 'Inter, "Times New Roman", serif',
                  lineHeight: 1.8,
                  color: '#222',
                  textAlign: 'justify',
                }}
              />
            </div>

            <SelectionMenu 
              selection={selection} 
              onApply={applyEdit} 
              loading={loading}
            />
          </div>
        </Content>

        <Sider width={300} style={{ background: '#111', padding: '24px', borderLeft: '4px solid #333' }}>
          <div className="lab-hud">
            <Title level={5} style={{ color: '#fff', marginBottom: '20px' }}>
              <BarChartOutlined style={{ marginRight: '10px' }} /> LAB METRICS
            </Title>
            
            <Card size="small" style={{ background: '#1a1a1a', border: '2px solid #333', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#888' }}>Words</Text>
                <Text style={{ color: '#fff', fontWeight: 900 }}>{html.split(' ').length}</Text>
              </div>
              <Divider style={{ margin: '8px 0', borderColor: '#333' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#888' }}>Tone</Text>
                <Text style={{ color: '#52c41a', fontWeight: 900 }}>ACADEMIC</Text>
              </div>
            </Card>

            <Title level={5} style={{ color: '#fff', marginBottom: '20px', marginTop: '40px' }}>
              <BulbOutlined style={{ marginRight: '10px' }} /> AI SUGGESTIONS
            </Title>
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ color: '#aaa', fontSize: '0.8rem', padding: '12px', border: '2px dashed #444', borderRadius: '8px' }}>
                💡 <Text style={{ color: '#aaa' }}>Consider using <b>active voice</b> in your methodology section.</Text>
              </div>
              <div style={{ color: '#aaa', fontSize: '0.8rem', padding: '12px', border: '2px dashed #444', borderRadius: '8px' }}>
                💡 <Text style={{ color: '#aaa' }}>Highlight any jargon for a <b>smart explanation</b>.</Text>
              </div>
            </Space>

            <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
              <Button ghost block icon={<SafetyCertificateOutlined />} style={{ color: '#888', border: '2px solid #333', fontSize: '0.7rem' }}>
                ENCRYPTION: AES-256
              </Button>
            </div>
          </div>
        </Sider>
      </Layout>
      
      <style>{`
        .lab-paper-container::-webkit-scrollbar { width: 8px; }
        .lab-paper-container::-webkit-scrollbar-track { background: #f0f0f0; }
        .lab-paper-container::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        
        .academic-preview-rich h1 { font-weight: 900; color: #000; font-size: 2.2rem; text-align: center; margin-bottom: 2.5rem; border-bottom: 3px solid #111; padding-bottom: 1rem; }
        .academic-preview-rich p { margin-bottom: 1.5rem; }
        .academic-preview-rich blockquote { border-left: 5px solid #ffde03; padding-left: 20px; font-style: italic; color: #555; }
        
        .ai-shimmer-active {
          background: linear-gradient(90deg, #52c41a 0%, #ffde03 50%, #52c41a 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          font-weight: 900;
          display: inline;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .academic-preview-rich ::selection {
          background: #52c41a;
          color: #fff;
        }
      `}</style>
    </motion.div>
  );
};

export default Workspace;
