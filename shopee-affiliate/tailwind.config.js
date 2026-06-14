/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        shopee: {
          50:'#fff1ee',100:'#ffe0d9',200:'#ffc6b8',300:'#ff9e87',
          400:'#ff6b4a',500:'#ff4524',600:'#ee2a09',700:'#c81f07',800:'#a51e0e',900:'#881e13'
        }
      },
      fontFamily: { sans:['Inter','Noto Sans Thai','sans-serif'], display:['Sora','sans-serif'] },
      animation: {
        'fade-in':'fadeIn 0.3s ease-in-out',
        'slide-up':'slideUp 0.35s ease-out',
        'pulse-dot':'pulseDot 1.5s infinite'
      },
      keyframes: {
        fadeIn:{'0%':{opacity:'0'},'100%':{opacity:'1'}},
        slideUp:{'0%':{transform:'translateY(16px)',opacity:'0'},'100%':{transform:'translateY(0)',opacity:'1'}},
        pulseDot:{'0%,100%':{opacity:'1'},'50%':{opacity:'0.3'}}
      }
    }
  },
  plugins: []
};
