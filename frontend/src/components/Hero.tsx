import React from 'react';
import { Typography } from 'antd';
import { motion } from 'framer-motion';
import { FileText, Wand2, Download } from 'lucide-react';

const { Title, Paragraph } = Typography;

const Hero: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ textAlign: 'center', width: '100%' }}
    >
      <Title level={1} style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.1 }}>
        Instantly format your <span style={{ display: 'inline-block', color: '#fff', background: '#ff4d4f', padding: '0 12px', border: '4px solid #333', borderRadius: '12px', boxShadow: '4px 4px 0 #333', transform: 'rotate(-2deg)', textShadow: 'none', marginLeft: '6px' }}>Research</span> 
      </Title>
      
      <Paragraph style={{ fontSize: '1.25rem', color: '#444', marginBottom: '40px', fontWeight: 700, maxWidth: '600px', margin: '0 auto 40px auto' }}>
        Drop your messy drafts below. RefLib automates IEEE, APA, and MLA layouts natively in your browser!
      </Paragraph>

      {/* Subtle Animated Neo-Brutalist Graphic */}
      <motion.div 
        className="custom-card"
        animate={{ y: [-3, 3, -3] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        style={{
          background: '#fff0f5',
          borderRadius: '24px',
          padding: '30px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '30px',
          maxWidth: '500px',
          margin: '0 auto',
          border: '4px solid #111',
          boxShadow: '8px 8px 0 #111'
        }}
      >
        <motion.div 
          whileHover={{ scale: 1.05, rotate: -2 }}
          style={{ textAlign: 'center', background: '#fff', padding: '16px', borderRadius: '16px', border: '3px solid #111', boxShadow: '4px 4px 0 #111' }}
        >
            <FileText size={36} color="#111" strokeWidth={2.5} />
            <div style={{ marginTop: '8px', fontWeight: 900, color: '#111', fontSize: '0.9rem' }}>UPLOAD</div>
        </motion.div>
        
        <motion.div 
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          style={{ background: '#ffde03', borderRadius: '50%', padding: '12px', border: '3px solid #111', boxShadow: '4px 4px 0 #111' }}
        >
            <Wand2 size={36} color="#111" strokeWidth={2.5} />
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.05, rotate: 2 }}
          style={{ textAlign: 'center', background: '#52c41a', padding: '16px', borderRadius: '16px', border: '3px solid #111', boxShadow: '4px 4px 0 #111' }}
        >
            <Download size={36} color="#111" strokeWidth={2.5} />
            <div style={{ marginTop: '8px', fontWeight: 900, color: '#111', fontSize: '0.9rem' }}>FORMAT</div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Hero;
