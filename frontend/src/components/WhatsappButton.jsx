import React from 'react'

const WhatsappButton = () => {
  return (
    <div style={{position:'fixed',bottom:'24px',right:'24px',zIndex:9999,display:'flex',flexDirection:'column',gap:'12px',alignItems:'center'}}>


      <a href="tel:+918509716112" title="Call +91 8509716112">
        <div style={{backgroundColor:'#ffffff',borderRadius:'50%',width:'52px',height:'52px',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(0,0,0,0.3)',cursor:'pointer'}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="#EA4335">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        </div>
      </a>

      <a href="https://wa.me/918509716112" target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
          style={{width:'52px',height:'52px',display:'block',filter:'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',cursor:'pointer'}}
        />
      </a>

    </div>
  )
}

export default WhatsappButton