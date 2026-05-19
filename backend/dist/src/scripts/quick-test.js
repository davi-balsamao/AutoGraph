"use strict";
// Quick test: can we reach the server at all?
async function quickTest() {
    try {
        console.log('Testing root endpoint...');
        const res = await fetch('http://127.0.0.1:3000/');
        console.log(`Status: ${res.status}`);
        const body = await res.json();
        console.log('Body:', body);
    }
    catch (err) {
        console.error('Error:', err);
    }
}
quickTest();
