import { Window } from 'happy-dom';
import fs from 'fs';
import vm from 'vm';

const html = fs.readFileSync('/dev-server/public/discovery.html', 'utf-8');
const window = new Window({ url: 'http://localhost:3000/discovery.html' });
const document = window.document;

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

context.addCard({ type: 'prompt', text: 'Who are our primary users?', category: 'Audience', x: 200, y: 200 });

const card = document.querySelector('.card');
if (!card) {
  console.error('No card rendered');
  process.exit(1);
}

console.log('Card classes:', card.className);
console.log('Card text:', card.textContent.slice(0, 120));
console.log('Has prompt-tag:', !!card.querySelector('.prompt-tag'));
console.log('Has prompt-text:', !!card.querySelector('.prompt-text'));
console.log('Has resize-handle:', !!card.querySelector('.resize-handle'));

// Verify it's prompt, not sticky
if (!card.classList.contains('prompt')) {
  console.error('FAIL: card is not prompt type');
  process.exit(1);
}
if (card.classList.contains('sticky')) {
  console.error('FAIL: card is sticky');
  process.exit(1);
}

console.log('PASS: prompt card rendered correctly');
