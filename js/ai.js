import { OLLAMA_URL, OLLAMA_MODEL, CONFIGS } from './config.js';
import { state } from './state.js';

let aiCardOpen = false;
let aiMessages = [];

export function initAiPanel() {
    document.getElementById('aiToggleBtn').addEventListener('click', toggleAiCard);
    document.getElementById('closeAiBtn').addEventListener('click', toggleAiCard);
    document.getElementById('aiSendBtn').addEventListener('click', sendAiMessage);
    document.getElementById('aiInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') sendAiMessage();
    });
}

export function setupAiPanel() {
    aiMessages = [];
    aiCardOpen = false;
    document.getElementById('aiCard').style.display = 'none';
    renderAiMessages();
    buildQuickButtons();
}

function toggleAiCard() {
    aiCardOpen = !aiCardOpen;
    document.getElementById('aiCard').style.display = aiCardOpen ? 'block' : 'none';
    if (aiCardOpen && aiMessages.length === 0) triggerAutoGreeting();
}

function buildQuickButtons() {
    const item = state.currentItem; 
    if (!item) return;
    
    const prompts = item.type === 'letter'
        ? [`Fun fact about ${item.letter}`, `Word starting with ${item.letter}`, `How to write ${item.letter}`]
        : item.type === 'number'
        ? [`Fun fact about ${item.letter}`, `Count to ${item.letter} in a fun way`, `Things that come in ${item.letter}s`]
        : item.type === 'fill'
        ? [`Tell me about a ${item.letter}`, `Rhyme for ${item.letter}`, `Draw hint for ${item.letter}`]
        : [`Pronounce ${item.letter}`, `Fun fact about ${item.letter}`, `Sentences with ${item.letter}`];
        
    const c = document.getElementById('aiQuickBtns'); 
    if (!c) return; 
    c.innerHTML = '';
    
    prompts.forEach(p => {
        const b = document.createElement('button');
        b.className = 'quick-btn';
        b.textContent = p;
        b.onclick = () => askAi(p);
        c.appendChild(b);
    });
}

async function triggerAutoGreeting() {
    const item = state.currentItem; 
    if (!item) return;
    
    const g = {
        letter: `The child is about to learn letter "${item.letter}". Give a very short (2 sentences), fun, encouraging welcome for a 4-year-old. Mention one simple word that starts with "${item.letter}".`,
        number: `The child is learning number ${item.letter}. Give a very short (2 sentences), fun welcome for a 4-year-old mentioning something they can count to ${item.letter}.`,
        fill: `The child is learning to write "${item.letter}". Give a very short (2 sentences), fun encouraging message about this word for a 4-year-old.`,
        speak: `The child is practicing saying "${item.letter}". Give a very short (2 sentences), fun intro about this word for a 4-year-old.`,
    };
    await askAi(g[item.type], true);
}

async function sendAiMessage() {
    const inp = document.getElementById('aiInput');
    const t = inp.value.trim();
    if (!t) return;
    inp.value = '';
    await askAi(t);
}

async function askAi(userText, isAuto = false) {
    const item = state.currentItem; 
    if (!item) return;
    
    if (!isAuto) {
        aiMessages.push({ role: 'user', text: userText });
        renderAiMessages();
    }
    
    const sys = `You are a friendly, encouraging AI tutor for preschool children aged 3-6. The child is in the "${CONFIGS[item.type].title}" learning about "${item.letter}". Keep replies SHORT (2-4 sentences). Use simple words. Be enthusiastic. Use 1-2 emojis. No markdown or asterisks.`;
    const typingId = 't' + Date.now();
    
    aiMessages.push({ role: 'tutor', text: '...', id: typingId, isTyping: true });
    renderAiMessages();
    setAiStatus('Asking Gemma...');
    
    try {
        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: `${sys}\n\nQuestion: ${userText}`,
                stream: false,
                options: { temperature: 0.7, num_predict: 150 }
            })
        });
        
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const reply = data.response ? data.response.trim() : 'No response. Try again!';
        
        const idx = aiMessages.findIndex(m => m.id === typingId);
        if (idx >= 0) aiMessages[idx] = { role: 'tutor', text: reply };
        else aiMessages.push({ role: 'tutor', text: reply });
        
        setAiStatus(`✓ ${OLLAMA_MODEL} · ${data.eval_count || '?'} tokens`);
    } catch (err) {
        const msg = err.message.includes('fetch') 
            ? '⚠️ Ollama not running.\n\nRun: ollama serve\nThen: ollama pull gemma3' 
            : `⚠️ ${err.message}`;
            
        const idx = aiMessages.findIndex(m => m.id === typingId);
        if (idx >= 0) aiMessages[idx] = { role: 'tutor', text: msg, isError: true };
        else aiMessages.push({ role: 'tutor', text: msg, isError: true });
        
        setAiStatus('Connection failed — is Ollama running?');
    }
    renderAiMessages();
}

function renderAiMessages() {
    const c = document.getElementById('aiMessages'); 
    if (!c) return; 
    c.innerHTML = '';
    
    aiMessages.forEach(m => {
        const d = document.createElement('div');
        d.className = `ai-bubble ${m.role === 'user' ? 'user' : m.isError ? 'error' : 'tutor'}`;
        if (m.isTyping) d.innerHTML = `<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>`;
        else d.textContent = m.text;
        c.appendChild(d);
    });
    c.scrollTop = c.scrollHeight;
}

function setAiStatus(t) {
    const e = document.getElementById('aiStatus');
    if (e) e.textContent = t;
}

export async function generateRewardStory(userName, currentItem) {
    const prompt = `Write a 3-sentence children's adventure story for a 4-year-old named ${userName} about the letter/word "${currentItem.letter}". Make it magical, fun, and use simple words. No markdown or asterisks. Just plain text.`;

    try {
        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                options: { temperature: 0.8, num_predict: 200 }
            })
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        return data.response ? data.response.trim() : 'Once upon a time, there was a magical adventure waiting just for you!';
    } catch (err) {
        console.error('Story generation error:', err);
        return `Once upon a time, ${userName} discovered something amazing about "${currentItem.letter}"! It was the most wonderful discovery ever. And they lived happily ever after!`;
    }
}