// Collaboration UI: join/create modal, presence pills, connection status
import { $ } from './utils.js';
import { escapeHtml } from './utils.js';
import {
  createRoom, joinRoom, getPeers, getRoomCode,
  isConnected, getNickname, isValidRoomCode,
  setOnPeersChange, setOnConnectionStatusChange, syncLocalChange,
  tryAutoReconnect, deleteRoomAndDisconnect,
} from './collab.js';
import { runExport } from './export.js';

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
  const active = isConnected();
  $('#collabJoinSection').style.display = active ? 'none' : 'block';
  $('#collabActiveSection').style.display = active ? 'block' : 'none';
  $('#collabCreateBtn').style.display = active ? 'none' : '';
  $('#collabJoinBtn').style.display = active ? 'none' : '';
  $('#collabCopyBtn').style.display = active ? '' : 'none';
  $('#collabEndSessionBtn').style.display = active ? '' : 'none';
  if (active) {
    $('#collabActiveCode').textContent = getRoomCode();
    $('#collabActiveNick').textContent = getNickname();
    $('#collabActivePeers').textContent = getPeers().length + ' connected';
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

function handleEndSession() {
  closeCollabModal();
  openEndSessionModal();
}

function openEndSessionModal() {
  const modal = $('#endSessionModal');
  if (!modal) return;
  modal.classList.add('open');
}

function closeEndSessionModal() {
  const modal = $('#endSessionModal');
  if (modal) modal.classList.remove('open');
}

async function handleEndSessionConfirm() {
  const btn = $('#endSessionConfirm');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Cleaning up…';
  }

  await deleteRoomAndDisconnect();

  closeEndSessionModal();
  updateRoomCodeDisplay();
  updateStatusBadge(false);
  renderPresencePills([]);

  if (btn) {
    btn.disabled = false;
    btn.textContent = '🗑️ Delete & Disconnect';
  }
}

async function handleEndSessionExport(kind) {
  try {
    await runExport(kind);
  } catch (e) {
    console.error('[collab-ui] Export failed:', e);
  }
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
  $('#collabEndSessionBtn')?.addEventListener('click', handleEndSession);
  $('#collabCopyBtn')?.addEventListener('click', handleCopyCode);

  // End session modal events
  $('#endSessionCancel')?.addEventListener('click', closeEndSessionModal);
  $('#endSessionModal')?.addEventListener('click', e => { if (e.target.id === 'endSessionModal') closeEndSessionModal(); });
  $('#endSessionConfirm')?.addEventListener('click', handleEndSessionConfirm);
  $('#endSessionExportJSON')?.addEventListener('click', () => handleEndSessionExport('json'));
  $('#endSessionExportPNG')?.addEventListener('click', () => handleEndSessionExport('png'));
  $('#endSessionExportPDF')?.addEventListener('click', () => handleEndSessionExport('pdf'));
  $('#endSessionExportDOCX')?.addEventListener('click', () => handleEndSessionExport('docx'));

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
