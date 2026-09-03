/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: ["../LucidLab/Assets/StreamingAssets/*.html"],
    theme: {
        extend: {
            colors: {
                "primary": "#00f2ff",
                "background-light": "#f5f8f8",
                "background-dark": "#0f2223",
            },
            fontFamily: {
                "display": ["Inter"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms')({
            strategy: 'class', // avoid global styles affecting things unintentionally
        }),
        require('@tailwindcss/container-queries')
    ],
}
