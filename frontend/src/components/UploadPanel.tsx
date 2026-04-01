import React, { useState, useEffect } from 'react';
import { Card, Upload, Form, Select, Button, message, Typography, Collapse, InputNumber, ColorPicker, Row, Col, Popover } from 'antd';
import { InboxOutlined, SettingOutlined, EyeOutlined, QuestionCircleOutlined, SlidersOutlined } from '@ant-design/icons';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import * as mammoth from 'mammoth';
import Workspace from './Workspace';

const { Dragger } = Upload;
const { Title, Text } = Typography;

const layoutHelpContent = (
  <div style={{ width: '480px', padding: '5px' }}>
    <Title level={5} style={{ marginTop: 0, marginBottom: '15px', borderBottom: '2px solid #111', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <QuestionCircleOutlined style={{ color: '#1677ff' }} /> Choosing Your Layout
    </Title>
    <Row gutter={[16, 16]}>
      {[
        { name: 'APA', use: 'Social Sciences', desc: 'Psychology, Education. Clean single column formatting.', color: '#1677ff' },
        { name: 'MLA', use: 'Humanities', desc: 'Literature & Arts. Professional author-page flow.', color: '#1890ff' },
        { name: 'IEEE', use: 'Engineering', desc: 'Tech & IT. Standard 2-column, numbered references.', color: '#eb2f96' },
        { name: 'ACM', use: 'Computing', desc: 'CS Conferences. Compact 2-column proceedings style.', color: '#722ed1' },
      ].map(item => (
        <Col span={12} key={item.name}>
          <div style={{ border: '2px solid #111', borderRadius: '10px', padding: '10px', background: '#fff', height: '100%', boxShadow: '3px 3px 0 #111' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ fontSize: '0.95rem', color: item.color }}>{item.name}</strong>
              <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: '#f5f5f5', borderRadius: '4px', fontWeight: '800', border: '1px solid #ddd' }}>{item.use}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#555', lineHeight: '1.3' }}>{item.desc}</p>
          </div>
        </Col>
      ))}
      <Col span={24}>
        <div style={{ border: '2px solid #111', borderRadius: '10px', padding: '10px', background: '#f6ffed', boxShadow: '3px 3px 0 #111' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.95rem', color: '#52c41a' }}>Springer (Journals)</strong>
            <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: '#fff', borderRadius: '4px', fontWeight: '800', border: '1px solid #52c41a' }}>Multidisciplinary</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#555', lineHeight: '1.3' }}>General Science, Nature, and High-impact research journals. Professional single-column polished typography.</p>
        </div>
      </Col>
    </Row>
  </div>
);

const UploadPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Workspace integration state
  const [inWorkspace, setInWorkspace] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<{ html: string; filePath: string; filename: string } | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewHtml('');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      return;
    }

    if (file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else if (file.name.endsWith('.docx') || file.type.includes('wordprocessingml')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) return;
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setPreviewHtml(result.value);
        } catch (error) {
          setPreviewHtml('<p style="color:red; font-weight:bold;">Error generating preview. File might be corrupted.</p>');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file]);

  const handleUpload = async () => {
    if (!file) {
      message.error('Please upload a document to format');
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('citation_style', values.citationStyle || 'APA');
      formData.append('columns', (values.columns || 2).toString());
      formData.append('heading_font', values.headingFont || 'Times New Roman');
      formData.append('heading_size', (values.headingSize || 20).toString());
      
      const hColor = values.headingColor;
      formData.append('heading_color', hColor ? (typeof hColor === 'string' ? hColor : hColor.toHexString()) : '#000000');
      
      formData.append('content_font', values.contentFont || 'Times New Roman');
      formData.append('content_size', (values.contentSize || 10).toString());
      
      const cColor = values.contentColor;
      formData.append('content_color', cColor ? (typeof cColor === 'string' ? cColor : cColor.toHexString()) : '#000000');

      const response = await axios.post('http://localhost:8000/api/format', formData);

      if (response.data.success) {
        setWorkspaceData({
          html: response.data.html,
          filePath: response.data.file_path,
          filename: response.data.filename
        });
        setInWorkspace(true);
        message.success('Document formatted! Entering AI Review Workspace...');
      }

    } catch (error: any) {
      const errMessage = error.response?.data?.detail;
      message.error(errMessage || 'Failed to process document. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    beforeUpload: (file: File) => {
      const isOk = file.type === 'application/pdf' || file.name.endsWith('.docx');
      if (!isOk) {
        message.error('You can only upload .docx or .pdf files!');
      } else {
        setFile(file);
      }
      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setFile(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {inWorkspace && workspaceData ? (
          <Workspace
            key="workspace"
            initialHtml={workspaceData.html}
            filePath={workspaceData.filePath}
            filename={workspaceData.filename}
            onBack={() => setInWorkspace(false)}
          />
        ) : (
          <Card key="upload-panel" className="custom-card" bordered={false}>
            {/* Same as before... content below */}
            <Title level={4} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SettingOutlined /> Configure & Format
            </Title>

            <Form form={form} layout="vertical" initialValues={{ citationStyle: 'APA', columns: 2, headingFont: 'Times New Roman', headingSize: 20, headingColor: '#000000', contentFont: 'Times New Roman', contentSize: 10, contentColor: '#000000' }}>
              {!file ? (
                <Dragger {...uploadProps} showUploadList={false} style={{ marginBottom: '30px', background: '#fafafa' }}>
                  <div style={{ padding: '40px 0' }}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ color: '#1677ff' }} />
                    </p>
                    <p className="ant-upload-text" style={{ fontWeight: 'bold', color: '#333' }}>Click or drag file into this dashed area</p>
                    <p className="ant-upload-hint" style={{ color: '#666' }}>Support for a single .docx or .pdf upload.</p>
                  </div>
                </Dragger>
              ) : (
                <div style={{
                  marginBottom: '30px',
                  border: '3px dashed #333',
                  borderRadius: '12px',
                  background: '#fff',
                  height: '350px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #333', background: '#ffde03', flexShrink: 0 }}>
                    <strong style={{ color: '#111', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <EyeOutlined /> PREVIEW: {file.name}
                    </strong>
                    <Button size="small" onClick={() => setFile(null)} style={{ marginLeft: '10px', border: '2px solid #333', fontWeight: 800 }}>Change File</Button>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {previewUrl ? (
                      <iframe src={previewUrl} style={{ width: '100%', height: '100%', minHeight: '300px', border: 'none', display: 'block' }} title="PDF Preview" />
                    ) : previewHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} style={{ fontFamily: 'Georgia, serif', lineHeight: 1.6, textAlign: 'left', color: '#333' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#999', marginTop: '100px', fontWeight: 'bold' }}>Parsing Document Data...</div>
                    )}
                  </div>
                </div>
              )}

              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Text strong style={{ fontSize: '0.85rem' }}>Citation & Layout Target</Text>
                    <Popover
                      content={layoutHelpContent}
                      trigger="hover"
                      placement="rightTop"
                      overlayInnerStyle={{ border: '3px solid #111', borderRadius: '16px', boxShadow: '6px 6px 0 #111', padding: '15px' }}
                    >
                      <span style={{ fontSize: '0.7rem', color: '#1677ff', cursor: 'help', textDecoration: 'underline dotted', fontWeight: 800 }}>Don't know which?</span>
                    </Popover>
                  </div>
                  <Form.Item name="citationStyle" noStyle>
                    <Select style={{ width: '100%' }}>
                      <Select.Option value="APA">APA Standard</Select.Option>
                      <Select.Option value="MLA">MLA Standard</Select.Option>
                      <Select.Option value="IEEE">IEEE Conference</Select.Option>
                      <Select.Option value="ACM">ACM Proceedings</Select.Option>
                      <Select.Option value="Springer">Springer Format</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="columns" label="Number of Columns Layout">
                    <Select>
                      <Select.Option value={1}>Single Column</Select.Option>
                      <Select.Option value={2}>Two Columns</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Collapse
                style={{ marginBottom: '20px', border: '2px solid #333', borderRadius: '12px', background: '#fafafa' }}
                items={[{
                  key: 'custom-layout',
                  label: <strong style={{ color: '#111' }}><SlidersOutlined style={{ marginRight: '8px', color: '#1677ff' }} />Custom Layout</strong>,
                  children: (
                    <div>
                      <Title level={5} style={{ marginTop: 0 }}>Heading Styling</Title>
                      <Row gutter={16}>
                        <Col span={10}>
                          <Form.Item name="headingFont" label="Font Family">
                            <Select>
                              <Select.Option value="Times New Roman">Times New Roman</Select.Option>
                              <Select.Option value="Arial">Arial</Select.Option>
                              <Select.Option value="Calibri">Calibri</Select.Option>
                              <Select.Option value="Garamond">Garamond</Select.Option>
                              <Select.Option value="Verdana">Verdana</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item name="headingSize" label="Size (pt)">
                            <InputNumber min={8} max={72} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item name="headingColor" label="Color">
                            <ColorPicker showText style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Title level={5} style={{ borderTop: '1px solid #ddd', paddingTop: '16px' }}>Body Content Styling</Title>
                      <Row gutter={16}>
                        <Col span={10}>
                          <Form.Item name="contentFont" label="Font Family">
                            <Select>
                              <Select.Option value="Times New Roman">Times New Roman</Select.Option>
                              <Select.Option value="Arial">Arial</Select.Option>
                              <Select.Option value="Calibri">Calibri</Select.Option>
                              <Select.Option value="Garamond">Garamond</Select.Option>
                              <Select.Option value="Verdana">Verdana</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item name="contentSize" label="Size (pt)">
                            <InputNumber min={6} max={36} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item name="contentColor" label="Color">
                            <ColorPicker showText style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  )
                }]}
              />

              <Button
                type="primary"
                size="large"
                block
                onClick={handleUpload}
                loading={loading}
                disabled={!file}
                style={{ marginTop: '10px', height: '50px', fontSize: '1.1rem' }}
              >
                {loading ? 'Formatting via refLib AI...' : 'Format Document Now'}
              </Button>
            </Form>
          </Card>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UploadPanel;
