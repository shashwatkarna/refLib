import React, { useState, useEffect } from 'react';
import { Card, Upload, Form, Select, Button, message, Typography } from 'antd';
import { InboxOutlined, SettingOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { motion } from 'framer-motion';
import * as mammoth from 'mammoth';

const { Dragger } = Upload;
const { Title } = Typography;

const UploadPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

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
      formData.append('citation_style', values.citationStyle);
      formData.append('columns', values.columns.toString());

      const response = await axios.post('http://localhost:8000/api/format', formData, {
        responseType: 'blob',
      });

      const disposition = response.headers['content-disposition'];
      let filename = 'formatted_document.docx';
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename="([^"]*)"/.exec(disposition) || /filename=([^;]*)/.exec(disposition);
        if (matches != null && matches[1]) filename = matches[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('Document formatted and downloaded successfully!');
      
    } catch (error: any) {
      const errMessage = error.response?.data?.detail;
      message.error(errMessage || 'Failed to process document. Make sure the backend server SDK is running.');
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
      <Card className="custom-card" bordered={false}>
        <Title level={4} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined /> Configure & Format
        </Title>
        
        <Form form={form} layout="vertical" initialValues={{ citationStyle: 'APA', columns: 2 }}>
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

          <Form.Item name="citationStyle" label="Citation & Layout Target">
            <Select>
              <Select.Option value="APA">APA Standard</Select.Option>
              <Select.Option value="MLA">MLA Standard</Select.Option>
              <Select.Option value="IEEE">IEEE Conference</Select.Option>
              <Select.Option value="ACM">ACM Proceedings</Select.Option>
              <Select.Option value="Springer">Springer Format</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="columns" label="Number of Columns Layout">
            <Select>
              <Select.Option value={1}>Single Column</Select.Option>
              <Select.Option value={2}>Two Columns</Select.Option>
            </Select>
          </Form.Item>

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
    </motion.div>
  );
};

export default UploadPanel;
