import { Window } from 'happy-dom';
import fs from 'fs';
import vm from 'vm';

const html = fs.readFileSync('/dev-server/public/discovery.html', 'utf-8');
const window = new Window({ url: 'http://localhost:3000/discovery.html' });
const document = window.document;

// Clear any localStorage state from previous runs
window.localStorage.clear();

// Polyfill missing APIs
window.document.execCommand = () => {};
window.getSelection = () => ({
  selectAllChildren: () => {},
  removeAllRanges: () => {}
});

// Set document HTML
document.documentElement.innerHTML = html;

// Execute inline scripts in window context
const scripts = Array.from(document.querySelectorAll('script')).filter(s => !s.src);
const context = vm.createContext(window);
for (const script of scripts) {
  try {
    vm.runInContext(script.textContent, context, { timeout: 1000 });
  } catch (e) {
    console.error('Script error:', e.message);
    process.exit(1);
  }
}

// Test adding a prompt card
if (typeof context.addCard !== 'function') {
  console.error('addCard not available in context');
  process.exit(1);
}

const before = document.querySelectorAll('.card').length;
context.addCard({ type: 'prompt', text: 'Who are our primary users?', category: 'Audience', x: 200, y: 200 });
const after = document.querySelectorAll('.card').length;

// Get the last card (the one we just added)
const cards = document.querySelectorAll('.card');
const card = cards[cards.length - 1];

console.log('Cards before:', before);
console.log('Cards after:', after);
console.log('Card classes:', card ? card.className : 'none');
console.log('Card text:', card ? card.textContent.slice(0, 120) : 'none');
console.log('Has prompt-tag:', card ? !!card.querySelector('.prompt-tag') : false);
console.log('Has prompt-text:', card ? !!card.querySelector('.prompt-text') : false);
console.log('Has resize-handle:', card ? !!card.querySelector('.resize-handle') : false);

if (!card) {
  console.error('FAIL: no card rendered');
  process.exit(1);
}
if (!card.classList.contains('prompt')) {
  console.error('FAIL: card is not prompt type');
  process.exit(1);
}
if (card.classList.contains('sticky')) {
  console.error('FAIL: card is sticky');
  process.exit(1);
}

console.log('PASS: prompt card rendered correctly');
