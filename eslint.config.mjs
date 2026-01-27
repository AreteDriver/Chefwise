import reactPlugin from "eslint-plugin-react";
import nextPlugin from "@next/eslint-plugin-next";

export default [
    {
        ignores: [
            ".next/",
            "out/",
            "android/",
            "ios/",
            "coverage/",
        ],
    },
    reactPlugin.configs.flat["jsx-runtime"],
    nextPlugin.flatConfig.coreWebVitals,
    {
        rules: {
            "react/no-unescaped-entities": "off",
            "@next/next/no-page-custom-font": "off",
        },
    },
];
