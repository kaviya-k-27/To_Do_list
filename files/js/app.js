/* ================================================================
   LEDGER — front-end logic
   Talks to /api/tasks.php for all data operations.
================================================================= */

const API_URL = 'api/tasks.php';

const els = {
  headerDate:   document.getElementById('headerDate'),
  statTotal:    document.getElementById('statTotal'),
  statActive:   document.getElementById('statActive'),
  statPending:  document.getElementById('statPending'),
  statCompleted:document.getElementById('statCompleted'),
  countActive:  document.getElementById('countActive'),
  countPending: document.getElementById('countPending'),
  countCompleted: document.getElementById('countCompleted'),
  listActive:   document.getElementById('listActive'),
  listPending:  document.getElementById('listPending'),
  listCompleted:document.getElementById('listCompleted'),
  form:         document.getElementById('taskForm'),
  formMsg:      document.getElementById('formMsg'),
  taskName:     document.getElementById('taskName'),
  taskDate:     document.getElementById('taskDate'),
  taskTime:     document.getElementById('taskTime'),
  rowTemplate:  document.getElementById('taskRowTemplate'),
};

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  renderHeaderDate();
  prefillDateTime();
  loadTasks();

  els.form.addEventListener('submit', handleCreateTask);
});

function renderHeaderDate() {
  const now = new Date();
  els.headerDate.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function prefillDateTime() {
  const now = new Date();
  els.taskDate.value = toDateInputValue(now);
  // round time to nearest 5 minutes for a nicer default
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  els.taskTime.value = `${hh}:${mm}`;
}

function toDateInputValue(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------
// Load + render tasks
// ---------------------------------------------------------------
async function loadTasks() {
  try {
    const res = await fetch(`${API_URL}?action=list`);
    const data = await res.json();

    if (!data.success) {
      showFormMessage(data.error || 'Failed to load tasks', 'error');
      return;
    }

    renderCounts(data.counts);
    renderList(els.listActive, data.active, 'active');
    renderList(els.listPending, data.pending, 'pending');
    renderList(els.listCompleted, data.completed, 'completed');

  } catch (err) {
    showFormMessage('Could not reach the server. Is the PHP backend running?', 'error');
  }
}

function renderCounts(counts) {
  els.statTotal.textContent = counts.total;
  els.statActive.textContent = counts.active;
  els.statPending.textContent = counts.pending;
  els.statCompleted.textContent = counts.completed;

  els.countActive.textContent = counts.active;
  els.countPending.textContent = counts.pending;
  els.countCompleted.textContent = counts.completed;
}

function renderList(container, tasks, kind) {
  container.innerHTML = '';

  if (!tasks || tasks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = emptyMessage(kind);
    container.appendChild(empty);
    return;
  }

  tasks.forEach(task => {
    const node = els.rowTemplate.content.cloneNode(true);
    const row = node.querySelector('.task-row');
    const nameEl = node.querySelector('.task-name');
    const metaEl = node.querySelector('.task-meta');
    const checkBtn = node.querySelector('.task-check');
    const deleteBtn = node.querySelector('.task-delete');

    nameEl.textContent = task.task_name;
    metaEl.innerHTML = buildMetaText(task, kind);

    row.dataset.id = task.id;

    if (kind === 'completed') {
      checkBtn.disabled = true;
      checkBtn.querySelector('svg').style.opacity = 1;
      checkBtn.style.color = 'inherit';
    } else {
      checkBtn.addEventListener('click', () => completeTask(task.id));
    }

    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    container.appendChild(node);
  });
}

function emptyMessage(kind) {
  if (kind === 'active') return 'No active tasks yet — add one above.';
  if (kind === 'pending') return 'Nothing overdue. Nicely done.';
  return 'Completed tasks will appear here.';
}

function buildMetaText(task, kind) {
  const dateLabel = formatDate(task.task_date);
  const timeLabel = formatTime(task.task_time);

  if (kind === 'completed') {
    const completedLabel = task.completed_at ? formatDateTime(task.completed_at) : '—';
    return `Scheduled ${dateLabel} · ${timeLabel} &nbsp;|&nbsp; Completed ${completedLabel}`;
  }

  if (kind === 'pending') {
    return `Originally created ${dateLabel} · ${timeLabel} &nbsp; <span class="overdue-tag">OVERDUE</span>`;
  }

  return `${dateLabel} · ${timeLabel}`;
}

function formatDate(dateStr) {
  // dateStr expected as YYYY-MM-DD
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr) {
  // timeStr expected as HH:MM:SS
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDateTime(dateTimeStr) {
  // dateTimeStr expected as YYYY-MM-DD HH:MM:SS
  const d = new Date(dateTimeStr.replace(' ', 'T'));
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

// ---------------------------------------------------------------
// Create task
// ---------------------------------------------------------------
async function handleCreateTask(e) {
  e.preventDefault();

  const payload = {
    action: 'create',
    task_name: els.taskName.value.trim(),
    task_date: els.taskDate.value,
    task_time: els.taskTime.value,
  };

  if (!payload.task_name || !payload.task_date || !payload.task_time) {
    showFormMessage('Please fill in task name, date and time.', 'error');
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!data.success) {
      showFormMessage(data.error || 'Could not add task.', 'error');
      return;
    }

    els.taskName.value = '';
    showFormMessage('Task added.', 'success');
    loadTasks();
  } catch (err) {

    console.log(err);

    showFormMessage(
       'Could not reach the server: ' + err.message,
       'error'
    );

}
}

// ---------------------------------------------------------------
// Complete task
// ---------------------------------------------------------------
async function completeTask(id) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', id }),
    });
    const data = await res.json();

    if (!data.success) {
      showFormMessage(data.error || 'Could not complete task.', 'error');
      return;
    }
    loadTasks();
  } catch (err) {
    showFormMessage('Could not reach the server.', 'error');
  }
}

// ---------------------------------------------------------------
// Delete task
// ---------------------------------------------------------------
async function deleteTask(id) {
  if (!confirm('Delete this task permanently?')) return;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    const data = await res.json();

    if (!data.success) {
      showFormMessage(data.error || 'Could not delete task.', 'error');
      return;
    }
    loadTasks();
  } catch (err) {
    showFormMessage('Could not reach the server.', 'error');
  }
}

// ---------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------
function showFormMessage(msg, type) {
  els.formMsg.textContent = msg;
  els.formMsg.className = `form-msg ${type}`;
  if (type === 'success') {
    setTimeout(() => {
      els.formMsg.textContent = '';
      els.formMsg.className = 'form-msg';
    }, 2500);
  }
}
