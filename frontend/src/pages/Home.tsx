import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '../components/Hero';
import UploadPanel from '../components/UploadPanel';

const Home: React.FC = () => {
  const [triggerWizard, setTriggerWizard] = useState(false);
  const [tabHovered, setTabHovered] = useState(false);

  return (
    <>
      <Helmet>
        <title>refLib - Playful Academic Document Formatter</title>
        <meta name="description" content="Upload your docx or pdf and cleanly format it to academic standards using AI natively in browser." />
      </Helmet>

      {/* ── Fixed Right-Edge RefAuto Side Tab ── */}
      <div
        onClick={() => setTriggerWizard(true)}
        onMouseEnter={() => setTabHovered(true)}
        onMouseLeave={() => setTabHovered(false)}
        style={{
          position: 'fixed',
          top: '50%',
          right: 0,
          transform: tabHovered ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(4px)',
          zIndex: 1200,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Glowing pulsing dot badge */}
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '8px',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: '#ff4d4f',
          border: '2px solid #fff',
          boxShadow: '0 0 0 0 rgba(255,77,79,0.7)',
          animation: 'refAutoPulse 1.8s ease-out infinite',
          zIndex: 10,
        }} />

        {/* The vertical pill tab */}
        <div style={{
          background: tabHovered
            ? 'linear-gradient(180deg, #ffe566 0%, #ffde03 100%)'
            : 'linear-gradient(180deg, #ffde03 0%, #e6c800 100%)',
          border: '3px solid #111',
          borderRight: 'none',
          borderRadius: '12px 0 0 12px',
          padding: '20px 10px',
          boxShadow: tabHovered
            ? '-6px 4px 0 #111'
            : '-4px 3px 0 #111',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.25s ease',
          minWidth: '42px',
        }}>
          {/* Rocket icon */}
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🚀</span>

          {/* Vertical text */}
          <span style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            fontWeight: '900',
            fontSize: '0.75rem',
            color: '#111',
            letterSpacing: '0.5px',
            fontFamily: "'Nunito', sans-serif",
            whiteSpace: 'nowrap',
          }}>
            Try RefAuto
          </span>

          {/* Recommended star badge */}
          <span style={{
            background: '#111',
            color: '#ffde03',
            fontSize: '0.6rem',
            fontWeight: '900',
            padding: '2px 4px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            letterSpacing: '0.5px',
          }}>
            ⭐ NEW
          </span>
        </div>
      </div>

      {/* Pulse animation keyframes injected inline */}
      <style>{`
        @keyframes refAutoPulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,77,79,0.7); }
          70%  { box-shadow: 0 0 0 10px rgba(255,77,79,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,77,79,0); }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '800px', margin: '0 auto', gap: '40px' }}>
        <Hero />
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <UploadPanel
            openWizard={triggerWizard}
            onWizardHandled={() => setTriggerWizard(false)}
          />
        </div>
      </div>
    </>
  );
};

export default Home;

