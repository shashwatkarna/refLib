import React from 'react';

import { Helmet } from 'react-helmet-async';
import Hero from '../components/Hero';
import UploadPanel from '../components/UploadPanel';

const Home: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>refLib - Playful Academic Document Formatter</title>
        <meta name="description" content="Upload your docx or pdf and cleanly format it to academic standards using AI natively in browser." />
      </Helmet>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '800px', margin: '0 auto', gap: '40px' }}>
        <Hero />
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <UploadPanel />
        </div>
      </div>
    </>
  );
};

export default Home;
