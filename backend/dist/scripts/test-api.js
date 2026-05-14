"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-flash-latest';
async function testApi() {
    console.log(`Testing model: ${MODEL}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: "Oi" }] }]
        })
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log(JSON.stringify(data, null, 2));
}
testApi();
