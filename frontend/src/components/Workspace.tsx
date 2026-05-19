import React, { useState, useRef } from 'react';
import { Card, Button, Typography, Layout, Space, message, Divider, Badge, Popover, Input, Select } from 'antd';
import { DownloadOutlined, LeftOutlined, BarChartOutlined, BulbOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from 'axios';
import SelectionMenu from './SelectionMenu';
import { API_BASE_URL } from '../config';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

interface WorkspaceProps {
  initialHtml: string;
  filePath: string;
  filename: string;
  options?: any;
  onBack: () => void;
}

const Workspace: React.FC<WorkspaceProps> = ({ initialHtml, filePath, filename, options, onBack }) => {
  const [html, setHtml] = useState(initialHtml);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect; range?: Range } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Bibliography & Citation Auto-Formatter states
  const [rawCitation, setRawCitation] = useState('');
  const [citationStyle, setCitationStyle] = useState('APA');
  const [formattedResult, setFormattedResult] = useState('');
  const [formattingCitation, setFormattingCitation] = useState(false);

  const supportContent = (
    <div style={{ textAlign: 'center', padding: '10px' }}>
      <h4 style={{ margin: '0 0 10px 0', fontWeight: '900', color: '#111', fontSize: '1.05rem' }}>Scan to Support</h4>
      <div style={{ width: '150px', height: '150px', background: '#fff', border: '3px solid #111', borderRadius: '12px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '4px 4px 0 #111', overflow: 'hidden' }}>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=upi://pay?pa=9971374395@apl&pn=Shashwat&cu=INR" alt="UPI QR Code" style={{ width: '130px', height: '130px' }} />
      </div>
      <p style={{ marginTop: '16px', marginBottom: '0', fontSize: '0.9rem', color: '#444', fontWeight: 'bold' }}>UPI: 9971374395@apl</p>
    </div>
  );

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

      const response = await axios.post(`${API_BASE_URL}/api/refine`, formData);
      
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
      const response = await axios.get(`${API_BASE_URL}/api/download?file_path=${filePath}&filename=${filename}`, {
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

  const handleFormatCitation = async () => {
    if (!rawCitation.trim()) {
      message.warning('Please paste a raw citation first!');
      return;
    }
    setFormattingCitation(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/citations/format`, {
        citations: [rawCitation],
        style: citationStyle
      });
      if (response.data.success && response.data.results.length > 0) {
        setFormattedResult(response.data.results[0].formatted);
        message.success('Citation formatted successfully!');
      }
    } catch (error) {
      message.error('Failed to format citation');
    } finally {
      setFormattingCitation(false);
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
      <div style={{ 
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
            className="lab-exit-btn"
            icon={<LeftOutlined />} 
            onClick={onBack} 
          >
            EXIT LAB
          </Button>
          <div style={{ lineHeight: 1 }}>
            <h4 className="lab-title" style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>refLib AI LAB v3.0</h4>
            <Text style={{ fontSize: '0.7rem', color: '#888', fontWeight: 700 }}>SESSION ACTIVE: {filename}</Text>
          </div>
        </Space>
        
        <Space size="middle">
          <Badge status="processing" color="#52c41a" text={<span style={{color: '#aaa', fontSize: '0.8rem'}}>Sync: Active</span>} />
          <Popover content={supportContent} title={null} trigger="click" placement="bottomRight" overlayInnerStyle={{ border: '3px solid #111', borderRadius: '16px', boxShadow: '6px 6px 0 #111', padding: '10px' }}>
            <Button 
              className="lab-support-btn"
              size="large"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
              Support
            </Button>
          </Popover>
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
      </div>

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
                  fontFamily: options?.content_font ? `"${options.content_font}", Inter, serif` : 'Inter, "Times New Roman", serif',
                  fontSize: options?.content_size ? `${options.content_size}pt` : '10pt',
                  color: options?.content_color || '#222',
                  lineHeight: 1.8,
                  textAlign: 'justify',
                  columnCount: options?.columns || 1,
                  columnGap: '40px',
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

            <Title level={5} style={{ color: '#fff', marginBottom: '15px', marginTop: '25px' }}>
              📚 BIBLIOGRAPHY HELPER
            </Title>
            <Card size="small" className="citation-formatter-card" style={{ background: '#1a1a1a', border: '2px solid #333', marginBottom: '16px' }}>
              <Input.TextArea 
                placeholder="Paste raw, messy citation here..."
                rows={2}
                value={rawCitation}
                onChange={(e) => setRawCitation(e.target.value)}
                style={{ background: '#252525', color: '#fff', border: '1px solid #444', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <Select
                  value={citationStyle}
                  onChange={(val) => setCitationStyle(val)}
                  style={{ flex: 1 }}
                  popupClassName="dark-select-dropdown"
                  options={[
                    { value: 'APA', label: 'APA 7th' },
                    { value: 'IEEE', label: 'IEEE' },
                    { value: 'MLA', label: 'MLA 9th' },
                    { value: 'HARVARD', label: 'Harvard' },
                    { value: 'CHICAGO', label: 'Chicago' },
                  ]}
                />
                <Button 
                  type="primary" 
                  onClick={handleFormatCitation} 
                  loading={formattingCitation}
                  style={{ background: '#ffde03', color: '#000', border: 'none', fontWeight: 'bold' }}
                >
                  Format
                </Button>
              </div>
              {formattedResult && (
                <div style={{ background: '#111', padding: '8px', border: '1px solid #444', borderRadius: '4px', marginTop: '8px' }}>
                  <Text copyable style={{ color: '#ffde03', fontSize: '0.75rem', display: 'block', wordBreak: 'break-all' }}>
                    {formattedResult}
                  </Text>
                </div>
              )}
            </Card>

            <Title level={5} style={{ color: '#fff', marginBottom: '20px', marginTop: '30px' }}>
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
        
        .academic-preview-rich h1, .academic-preview-rich h2, .academic-preview-rich h3, .academic-preview-rich h4 { 
          font-family: "${options?.heading_font || 'Inter'}";
          color: ${options?.heading_color || '#000'};
          text-align: center; 
          margin-bottom: 2.5rem; 
        }
        .academic-preview-rich p { margin-bottom: 1.5rem; text-align: justify; }
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

        /* Custom overrides to fix visibility in Lab mode */
        .lab-exit-btn {
          border: 2px solid #ffde03 !important;
          color: #ffde03 !important;
          background: transparent !important;
          box-shadow: none !important;
          transform: none !important;
        }
        .lab-exit-btn:hover {
          border-color: #ffffff !important;
          color: #ffffff !important;
          background: transparent !important;
          box-shadow: none !important;
          transform: none !important;
        }
         .lab-title {
          color: #ffde03 !important;
        }
        .lab-support-btn {
          height: 45px !important;
          background: #ffdd00 !important;
          color: #111 !important;
          border: 3px solid #000 !important;
          box-shadow: 4px 4px 0 #000 !important;
          transform: none !important;
          font-weight: 900 !important;
          font-size: 0.9rem !important;
          padding: 0 20px !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .lab-support-btn:hover {
          background: #ffe53d !important;
          box-shadow: 6px 6px 0 #000 !important;
          transform: translate(-2px, -2px) !important;
        }
        .lab-support-btn:active {
          box-shadow: 0px 0px 0 #000 !important;
          transform: translate(4px, 4px) !important;
        }

        /* Hide floating elements on Home Page when Lab is open */
        #utility-container {
          display: none !important;
        }
        #support-btn {
          display: none !important;
        }

        /* Dark select overrides */
        .dark-select-dropdown {
          background-color: #1a1a1a !important;
          border: 2px solid #333 !important;
        }
        .dark-select-dropdown .ant-select-item {
          color: #ccc !important;
        }
        .dark-select-dropdown .ant-select-item-option-selected {
          background-color: #333 !important;
          color: #ffde03 !important;
        }
        .dark-select-dropdown .ant-select-item-option-active {
          background-color: #222 !important;
        }
        .citation-formatter-card .ant-select-selector {
          background-color: #252525 !important;
          color: #fff !important;
          border: 1px solid #444 !important;
        }
      `}</style>
    </motion.div>
  );
};

export default Workspace;
