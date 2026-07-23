// Collaboration UI: join/create modal, presence pills, connection status
import { $ } from './utils.js';
import { escapeHtml } from './utils.js';
import {
  createRoom, joinRoom, disconnect, getPeers, getRoomCode,
  isConnected, getNickname, isValidRoomCode,
  setOnPeersChange, setOnConnectionStatusChange, syncLocalChange,
  tryAutoReconnect,
} from './collab.js';

// ============ Render presence pills ============
function renderPresencePills(peers) {
  const container = $('#presencePills');
  if (!container) return;

  if (!peers.length || !isConnected()) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  const html = peers.map(p => {
    const initials = (p.nickname || '?').slice(0, 2).toUpperCase();
    const cls = p.isLocal ? 'presence-pill local' : 'presence-pill';
    const title = p.isLocal ? `${p.nickname} (you)` : p.nickname;
    return `<span class="${cls}" title="${escapeHtml(title)}" style="--pill-color:${p.color}">
      <span class="pill-avatar">${escapeHtml(initials)}</span>
      <span class="pill-name">${escapeHtml(p.nickname)}${p.isLocal ? ' (you)' : ''}</span>
    </span>`;
  }).join('');

  container.innerHTML = html;
}

// ============ Update connection status badge ============
function updateStatusBadge(connected) {
  const badge = $('#collabStatus');
  if (!badge) return;

  if (!isConnected()) {
    badge.style.display = 'none';
    return;
  }

  badge.style.display = 'inline-flex';
  badge.classList.toggle('connected', connected);
  badge.classList.toggle('disconnected', !connected);
  badge.title = connected ? `Connected — Room: ${getRoomCode()}` : 'Reconnecting…';
}

// ============ Show/hide room code display ============
function updateRoomCodeDisplay() {
  const el = $('#roomCodeDisplay');
  if (!el) return;

  if (isConnected()) {
    el.style.display = 'inline-flex';
    el.querySelector('.room-code-value').textContent = getRoomCode();
  } else {
    el.style.display = 'none';
  }
}

// ============ Join/Create Modal ============
function openCollabModal() {
  const modal = $('#collabModal');
  if (!modal) return;

  // Reset form
  $('#collabNickname').value = localStorage.getItem('collab-nickname') || '';
  $('#collabCode').value = '';
  $('#collabError').textContent = '';
  $('#collabError').style.display = 'none';

  // Show correct state
  if (isConnected()) {
    $('#collabJoinSection').style.display = 'none';
    $('#collabActiveSection').style.display = 'block';
    $('#collabActiveCode').textContent = getRoomCode();
    $('#collabActiveNick').textContent = getNickname();
    $('#collabActivePeers').textContent = getPeers().length + ' connected';
  } else {
    $('#collabJoinSection').style.display = 'block';
    $('#collabActiveSection').style.display = 'none';
  }

  modal.classList.add('open');
}

function closeCollabModal() {
  $('#collabModal').classList.remove('open');
}

function showError(msg) {
  const el = $('#collabError');
  el.textContent = msg;
  el.style.display = 'block';
}

function handleCreate() {
  const nickname = $('#collabNickname').value.trim();
  if (!nickname) { showError('Please enter a nickname.'); return; }

  try {
    localStorage.setItem('collab-nickname', nickname);
    const code = createRoom(nickname);
    closeCollabModal();
    updateRoomCodeDisplay();
    updateStatusBadge(true);
  } catch (e) {
    showError(e.message);
  }
}

function handleJoin() {
  const nickname = $('#collabNickname').value.trim();
  const code = $('#collabCode').value.trim();

  if (!nickname) { showError('Please enter a nickname.'); return; }
  if (!code) { showError('Please enter a room code.'); return; }
  if (!isValidRoomCode(code)) { showError('Invalid room code. Must be 6 characters.'); return; }

  try {
    localStorage.setItem('collab-nickname', nickname);
    joinRoom(code, nickname);
    closeCollabModal();
    updateRoomCodeDisplay();
    updateStatusBadge(true);
  } catch (e) {
    showError(e.message);
  }
}

function handleDisconnect() {
  disconnect();
  closeCollabModal();
  updateRoomCodeDisplay();
  updateStatusBadge(false);
  renderPresencePills([]);
}

function handleCopyCode() {
  const code = getRoomCode();
  if (code) {
    navigator.clipboard.writeText(code).then(() => {
      const btn = $('#collabCopyBtn');
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = orig, 1500);
    });
  }
}

// ============ Init ============
export function initCollabUI() {
  // Set up callbacks
  setOnPeersChange(renderPresencePills);
  setOnConnectionStatusChange(updateStatusBadge);

  // Modal events
  $('#btnCollab')?.addEventListener('click', openCollabModal);
  $('#collabClose')?.addEventListener('click', closeCollabModal);
  $('#collabModal')?.addEventListener('click', e => { if (e.target.id === 'collabModal') closeCollabModal(); });
  $('#collabCreateBtn')?.addEventListener('click', handleCreate);
  $('#collabJoinBtn')?.addEventListener('click', handleJoin);
  $('#collabDisconnectBtn')?.addEventListener('click', handleDisconnect);
  $('#collabCopyBtn')?.addEventListener('click', handleCopyCode);

  // Room code display copy on click
  $('#roomCodeDisplay')?.addEventListener('click', () => {
    const code = getRoomCode();
    if (code) navigator.clipboard.writeText(code);
  });

  // Enter key in code input
  $('#collabCode')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleJoin();
  });

  // Try auto-reconnect from previous session
  const reconnected = tryAutoReconnect();
  if (reconnected) {
    updateRoomCodeDisplay();
    setTimeout(() => updateStatusBadge(true), 500);
  }
}

// ============ Sync hook ============
// Call this from save() to push changes to peers
export { syncLocalChange };
