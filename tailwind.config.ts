import type { Config } from "tailwindcss"

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#5AB6F7', // Antigravity Blue
                    50: '#E8F5FF',
                    100: '#D1E9FF',
                    200: '#A8D9FF',
                    300: '#7BC9FF',
                    400: '#5AB6F7',
                    500: '#2A84D2',
                    600: '#1E6BB8',
                    700: '#155296',
                    800: '#0F3C73',
                    900: '#0A2850',
                },
                secondary: {
                    DEFAULT: '#6F7B86', // Cool Grey
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E3E9EF', // Soft Silver
                    300: '#CBD5E1',
                    400: '#94A3B8',
                    500: '#6F7B86',
                    600: '#475569',
                    700: '#334155',
                    800: '#1E293b',
                    900: '#0F172A',
                },
                success: '#4CD4A9',
                warning: '#F7C15A',
                error: '#F46C6C',
                info: '#7BC9FF',
                neutral: {
                    white: '#FFFFFF',
                    silver: '#E3E9EF',
                    graphite: '#3A4750',
                    grey: '#6F7B86',
                }
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 4px 14px rgba(0,0,0,0.06)',
                'glow': '0 0 20px rgba(90, 182, 247, 0.15)',
            },
            animation: {
                "fade-in": "fadeIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                "slide-up": "slideUp 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                "lift": "lift 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                slideUp: {
                    "0%": { transform: "translateY(20px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                lift: {
                    "0%": { transform: "translateY(0)" },
                    "100%": { transform: "translateY(-3px)" },
                }
            },
        },
    },
    plugins: [],
}
export default config
