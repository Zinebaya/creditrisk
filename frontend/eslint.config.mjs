import nextVitals from "eslint-config-next/core-web-vitals"

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "tsconfig.tsbuildinfo",
    ],
  },
  ...nextVitals,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
    },
  },
]

export default config
