module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseLogo: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
        floatText: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
		 pulseSlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)', opacity: '0.2' },
          '50%': { transform: 'translateY(-10px)', opacity: '0.6' },
        },
        heroText: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceOnce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
      animation: {
        fadeInDown: 'fadeInDown 1s ease-out forwards',
        fadeInUp: 'fadeInUp 1s ease-out forwards',
        pulseLogo: 'pulseLogo 2s ease-in-out infinite',
        sparkle: 'sparkle 3s ease-in-out infinite',
        floatText: 'floatText 4s ease-in-out infinite',
		pulseSlow: 'pulseSlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 5s ease-in-out infinite',
        heroText: 'heroText 0.6s forwards',
        bounceOnce: 'bounceOnce 1.5s infinite',
      },
      colors: {
        gradientStart: '#8b5cf6',
        gradientMid: '#ec4899',
        gradientEnd: '#f43f5e',
      }
    },
  },
  plugins: [],
}