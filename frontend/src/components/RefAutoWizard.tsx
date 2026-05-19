import React, { useState } from 'react';
import { Card, Steps, Button, Form, Input, Space, message, Typography, Row, Col, Select } from 'antd';
import { LeftOutlined, RightOutlined, PlusOutlined, DeleteOutlined, RocketOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

const { Title, Text } = Typography;
const { Step } = Steps;

interface RefAutoWizardProps {
  onBack: () => void;
  onSuccess: (data: { html: string; filePath: string; filename: string; options?: any }) => void;
}

const RefAutoWizard: React.FC<RefAutoWizardProps> = ({ onBack, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [authors, setAuthors] = useState<{ id: number; name: string; affiliation: string }[]>([
    { id: 1, name: '', affiliation: '' }
  ]);

  const addAuthor = () => {
    setAuthors([...authors, { id: Date.now(), name: '', affiliation: '' }]);
  };

  const removeAuthor = (id: number) => {
    if (authors.length === 1) {
      message.warning('A research paper must have at least one author!');
      return;
    }
    setAuthors(authors.filter(a => a.id !== id));
  };

  const handleAuthorChange = (id: number, field: 'name' | 'affiliation', value: string) => {
    setAuthors(authors.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const next = async () => {
    try {
      // Validate current step fields
      if (currentStep === 0) {
        await form.validateFields(['title']);
        const emptyAuthors = authors.filter(a => !a.name.trim());
        if (emptyAuthors.length > 0) {
          message.error('Please fill out the name for all authors.');
          return;
        }
      } else if (currentStep === 1) {
        await form.validateFields(['abstract', 'keywords']);
      } else if (currentStep === 2) {
        await form.validateFields(['introduction', 'methodology', 'results', 'conclusion']);
      }
      setCurrentStep(currentStep + 1);
    } catch (err) {
      message.error('Please complete all required fields on this page.');
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        title: values.title,
        authors: authors.map(a => ({ name: a.name, affiliation: a.affiliation })),
        abstract: values.abstract,
        keywords: values.keywords,
        introduction: values.introduction || '',
        methodology: values.methodology || '',
        results: values.results || '',
        conclusion: values.conclusion || '',
        references: (values.references || '').split('\n').filter((line: string) => line.trim()),
        citation_style: values.citationStyle || 'APA',
        columns: parseInt(values.columns || '2', 10),
        heading_font: values.headingFont || 'Times New Roman',
        heading_size: 20,
        heading_color: '#000000',
        content_font: values.contentFont || 'Times New Roman',
        content_size: 10,
        content_color: '#000000'
      };

      const response = await axios.post(`${API_BASE_URL}/api/refauto/generate`, payload);

      if (response.data.success) {
        message.success('RefAuto Paper compiled successfully!');
        onSuccess({
          html: response.data.html,
          filePath: response.data.file_path,
          filename: response.data.filename,
          options: response.data.options
        });
      }
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to generate RefAuto paper.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Title level={5} style={{ color: '#fff', marginBottom: '20px' }}>📄 Core Document Meta</Title>
            <Form.Item
              name="title"
              label={<span style={{ color: '#aaa' }}>Research Title</span>}
              rules={[{ required: true, message: 'Please enter paper title' }]}
            >
              <Input placeholder="Enter a short, specific research title..." style={{ background: '#222', color: '#fff', border: '1px solid #444', height: '45px' }} />
            </Form.Item>
            
            <div style={{ marginTop: '20px' }}>
              <span style={{ color: '#aaa', display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Authors & Affiliations</span>
              {authors.map((author, index) => (
                <Row key={author.id} gutter={16} align="middle" style={{ marginBottom: '12px' }}>
                  <Col span={10}>
                    <Input
                      placeholder={`Author ${index + 1} Name`}
                      value={author.name}
                      onChange={(e) => handleAuthorChange(author.id, 'name', e.target.value)}
                      style={{ background: '#222', color: '#fff', border: '1px solid #444' }}
                    />
                  </Col>
                  <Col span={11}>
                    <Input
                      placeholder="Affiliation (e.g. Stanford University)"
                      value={author.affiliation}
                      onChange={(e) => handleAuthorChange(author.id, 'affiliation', e.target.value)}
                      style={{ background: '#222', color: '#fff', border: '1px solid #444' }}
                    />
                  </Col>
                  <Col span={3}>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => removeAuthor(author.id)}
                      style={{ color: '#ff4d4f' }}
                    />
                  </Col>
                </Row>
              ))}
              <Button type="dashed" onClick={addAuthor} icon={<PlusOutlined />} style={{ background: 'transparent', border: '1px dashed #666', color: '#ffde03', marginTop: '8px' }}>
                Add Author
              </Button>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Title level={5} style={{ color: '#fff', marginBottom: '20px' }}>📋 Abstract & Keywords</Title>
            <Form.Item
              name="abstract"
              label={<span style={{ color: '#aaa' }}>Abstract (Brief Summary)</span>}
              rules={[{ required: true, message: 'Please enter paper abstract' }]}
            >
              <Input.TextArea
                rows={5}
                placeholder="A short summary stating the research purpose, methodology, key results, and major conclusions..."
                style={{ background: '#222', color: '#fff', border: '1px solid #444' }}
              />
            </Form.Item>
            
            <Form.Item
              name="keywords"
              label={<span style={{ color: '#aaa' }}>Keywords (comma separated)</span>}
              rules={[{ required: true, message: 'Please enter keywords' }]}
            >
              <Input placeholder="e.g. Deep Learning, Network Security, Neural Networks" style={{ background: '#222', color: '#fff', border: '1px solid #444' }} />
            </Form.Item>
          </motion.div>
        );

      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Title level={5} style={{ color: '#fff', marginBottom: '20px' }}>✍️ Research Sections Content</Title>
            <Form.Item
              name="introduction"
              label={<span style={{ color: '#aaa' }}>I. Introduction</span>}
              rules={[{ required: true, message: 'Introduction is required' }]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Provide research background, outline the problem statement, and specify key research questions..."
                style={{ background: '#222', color: '#fff', border: '1px solid #444' }}
              />
            </Form.Item>
            
            <Form.Item
              name="methodology"
              label={<span style={{ color: '#aaa' }}>II. Methodology & Literature Review</span>}
              rules={[{ required: true, message: 'Methodology is required' }]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Review previous studies, explain data collection methods, and outline the analytical processes..."
                style={{ background: '#222', color: '#fff', border: '1px solid #444' }}
              />
            </Form.Item>

            <Form.Item
              name="results"
              label={<span style={{ color: '#aaa' }}>III. Results & Discussion</span>}
              rules={[{ required: true, message: 'Results & Discussion is required' }]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Present empirical data, compare findings with prior literature, highlight limitations, and detail significance..."
                style={{ background: '#222', color: '#fff', border: '1px solid #444' }}
              />
            </Form.Item>

            <Form.Item
              name="conclusion"
              label={<span style={{ color: '#aaa' }}>IV. Conclusion</span>}
              rules={[{ required: true, message: 'Conclusion is required' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Summarize key insights, specify practical implications, and suggest lines of future work..."
                style={{ background: '#222', color: '#fff', border: '1px solid #444' }}
              />
            </Form.Item>
          </motion.div>
        );

      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Title level={5} style={{ color: '#fff', marginBottom: '20px' }}>📚 Bibliography & Layout</Title>
            <Form.Item
              name="references"
              label={<span style={{ color: '#aaa' }}>References (One citation per line)</span>}
              rules={[{ required: true, message: 'Please enter references' }]}
            >
              <Input.TextArea
                rows={5}
                placeholder="e.g. Karna, S. (2024). Quantum Cryptography. Journal of Computer Science, 12(4), pp. 45-56."
                style={{ background: '#222', color: '#fff', border: '1px solid #444' }}
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="citationStyle"
                  label={<span style={{ color: '#aaa' }}>Citation Format</span>}
                >
                  <Select style={{ width: '100%' }} popupClassName="dark-select-dropdown">
                    <Select.Option value="APA">APA 7th Edition</Select.Option>
                    <Select.Option value="IEEE">IEEE Style</Select.Option>
                    <Select.Option value="MLA">MLA 9th Edition</Select.Option>
                    <Select.Option value="HARVARD">Harvard Style</Select.Option>
                    <Select.Option value="CHICAGO">Chicago Style</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="columns"
                  label={<span style={{ color: '#aaa' }}>Layout Columns</span>}
                >
                  <Select style={{ width: '100%' }} popupClassName="dark-select-dropdown">
                    <Select.Option value="2">Two Columns (Recommended)</Select.Option>
                    <Select.Option value="1">Single Column</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="headingFont"
                  label={<span style={{ color: '#aaa' }}>Heading Font</span>}
                >
                  <Select style={{ width: '100%' }} popupClassName="dark-select-dropdown">
                    <Select.Option value="Times New Roman">Times New Roman</Select.Option>
                    <Select.Option value="Arial">Arial</Select.Option>
                    <Select.Option value="Garamond">Garamond</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="contentFont"
                  label={<span style={{ color: '#aaa' }}>Body Font</span>}
                >
                  <Select style={{ width: '100%' }} popupClassName="dark-select-dropdown">
                    <Select.Option value="Times New Roman">Times New Roman</Select.Option>
                    <Select.Option value="Arial">Arial</Select.Option>
                    <Select.Option value="Garamond">Garamond</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const stepsList = [
    { title: 'Metadata' },
    { title: 'Abstract' },
    { title: 'Body Content' },
    { title: 'References' }
  ];

  return (
    <Card className="custom-card" style={{ maxWidth: '800px', margin: '0 auto', border: '3px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={4} style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RocketOutlined style={{ color: '#ffde03' }} /> RefAuto Step-by-Step Creator
        </Title>
        <Button onClick={onBack} icon={<LeftOutlined />} style={{ background: 'transparent', color: '#aaa', border: '2px solid #444', fontWeight: 'bold' }}>
          Back
        </Button>
      </div>

      <Steps current={currentStep} size="small" style={{ marginBottom: '32px' }}>
        {stepsList.map(item => (
          <Step key={item.title} title={<span style={{ color: '#fff', fontSize: '0.8rem' }}>{item.title}</span>} />
        ))}
      </Steps>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          citationStyle: 'APA',
          columns: '2',
          headingFont: 'Times New Roman',
          contentFont: 'Times New Roman'
        }}
      >
        <div style={{ minHeight: '320px', background: '#141414', padding: '24px', border: '2px solid #333', borderRadius: '12px', marginBottom: '24px' }}>
          {renderStepContent()}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            onClick={prev}
            disabled={currentStep === 0}
            icon={<LeftOutlined />}
            style={{ border: '2px solid #333', background: '#222', color: currentStep === 0 ? '#555' : '#fff', fontWeight: 'bold' }}
          >
            Previous
          </Button>

          {currentStep < stepsList.length - 1 ? (
            <Button
              type="primary"
              onClick={next}
              icon={<RightOutlined />}
              style={{ background: '#ffde03', color: '#000', border: 'none', fontWeight: 'bold' }}
            >
              Next Step
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleGenerate}
              loading={loading}
              icon={<RocketOutlined />}
              style={{ background: '#52c41a', color: '#fff', border: 'none', fontWeight: 'bold', animation: 'pulse 2s infinite' }}
            >
              {loading ? 'Compiling Paper...' : 'Generate Premium Paper'}
            </Button>
          )}
        </div>
      </Form>
    </Card>
  );
};

export default RefAutoWizard;
