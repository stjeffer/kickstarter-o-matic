// Utility functions

export const $ = s => document.querySelector(s);

export function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export function uid() {
  return 'k' + Date.now() + Math.random().toString(36).slice(2, 6);
}

export function svgTag(inner) {
  return `<svg width="36" height="30" viewBox="0 0 36 30">${inner}</svg>`;
}

export function isEditing() {
  return document.activeElement && (
    document.activeElement.isContentEditable ||
    ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)
  );
}
