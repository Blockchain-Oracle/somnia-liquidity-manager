/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', 'class'],
  theme: {
  	screens: {
  		'xs': '475px',
  		'sm': '640px',
  		'md': '768px',
  		'lg': '1024px',
  		'xl': '1280px',
  		'2xl': '1536px',
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			'gmx-blue': {
  				'300': '#7885ff',
  				'400': '#4d5ffa',
  				'500': '#3d51ff',
  				'600': '#2d42fc',
  				'700': '#2e3dcd'
  			},
  			'cold-blue': {
  				'500': '#3a3f79',
  				'700': '#282b54',
  				'900': '#1e203e'
  			},
  			slate: {
  				'100': '#a0a3c4',
  				'500': '#3e4361',
  				'600': '#373c58',
  				'700': '#23263b',
  				'750': '#17182c',
  				'800': '#16182e',
  				'900': '#101124',
  				'950': '#08091b'
  			},
  			success: '#0FDE8D',
  			warning: '#f3b50c',
  			error: '#FF506A',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.3s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-in-out',
  			'scale-in': 'scaleIn 0.2s ease-in-out',
  			'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					transform: 'scale(0.9)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			pulseGlow: {
  				'0%, 100%': {
  					boxShadow: '0 0 20px rgba(61, 81, 255, 0.5)'
  				},
  				'50%': {
  					boxShadow: '0 0 40px rgba(61, 81, 255, 0.8)'
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-primary': 'linear-gradient(135deg, #3d51ff 0%, #7885ff 100%)',
  			'gradient-success': 'linear-gradient(135deg, #0FDE8D 0%, #8CF3CB 100%)',
  			'gradient-card': 'linear-gradient(145deg, rgba(61,81,255,0.05) 0%, rgba(120,133,255,0.02) 100%)',
  			'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(234,100%,62%,0.1) 0px, transparent 50%)'
  		},
  		boxShadow: {
  			'glow-primary': '0 0 40px rgba(61, 81, 255, 0.3)',
  			'glow-success': '0 0 40px rgba(15, 222, 141, 0.3)',
  			'card-hover': '0 10px 40px rgba(61, 81, 255, 0.1)'
  		}
  	}
  },
  plugins: [],
}