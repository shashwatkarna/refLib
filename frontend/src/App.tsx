import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Layout, ConfigProvider, Popover, Input } from 'antd';
import Home from './pages/Home';

const { Header, Content, Footer } = Layout;

function App() {
  const supportContent = (
    <div style={{ textAlign: 'center', padding: '10px' }}>
      <h4 style={{ margin: '0 0 10px 0', fontWeight: '900', color: '#111', fontSize: '1.05rem' }}>Scan to Support</h4>
      <div style={{ width: '150px', height: '150px', background: '#fff', border: '3px solid #111', borderRadius: '12px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '4px 4px 0 #111', overflow: 'hidden' }}>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=upi://pay?pa=9971374395@apl&pn=Shashwat&cu=INR" alt="UPI QR Code" style={{ width: '130px', height: '130px' }} />
      </div>
      <p style={{ marginTop: '16px', marginBottom: '0', fontSize: '0.9rem', color: '#444', fontWeight: 'bold' }}>UPI: 9971374395@apl</p>
    </div>
  );

  return (
    <HelmetProvider>
      <ConfigProvider 
        theme={{ 
          token: { 
            colorPrimary: '#52c41a', 
            borderRadius: 8,
            fontFamily: "'Nunito', sans-serif",
            colorText: '#333'
          } 
        }}
      >
        <Router>
          <Layout className="layout">
            <Header>
              <div className="logo" style={{ color: '#333', fontWeight: '900', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.5px' }}>
                <div style={{ background: '#1677ff', borderRadius: '50%', width: '36px', height: '36px', border: '3px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '2px 2px 0px #333' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                refLib
              </div>
              <a href="https://github.com/shashwatkarna/refLib" target="_blank" rel="noopener noreferrer" style={{ color: '#333' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ background: 'white', padding: '4px', borderRadius: '50%', border: '3px solid #333', boxShadow: '3px 3px 0 #333', transition: 'all 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translate(-2px, -2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translate(0, 0)'}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </a>
            </Header>
            <Content style={{ padding: '0 50px' }}>
              <Routes>
                <Route path="/" element={<Home />} />
              </Routes>
            </Content>
            <Footer style={{ textAlign: 'center', color: '#111', fontWeight: 'bold', background: 'transparent' }}>
              refLib ©{new Date().getFullYear()} - Hand-drawn Academic Formatting
            </Footer>
          </Layout>
        </Router>
      </ConfigProvider>

      {/* Bottom Left Utility Container */}
      <div style={{ position: 'fixed', bottom: '20px', left: '20px', display: 'flex', gap: '12px', zIndex: 1000 }}>
        {/* Floating Report Bug Hover Form */}
        <Popover 
          trigger="hover" 
          placement="topLeft" 
          overlayInnerStyle={{ border: '3px solid #111', borderRadius: '16px', boxShadow: '6px 6px 0 #111', padding: '14px' }}
          content={
            <div style={{ width: '220px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontWeight: '900', color: '#111', fontSize: '1.05rem' }}>Report a Bug</h4>
              <Input.TextArea 
                id="bug-input" 
                placeholder="Describe the issue..." 
                rows={3} 
                style={{ border: '2px solid #111', borderRadius: '8px', marginBottom: '10px', resize: 'none', fontWeight: 'bold' }} 
              />
              <button 
                style={{ width: '100%', padding: '8px', background: '#ff4d4f', color: '#fff', fontWeight: '900', border: '2px solid #111', borderRadius: '8px', cursor: 'pointer', boxShadow: '2px 2px 0 #111', transition: 'all 0.1s' }} 
                onClick={(e) => {
                  const input = document.getElementById('bug-input') as HTMLTextAreaElement;
                  if (input && input.value.trim()) {
                    const btn = e.currentTarget;
                    btn.innerText = 'Submitted \u2713';
                    btn.style.background = '#52c41a';
                    input.value = '';
                    setTimeout(() => {
                      btn.innerText = 'Submit';
                      btn.style.background = '#ff4d4f';
                    }, 2000);
                  }
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 #111'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '2px 2px 0 #111'; }}
              >Submit</button>
              <div style={{ marginTop: '12px', textAlign: 'center', borderTop: '2px dashed #eee', paddingTop: '8px' }}>
                <a href="https://github.com/shashwatkarna/refLib/issues/new" target="_blank" rel="noopener noreferrer" style={{ color: '#1677ff', fontWeight: 'bold', fontSize: '0.85rem' }}>Or report via GitHub →</a>
              </div>
            </div>
          }
        >
          <button 
            style={{
              background: '#fff',
              color: '#111',
              padding: '8px 14px',
              fontSize: '0.85rem',
              borderRadius: '20px',
              border: '2px solid #111',
              boxShadow: '3px 3px 0 #111',
              fontWeight: '800',
              fontFamily: "'Nunito', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              transition: 'all 0.1s ease-in-out',
              cursor: 'pointer'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px, -2px) rotate(2deg)'; e.currentTarget.style.boxShadow = '5px 5px 0 #111'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0, 0) rotate(0deg)'; e.currentTarget.style.boxShadow = '3px 3px 0 #111'; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(3px, 3px) rotate(0deg)'; e.currentTarget.style.boxShadow = '0px 0px 0 #111'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translate(-2px, -2px) rotate(2deg)'; e.currentTarget.style.boxShadow = '5px 5px 0 #111'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M17.47 9c1.93-.2 3.53-1.9 3.53-4"/><path d="M8 14H4"/><path d="M20 14h-4"/><path d="M9 18h6"/></svg>
            Report a bug
          </button>
        </Popover>

        {/* Floating Feedback Hover Form */}
        <Popover 
          trigger="hover" 
          placement="topLeft" 
          overlayInnerStyle={{ border: '3px solid #111', borderRadius: '16px', boxShadow: '6px 6px 0 #111', padding: '14px' }}
          content={
            <div style={{ width: '220px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontWeight: '900', color: '#111', fontSize: '1.05rem' }}>Suggestion</h4>
              <Input.TextArea 
                id="feedback-input" 
                placeholder="What can we improve?" 
                rows={3} 
                style={{ border: '2px solid #111', borderRadius: '8px', marginBottom: '10px', resize: 'none', fontWeight: 'bold' }} 
              />
              <button 
                style={{ width: '100%', padding: '8px', background: '#1677ff', color: '#fff', fontWeight: '900', border: '2px solid #111', borderRadius: '8px', cursor: 'pointer', boxShadow: '2px 2px 0 #111', transition: 'all 0.1s' }} 
                onClick={(e) => {
                  const input = document.getElementById('feedback-input') as HTMLTextAreaElement;
                  if (input && input.value.trim()) {
                    const btn = e.currentTarget;
                    btn.innerText = 'Sent \u2713';
                    btn.style.background = '#52c41a';
                    input.value = '';
                    setTimeout(() => {
                      btn.innerText = 'Send';
                      btn.style.background = '#1677ff';
                    }, 2000);
                  }
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 #111'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '2px 2px 0 #111'; }}
              >Send</button>
            </div>
          }
        >
          <button 
            style={{
              background: '#b8e994',
              color: '#111',
              padding: '8px 14px',
              fontSize: '0.85rem',
              borderRadius: '20px',
              border: '2px solid #111',
              boxShadow: '3px 3px 0 #111',
              fontWeight: '800',
              fontFamily: "'Nunito', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.1s ease-in-out',
              cursor: 'pointer'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px, -2px) rotate(2deg)'; e.currentTarget.style.boxShadow = '5px 5px 0 #111'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0, 0) rotate(0deg)'; e.currentTarget.style.boxShadow = '3px 3px 0 #111'; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(3px, 3px) rotate(0deg)'; e.currentTarget.style.boxShadow = '0px 0px 0 #111'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translate(-2px, -2px) rotate(2deg)'; e.currentTarget.style.boxShadow = '5px 5px 0 #111'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Feedback
          </button>
        </Popover>
      </div>

      {/* Floating Support Button */}
      <Popover content={supportContent} title={null} trigger="click" placement="topRight" overlayInnerStyle={{ border: '3px solid #111', borderRadius: '16px', boxShadow: '6px 6px 0 #111', padding: '10px' }}>
        <button 
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#ffdd00',
            color: '#111',
            padding: '8px 14px',
            fontSize: '0.85rem',
            borderRadius: '20px',
            border: '2px solid #111',
            boxShadow: '3px 3px 0 #111',
            fontWeight: '800',
            fontFamily: "'Nunito', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 1000,
            textDecoration: 'none',
            transition: 'all 0.1s ease-in-out',
            cursor: 'pointer'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px, -2px) rotate(-2deg)'; e.currentTarget.style.boxShadow = '5px 5px 0 #111'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0, 0) rotate(0deg)'; e.currentTarget.style.boxShadow = '3px 3px 0 #111'; }}
          onMouseDown={e => { e.currentTarget.style.transform = 'translate(3px, 3px) rotate(0deg)'; e.currentTarget.style.boxShadow = '0px 0px 0 #111'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'translate(-2px, -2px) rotate(-2deg)'; e.currentTarget.style.boxShadow = '5px 5px 0 #111'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
          Support me
        </button>
      </Popover>
    </HelmetProvider>
  );
}

export default App;
