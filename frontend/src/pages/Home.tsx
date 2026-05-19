import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '../components/Hero';
import UploadPanel from '../components/UploadPanel';

const Home: React.FC = () => {
  const [triggerWizard, setTriggerWizard] = useState(false);
  const [tabHovered, setTabHovered] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifExiting, setNotifExiting] = useState(false);
  const [notifHovered, setNotifHovered] = useState(false);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissNotif = () => {
    setNotifExiting(true);
    setTimeout(() => setShowNotif(false), 350);
  };

  const openRefAuto = () => {
    dismissNotif();
    setTimeout(() => setTriggerWizard(true), 200);
  };

  const startAutoDismiss = () => {
    autoDismissRef.current = setTimeout(() => {
      setNotifExiting(true);
      setTimeout(() => setShowNotif(false), 350);
    }, 6800);
  };

  const stopAutoDismiss = () => {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
  };

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowNotif(true);
      startAutoDismiss();
    }, 1200);
    return () => {
      clearTimeout(showTimer);
      stopAutoDismiss();
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>refLib - Playful Academic Document Formatter</title>
        <meta name="description" content="Upload your docx or pdf and cleanly format it to academic standards using AI natively in browser." />
      </Helmet>

      {/* ── Custom RefAuto Notification ── */}
      {showNotif && (
        <div
          onMouseEnter={() => { setNotifHovered(true); stopAutoDismiss(); }}
          onMouseLeave={() => { setNotifHovered(false); startAutoDismiss(); }}
          style={{
          position: 'fixed',
          bottom: '80px',
          left: '24px',
          zIndex: 2000,
          width: '310px',
          background: 'linear-gradient(135deg, #ffde03 0%, #ffe94d 100%)',
          border: '3px solid #111',
          borderRadius: '18px',
          boxShadow: '6px 6px 0 #111',
          padding: '18px 20px',
          fontFamily: "'Nunito', sans-serif",
          animation: notifExiting
            ? 'notifSlideOut 0.35s cubic-bezier(0.4,0,1,1) forwards'
            : 'notifSlideIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          {/* Close button */}
          <button
            onClick={dismissNotif}
            style={{
              position: 'absolute',
              top: '10px',
              right: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              color: '#111',
              fontWeight: '900',
              lineHeight: 1,
              padding: '2px 4px',
            }}
          >
            ✕
          </button>

          {/* Icon + title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>🚀</span>
            <div>
              <div style={{ fontWeight: '900', fontSize: '0.95rem', color: '#111', lineHeight: 1.2 }}>
                Faster with RefAuto!
              </div>
              <div style={{ fontSize: '0.7rem', color: '#555', fontWeight: '700', marginTop: '2px' }}>
                ⭐ Recommended for new papers
              </div>
            </div>
          </div>

          {/* Body */}
          <p style={{ margin: '0 0 14px 0', fontSize: '0.82rem', color: '#333', lineHeight: '1.5', fontWeight: '600' }}>
            No draft? No problem. Build your full research paper <strong>section by section</strong> in minutes — no file needed.
          </p>

          {/* Progress bar (visual auto-dismiss indicator) */}
          <div style={{ height: '3px', background: 'rgba(0,0,0,0.12)', borderRadius: '2px', marginBottom: '14px', overflow: 'hidden' }}>
            <div
              key={notifHovered ? 'hovered' : 'unhovered'}
              style={{
                height: '100%',
                background: '#111',
                borderRadius: '2px',
                animation: notifHovered ? 'none' : 'notifProgress 6.8s linear forwards',
                width: notifHovered ? '100%' : undefined,
              }}
            />
          </div>

          {/* CTA button */}
          <button
            onClick={openRefAuto}
            style={{
              width: '100%',
              padding: '10px',
              background: '#111',
              color: '#ffde03',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '900',
              fontSize: '0.88rem',
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
              letterSpacing: '0.3px',
              transition: 'transform 0.1s, box-shadow 0.1s',
              boxShadow: '2px 2px 0 #000',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '3px 4px 0 #000';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '2px 2px 0 #000';
            }}
          >
            Open RefAuto →
          </button>
        </div>
      )}

      {/* Notification animations */}
      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(30px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes notifSlideOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(20px) scale(0.92); }
        }
        @keyframes notifProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

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
        {/* Pulsing red dot */}
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '8px',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: '#ff4d4f',
          border: '2px solid #fff',
          animation: 'refAutoPulse 1.8s ease-out infinite',
          zIndex: 10,
        }} />

        <div style={{
          background: tabHovered
            ? 'linear-gradient(180deg, #ffe566 0%, #ffde03 100%)'
            : 'linear-gradient(180deg, #ffde03 0%, #e6c800 100%)',
          border: '3px solid #111',
          borderRight: 'none',
          borderRadius: '12px 0 0 12px',
          padding: '20px 10px',
          boxShadow: tabHovered ? '-6px 4px 0 #111' : '-4px 3px 0 #111',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.25s ease',
          minWidth: '42px',
        }}>
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🚀</span>
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
