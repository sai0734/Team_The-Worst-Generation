/** @type{import('tailwindcss').Config}*/
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nx: {
          primary: "#00de5a",
          ink: "#17191d",
          body: "#737881",
          label: "#4a4e57",
          muted: "#919191",
          disabled: "#9fa1a7",
          canvas: "#ffffff",
          black: "#000000",
        },
      },
      fontFamily: {
        nx: [
          "NEXON Gothic Bold",
          "NexonGothic",
          "Malgun Gothic",
          "맑은 고딕",
          "sans-serif",
        ],
        malgun: ["Malgun Gothic", "맑은 고딕", "sans-serif"],
      },
      borderRadius: {
        nx: "4px",
        "nx-lg": "8px",
      },
      boxShadow: {
        "nx-ambient": "rgba(0,0,0,0.08) 0px 2px 8px",
        "nx-elevated": "rgba(0,0,0,0.16) 0px 8px 24px",
      },
    },
  },
  plugins: [],
};
