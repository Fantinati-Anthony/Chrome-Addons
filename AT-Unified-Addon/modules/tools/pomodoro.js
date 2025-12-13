// Tool: Pomodoro Timer
// 25min work / 5min break timer

export function initPomodoro() {
  const display = document.getElementById('pomodoro-display');
  const workBtn = document.getElementById('btn-pomodoro-work');
  const breakBtn = document.getElementById('btn-pomodoro-break');
  const startBtn = document.getElementById('btn-pomodoro-start');
  const stopBtn = document.getElementById('btn-pomodoro-stop');
  const sessionsDiv = document.getElementById('pomodoro-sessions');

  let duration = 25 * 60;
  let remaining = duration;
  let timer = null;
  let isRunning = false;
  let sessions = 0;

  chrome.storage.local.get(['pomodoroSessions'], (data) => {
    sessions = data.pomodoroSessions || 0;
    updateSessionsDisplay();
  });

  function updateDisplay() {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function updateSessionsDisplay() {
    sessionsDiv.textContent = `Sessions completees: ${sessions}`;
  }

  workBtn.addEventListener('click', () => {
    duration = 25 * 60;
    remaining = duration;
    updateDisplay();
    display.classList.remove('break');
  });

  breakBtn.addEventListener('click', () => {
    duration = 5 * 60;
    remaining = duration;
    updateDisplay();
    display.classList.add('break');
  });

  startBtn.addEventListener('click', () => {
    if (isRunning) return;
    isRunning = true;

    timer = setInterval(() => {
      remaining--;
      updateDisplay();

      if (remaining <= 0) {
        clearInterval(timer);
        isRunning = false;

        if (duration === 25 * 60) {
          sessions++;
          chrome.storage.local.set({ pomodoroSessions: sessions });
          updateSessionsDisplay();
        }

        try {
          new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR8IF5/P5bqIQBIKPaHc87OQVxwJNpXV8MKkdTMRDUWb0vPDsZBmLhEPRZXO9ceypnlAGhBJl8710baxjGYwEg9IndLzxrGnfUIXDUmb0PPIta+LZC4RD0md0fPGsKd/QxcNSZzQ88izvotlLREPSp7R88Swp39DFw1JnM/zyLO+i2UtEQ9JndDzxLCnf0IXDQ==').play();
        } catch (e) {}

        remaining = duration;
        updateDisplay();
      }
    }, 1000);
  });

  stopBtn.addEventListener('click', () => {
    if (timer) {
      clearInterval(timer);
      isRunning = false;
    }
  });

  updateDisplay();
}
