/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./frontend/**/*.{html,ts,tsx}",
        "./frontend/src/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    indigo: '#6366f1',
                    purple: '#8b5cf6',
                    pink: '#d946ef',
                },
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
            },
            fontFamily: {
                outfit: ['Outfit', 'sans-serif'],
                inter: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                'xl': '32px',
            },
        },
    },
    plugins: [],
}
