// ==========================================================
// UNIVERSAL DESKTOP LYRICS — LIVE INTERACTIVE SIMULATOR
// ==========================================================

const SAMPLE_LYRICS = [
  "There's a fire starting in my heart",
  "Reaching a fever pitch, it's bringing me out the dark",
  "Finally I can see you crystal clear",
  "Go 'head and sell me out and I'll lay your ship bare",
  "See how I'll leave with every piece of you",
  "Don't underestimate the things that I will do",
  "There's a fire starting in my heart",
  "The scars of your love remind me of us",
  "They keep me thinking that we almost had it all",
  "Rolling in the deep... ♪"
];

let currentLineIndex = 0;
let isPlaying = true;
let syncInterval = null;

// DOM Elements
const islandSimText = document.getElementById('islandSimText');
const islandSimPill = document.getElementById('islandSimPill');
const simPlayPauseBtn = document.getElementById('simPlayPauseBtn');
const simModeToggleBtn = document.getElementById('simModeToggleBtn');
const simTabs = document.querySelectorAll('.sim-tab');
const simViews = {
  island: document.getElementById('viewIsland'),
  widget: document.getElementById('viewWidget'),
  canvas: document.getElementById('viewCanvas'),
  compact: document.getElementById('viewCompact')
};
const widgetActiveLine = document.getElementById('widgetActiveLine');
const canvasLinesContainer = document.getElementById('canvasLines');
const compactText = document.querySelector('.sim-compact-text');

// Function to update the lyric state across all simulated components
function updateLyricDisplay(index) {
  const text = SAMPLE_LYRICS[index];

  // 1. Dynamic Island
  if (islandSimText) {
    islandSimText.style.opacity = '0';
    setTimeout(() => {
      islandSimText.textContent = text;
      islandSimText.style.opacity = '1';
    }, 150);
  }

  // 2. Widget View
  if (widgetActiveLine) {
    widgetActiveLine.textContent = text;
  }

  // 3. Canvas View
  if (canvasLinesContainer) {
    const lines = canvasLinesContainer.children;
    for (let i = 0; i < lines.length; i++) {
      lines[i].className = 'sim-lyric-line';
      if (i < 2) {
        lines[i].classList.add('past');
      } else if (i === 2) {
        lines[i].classList.add('active', 'glow');
        lines[i].textContent = text;
      } else {
        lines[i].classList.add('future');
      }
    }
  }

  // 4. Compact Bar
  if (compactText) {
    compactText.textContent = text;
  }
}

// Timer loop for simulation
function startSyncLoop() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    if (!isPlaying) return;
    currentLineIndex = (currentLineIndex + 1) % SAMPLE_LYRICS.length;
    updateLyricDisplay(currentLineIndex);
  }, 3200);
}

// Play / Pause Simulation
function togglePlayback() {
  isPlaying = !isPlaying;
  const icon = isPlaying ? '⏸' : '▶';
  if (simPlayPauseBtn) simPlayPauseBtn.textContent = icon;
  const compactPlay = document.querySelector('.sim-compact-play');
  if (compactPlay) compactPlay.textContent = icon;
}

if (simPlayPauseBtn) {
  simPlayPauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayback();
  });
}

// Mode Switcher Handler
function switchSimulatorMode(mode) {
  // Update Tab buttons
  simTabs.forEach((tab) => {
    if (tab.dataset.mode === mode) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Switch View Visibility
  Object.keys(simViews).forEach((key) => {
    if (key === mode) {
      simViews[key].classList.remove('hidden');
      simViews[key].classList.add('active');
    } else {
      simViews[key].classList.add('hidden');
      simViews[key].classList.remove('active');
    }
  });
}

// Tab Click Listeners
simTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    switchSimulatorMode(tab.dataset.mode);
  });
});

// Mode Toggle Button on Island cycles modes
const modesOrder = ['island', 'widget', 'canvas', 'compact'];
let currentModeIndex = 0;
if (simModeToggleBtn) {
  simModeToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentModeIndex = (currentModeIndex + 1) % modesOrder.length;
    switchSimulatorMode(modesOrder[currentModeIndex]);
  });
}

// Click on Island Pill snaps with a bounce animation
if (islandSimPill) {
  islandSimPill.addEventListener('click', () => {
    islandSimPill.style.transform = 'scale(0.97)';
    setTimeout(() => {
      islandSimPill.style.transform = 'scale(1.02)';
      setTimeout(() => {
        islandSimPill.style.transform = 'scale(1)';
      }, 150);
    }, 100);
  });
}

// Navbar shadow on scroll
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  if (window.scrollY > 20) {
    navbar.style.background = 'rgba(7, 9, 14, 0.9)';
    navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
  } else {
    navbar.style.background = 'rgba(7, 9, 14, 0.65)';
    navbar.style.boxShadow = 'none';
  }
});

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  updateLyricDisplay(0);
  startSyncLoop();
});
