/* MediCore HMS — dashboard AI assistant widget */
'use strict';

const Assistant = {
  history: [],
  isOpen: false,
  isSending: false,

  mount() {
    if (document.getElementById('assistant-widget')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="assistant-widget" class="assistant-widget">
        <section class="assistant-panel" id="assistant-panel" role="dialog" aria-modal="false" aria-labelledby="assistant-title" aria-hidden="true">
          <header class="assistant-header">
            <div class="assistant-heading">
              <div class="assistant-avatar" aria-hidden="true">✦</div>
              <div>
                <h2 id="assistant-title">Smart Health Assistant</h2>
                <p><span class="assistant-status-dot" id="assistant-status-dot"></span><span id="assistant-status">Checking AI availability…</span></p>
              </div>
            </div>
            <button class="assistant-icon-btn" id="assistant-close" type="button" aria-label="Close assistant">×</button>
          </header>
          <div class="assistant-notice">Ask general questions or get help using Smart Health. Don’t share patient, medical, payment, or other sensitive information.</div>
          <div class="assistant-messages" id="assistant-messages" role="log" aria-live="polite" aria-relevant="additions">
            <div class="assistant-message assistant-message-bot">
              <div class="assistant-message-label">Smart Health Assistant</div>
              <div class="assistant-message-text">Hi! Ask me a question about Smart Health or anything else. I can help with the app, and I’ll be clear when I don’t have enough information to answer.</div>
            </div>
          </div>
          <div class="assistant-suggestions" id="assistant-suggestions">
            <button type="button" class="assistant-suggestion">What can you help me with?</button>
            <button type="button" class="assistant-suggestion">How do I schedule an appointment?</button>
            <button type="button" class="assistant-suggestion">Can I ask a general question?</button>
          </div>
          <form class="assistant-form" id="assistant-form">
            <label class="sr-only" for="assistant-input">Message the assistant</label>
            <textarea id="assistant-input" rows="1" maxlength="1500" placeholder="Ask any question…" required></textarea>
            <button class="assistant-send" id="assistant-send" type="submit" aria-label="Send message">➤</button>
          </form>
          <div class="assistant-footer">AI answers can be inaccurate. Not for medical advice or clinical decisions.</div>
        </section>
        <button class="assistant-launcher" id="assistant-launcher" type="button" aria-label="Open Smart Health Assistant" aria-expanded="false">
          <span class="assistant-launcher-icon" aria-hidden="true">✦</span><span>Ask Smart Health</span>
        </button>
      </div>`);

    document.getElementById('assistant-launcher').addEventListener('click', () => this.toggle());
    document.getElementById('assistant-close').addEventListener('click', () => this.toggle(false));
    document.getElementById('assistant-form').addEventListener('submit', event => {
      event.preventDefault();
      const input = document.getElementById('assistant-input');
      const message = input.value.trim();
      if (!message || this.isSending) return;
      input.value = '';
      input.style.height = 'auto';
      this.send(message);
    });
    document.getElementById('assistant-input').addEventListener('input', event => {
      event.currentTarget.style.height = 'auto';
      event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 100)}px`;
    });
    document.querySelectorAll('.assistant-suggestion').forEach(button => {
      button.addEventListener('click', () => this.send(button.textContent));
    });
    this.checkAvailability();
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.isOpen) this.toggle(false);
    });
  },

  async checkAvailability() {
    const status = document.getElementById('assistant-status');
    const dot = document.getElementById('assistant-status-dot');
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error('Status unavailable');
      const result = await response.json();
      if (status) status.textContent = result.aiEnabled ? 'AI customer support · online' : 'Demo mode · AI not configured';
      if (dot) dot.classList.toggle('assistant-status-demo', !result.aiEnabled);
      this.aiEnabled = Boolean(result.aiEnabled);
    } catch (_) {
      if (status) status.textContent = 'Assistant server unavailable';
      if (dot) dot.classList.add('assistant-status-demo');
      this.aiEnabled = false;
    }
  },

  toggle(force) {
    this.isOpen = typeof force === 'boolean' ? force : !this.isOpen;
    const panel = document.getElementById('assistant-panel');
    const launcher = document.getElementById('assistant-launcher');
    if (!panel || !launcher) return;
    panel.classList.toggle('open', this.isOpen);
    panel.setAttribute('aria-hidden', String(!this.isOpen));
    launcher.setAttribute('aria-expanded', String(this.isOpen));
    launcher.setAttribute('aria-label', this.isOpen ? 'Close Smart Health Assistant' : 'Open Smart Health Assistant');
    if (this.isOpen) document.getElementById('assistant-input').focus();
  },

  addMessage(text, sender) {
    const list = document.getElementById('assistant-messages');
    const message = document.createElement('div');
    message.className = `assistant-message ${sender === 'user' ? 'assistant-message-user' : 'assistant-message-bot'}`;
    const label = document.createElement('div');
    label.className = 'assistant-message-label';
    label.textContent = sender === 'user' ? 'You' : 'Smart Health Assistant';
    const body = document.createElement('div');
    body.className = 'assistant-message-text';
    body.textContent = text;
    message.append(label, body);
    list.appendChild(message);
    list.scrollTop = list.scrollHeight;
    return message;
  },

  localReply(message) {
    const query = message.toLowerCase();
    if (/patient|register|admission/.test(query)) {
      return 'Open Patients from the sidebar and select “New Patient”. On the dashboard, “Add Patient” opens a quick registration form. Demo patient changes are stored in this browser.';
    }
    if (/appointment|schedule|booking/.test(query)) {
      return 'Open Appointments in the sidebar, choose “Schedule”, complete the patient, doctor, time, room, and visit type, then select “Schedule”.';
    }
    if (/doctor|staff/.test(query)) {
      return 'Open Doctors from the sidebar. Use “Add Doctor” to register a demo staff profile, or use the tabs and search field to find staff.';
    }
    if (/bill|invoice|payment/.test(query)) {
      return 'Open Billing from the sidebar. “New Invoice” creates a demo invoice; you can mark it paid, print it, or export the visible invoice list as CSV.';
    }
    if (/bed|ward|room/.test(query)) {
      return 'Open Wards & Beds to view availability. Select an available bed to assign it in the demo, or use “Add Bed” to expand the General Ward.';
    }
    if (/save|storage|persist|reload/.test(query)) {
      return 'Supported demo records are saved in this browser’s local storage, so they remain after reload on this device. Clearing browser data removes them. There is no production database.';
    }
    return 'I’m running in local demo mode because no AI service is configured. I can still help with patients, appointments, doctors, billing, wards, and how demo data is stored. For AI-generated answers, configure the server-side OPENAI_API_KEY and restart the app.';
  },

  async send(text) {
    if (this.isSending) return;
    this.addMessage(text, 'user');
    document.getElementById('assistant-suggestions').hidden = true;
    this.history.push({ role: 'user', content: text });
    const pending = this.addMessage('Thinking…', 'assistant');
    pending.classList.add('assistant-message-pending');
    this.isSending = true;
    document.getElementById('assistant-send').disabled = true;

    let responseText;
    let usedAIResponse = false;
    let usedDemoReply = false;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this.history.slice(-12) }),
      });
      const result = await response.json();
      if (response.ok && result.reply) {
        responseText = result.reply;
        usedAIResponse = true;
      } else if (response.ok && result.demoMode) {
        responseText = this.localReply(text);
        usedDemoReply = true;
      } else {
        throw new Error(result.error || 'Assistant request failed.');
      }
    } catch (_) {
      responseText = 'I couldn’t connect to the AI service just now. Please check that the Smart Health server is running and AI is configured, then try again.';
    }

    pending.querySelector('.assistant-message-text').textContent = responseText;
    pending.classList.remove('assistant-message-pending');
    if (usedAIResponse) this.history.push({ role: 'assistant', content: responseText });
    if (!usedAIResponse && !usedDemoReply) this.history.pop();
    this.isSending = false;
    document.getElementById('assistant-send').disabled = false;
    document.getElementById('assistant-input').focus();
    document.getElementById('assistant-messages').scrollTop = document.getElementById('assistant-messages').scrollHeight;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();
  if (page !== 'index.html' && page !== '') Assistant.mount();
});
