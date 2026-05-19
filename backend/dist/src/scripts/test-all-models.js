"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const google_genai_1 = require("@langchain/google-genai");
dotenv_1.default.config();
const prompt = 'Olá, responda apenas com a palavra "OK" se receber esta mensagem.';
async function testModel(modelName) {
    console.log(`--- Testing model: ${modelName} ---`);
    const llm = new google_genai_1.ChatGoogleGenerativeAI({
        temperature: 0,
        model: modelName,
        apiKey: process.env.GOOGLE_API_KEY,
        apiVersion: 'v1',
    });
    const start = Date.now();
    try {
        const res = await llm.invoke(prompt);
        console.log(`✅ Success for ${modelName} in ${Date.now() - start}ms: "${res.content.toString().trim()}"`);
        return true;
    }
    catch (err) {
        console.error(`❌ Failed for ${modelName}:`, err.message || err);
        return false;
    }
}
async function main() {
    const models = [
        'gemini-pro-latest',
        'gemini-flash-lite-latest',
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash-lite-001',
        'gemini-1.5-flash-002',
        'gemini-1.5-flash-001',
        'gemini-1.5-pro-002',
        'gemini-flash-latest',
        'gemini-1.0-pro',
        'gemini-1.5-pro',
        'gemini-2.0-flash',
        'gemini-2.0-flash-exp',
        'gemini-pro',
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest'
    ];
    for (const model of models) {
        await testModel(model);
        // Wait a brief moment to avoid rate limit spikes during testing
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
main().catch(console.error);
