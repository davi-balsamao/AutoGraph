"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Diagnostic: replicates EXACTLY what LangChain does internally.
 * Calls Gemini's streamGenerateContent endpoint and prints each chunk's arrival time.
 *
 * Run: npx ts-node-dev backend/src/scripts/test-gemini-stream.ts
 */
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = process.env.LLM_MODEL || 'gemini-2.0-flash';
async function testStream() {
    console.log(`Testing STREAMING endpoint with model: ${MODEL}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${API_KEY}`;
    const t0 = Date.now();
    const elapsed = () => ((Date.now() - t0) / 1000).toFixed(2) + 's';
    try {
        console.log(`[${elapsed()}] Opening connection...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Diga oi em uma palavra.' }] }],
            }),
        });
        console.log(`[${elapsed()}] Got HTTP ${response.status}`);
        if (!response.body) {
            console.log('No body!');
            return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let chunkCount = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            chunkCount++;
            const text = decoder.decode(value).slice(0, 80).replace(/\n/g, '\\n');
            console.log(`[${elapsed()}] Chunk ${chunkCount}: "${text}..."`);
        }
        console.log(`[${elapsed()}] Stream ended. Total chunks: ${chunkCount}`);
    }
    catch (err) {
        console.error(`[${elapsed()}] Error:`, err);
    }
}
async function testSync() {
    console.log(`\nTesting NON-STREAMING endpoint with model: ${MODEL}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    const t0 = Date.now();
    const elapsed = () => ((Date.now() - t0) / 1000).toFixed(2) + 's';
    try {
        console.log(`[${elapsed()}] POST...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Diga oi em uma palavra.' }] }],
            }),
        });
        console.log(`[${elapsed()}] HTTP ${response.status}`);
        const data = await response.json();
        console.log(`[${elapsed()}] Response:`, JSON.stringify(data).slice(0, 200));
    }
    catch (err) {
        console.error(`[${elapsed()}] Error:`, err);
    }
}
(async () => {
    await testStream();
    await testSync();
})();
