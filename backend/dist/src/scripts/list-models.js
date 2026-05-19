"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
async function main() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('GOOGLE_API_KEY is missing in .env!');
        return;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log('Sending direct HTTP GET request to list models...');
    try {
        const res = await axios_1.default.get(url);
        const models = res.data.models;
        console.log(`\nFound ${models?.length || 0} models:`);
        if (models) {
            for (const m of models) {
                console.log(`- ${m.name} (${m.displayName})`);
                console.log(`  Supported Methods: ${m.supportedGenerationMethods?.join(', ')}`);
            }
        }
    }
    catch (err) {
        console.error('Failed to list models via HTTP GET:', err.response?.data || err.message || err);
    }
}
main().catch(console.error);
