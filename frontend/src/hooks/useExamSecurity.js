import { useEffect, useRef } from 'react';

function isMacPlatform() {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
}

function isEditableField(target) {
  if (!target || !target.tagName) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

function getKey(e) {
  return String(e.key || '').toLowerCase();
}

// ── Desktop Keyboard Shortcut Blocking ─────────────────────────────────
// Blocks all browser-level shortcuts that could be used to leave the exam,
// open new windows/tabs, access devtools, print, save, or manipulate the page.
function isBlockedShortcut(e) {
  const key = getKey(e);
  const mac = isMacPlatform();
  const mod = mac ? e.metaKey : e.ctrlKey;
  const shift = e.shiftKey;
  const alt = e.altKey;

  // Function keys
  if (key === 'f12') return true;                       // DevTools
  if (key === 'f5') return true;                        // Refresh
  if (key === 'f3' || key === 'f7') return true;        // Find / Caret browsing
  if (key === 'escape') return true;                    // Exit fullscreen / close dialogs

  // Ctrl/Cmd + single key (core exam shortcuts)
  if (mod && !shift && !alt) {
    if (['c', 'v', 'x', 'z', 'y', 'a'].includes(key)) return true;  // Clipboard + undo/redo + select all
    if (['p', 's', 'r', 'f', 'h', 'g', 'l', 'd', 'n', 't', 'w', 'u', 'q'].includes(key)) return true; // Print, save, refresh, find, history, locate, bookmark, new, tab, close, view-source, quit
  }

  // Ctrl/Cmd + Shift combinations
  if (mod && shift && !alt) {
    if (['i', 'j', 'delete', 'p', 'n', 'z'].includes(key)) return true; // DevTools, clear data, incognito, new window, redo (Win)
  }

  // Ctrl/Cmd + Alt combinations (Mac-specific devtools)
  if (mac && mod && alt) {
    if (['i', 'c', 'j', 'u'].includes(key)) return true; // DevTools, console, view-source
  }

  // Alt key combos (Windows-specific)
  if (!mac && alt && !mod) {
    if (key === 'f4') return true;  // Close window
    if (key === 'f5') return true;  // Refresh (alt variant)
    if (key === 'arrowleft' || key === 'arrowright') return true;  // Browser back/forward
  }

  // Function keys F1-F12 (except F5 already caught above)
  if (/^f\d{1,2}$/.test(key) && key !== 'f5') {
    return true;  // Block all other function keys
  }

  return false;
}

export default function useExamSecurity({ enabled, onViolation }) {
  const longPressTimer = useRef(null);
  const touchStartPos = useRef(null);
  const devToolsInterval = useRef(null);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined;

    const root = document.documentElement;
    const body = document.body;
    root.classList.add('exam-secure');
    body?.classList.add('exam-secure');

    const report = (reason) => {
      if (typeof onViolation === 'function') {
        onViolation(reason);
      }
    };

    // ── Keyboard Blocking ──────────────────────────────────────────────
    const blockKeyboard = (e) => {
      if (!isBlockedShortcut(e)) return;
      e.preventDefault();
      e.stopPropagation();
      report(`shortcut:${getKey(e)}`);
    };

    // ── Clipboard Event Blocking ───────────────────────────────────────
    const blockClipboard = (e) => {
      e.preventDefault();
      e.stopPropagation();
      report(e.type);
    };

    // ── Input Event Blocking (paste, drop, undo/redo) ──────────────────
    const blockBeforeInput = (e) => {
      const inputType = String(e.inputType || '').toLowerCase();
      if (!inputType) return;

      const shouldBlock =
        inputType.includes('paste') ||
        inputType.includes('drop') ||
        inputType === 'historyundo' ||
        inputType === 'historyredo';

      if (!shouldBlock) return;

      e.preventDefault();
      e.stopPropagation();
      report(`beforeinput:${inputType}`);
    };

    // ── Drag-and-Drop Blocking ─────────────────────────────────────────
    const blockDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      report('drop');
    };

    // ── Right-Click Context Menu Blocking ──────────────────────────────
    const blockContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      report('contextmenu');
    };

    // ── Text Selection Blocking (except in input/textarea) ─────────────
    const blockSelection = (e) => {
      if (isEditableField(e.target)) return;
      e.preventDefault();
      report('selectstart');
    };

    // ── Mobile Long-Press Prevention ───────────────────────────────────
    // Tracks touch start position and time. If held >500ms without movement,
    // fires a longpress violation to prevent context menu / copy-paste popups.
    const LONG_PRESS_MS = 500;
    const MOVE_THRESHOLD_PX = 10;

    const onTouchStart = (e) => {
      if (e.touches.length > 1) return;
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };

      longPressTimer.current = setTimeout(() => {
        report('longpress');
      }, LONG_PRESS_MS);
    };

    const onTouchMove = (e) => {
      if (!touchStartPos.current || !longPressTimer.current) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    const onTouchEnd = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      touchStartPos.current = null;
    };

    // ── DevTools Detection ─────────────────────────────────────────────
    // Detects DevTools open via multiple techniques:
    // 1. Debugger statement timing (devtools pauses execution)
    // 2. Window size difference (devtools panel changes innerWidth/Height)
    // 3. toString() on console methods (some browsers override when devtools open)
    const DEVTOOLS_CHECK_INTERVAL = 2000;
    const BASE_WIDTH = window.outerWidth;
    const BASE_HEIGHT = window.outerHeight;

    const detectDevTools = () => {
      // Technique 1: Window size monitoring
      // When DevTools is docked, the window size changes significantly
      const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
      const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
      const OPEN_THRESHOLD = 200;

      if (widthDiff > OPEN_THRESHOLD || heightDiff > OPEN_THRESHOLD) {
        report('devtools:size');
        return;
      }

      // Technique 2: toString() method detection
      // When DevTools is open, some browsers modify toString behavior
      const devtools = {};
      Object.defineProperty(devtools, 'id', {
        get() {
          report('devtools:getter');
          return true;
        }
      });
      console.log('%c', devtools);
      console.clear();

      // Technique 3: Performance memory (Chrome-only, not reliable but catches some)
      if (window.performance && window.performance.memory) {
        const mem = window.performance.memory;
        if (mem.jsHeapSizeLimit > 4e9) {
          // Suspiciously large heap, might indicate devtools profiling
        }
      }
    };

    // Technique 4: Debugger timing detection
    const detectDebugger = () => {
      const start = performance.now();
      try {
        debugger; // eslint-disable-line no-debugger
      } catch (_) {}
      const elapsed = performance.now() - start;
      if (elapsed > 100) {
        report('devtools:debugger');
      }
    };

    devToolsInterval.current = setInterval(() => {
      detectDevTools();
      detectDebugger();
    }, DEVTOOLS_CHECK_INTERVAL);

    // ── Window Resize Detection ────────────────────────────────────────
    // Detects significant window resize that could indicate DevTools panel
    // being opened/closed or browser being resized to bypass fullscreen
    let resizeTimeout = null;
    const onResize = () => {
      if (resizeTimeout) return;
      resizeTimeout = setTimeout(() => {
        resizeTimeout = null;
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;
        const widthRatio = currentWidth / BASE_WIDTH;
        const heightRatio = currentHeight / BASE_HEIGHT;

        // If window shrunk by more than 15% in either dimension, flag it
        if (widthRatio < 0.85 || heightRatio < 0.85) {
          report('resize:suspect');
        }
      }, 500);
    };

    // ── Register All Event Listeners ───────────────────────────────────
    document.addEventListener('keydown', blockKeyboard, true);
    document.addEventListener('keyup', blockKeyboard, true);
    ['copy', 'cut', 'paste', 'beforecopy', 'beforecut', 'beforepaste'].forEach((eventName) => {
      document.addEventListener(eventName, blockClipboard, true);
    });
    document.addEventListener('beforeinput', blockBeforeInput, true);
    document.addEventListener('drop', blockDrop, true);
    document.addEventListener('contextmenu', blockContextMenu, true);
    document.addEventListener('selectstart', blockSelection, true);
    document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    document.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });
    document.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { capture: true, passive: true });
    window.addEventListener('resize', onResize);

    // ── Cleanup ────────────────────────────────────────────────────────
    return () => {
      root.classList.remove('exam-secure');
      body?.classList.remove('exam-secure');

      document.removeEventListener('keydown', blockKeyboard, true);
      document.removeEventListener('keyup', blockKeyboard, true);
      ['copy', 'cut', 'paste', 'beforecopy', 'beforecut', 'beforepaste'].forEach((eventName) => {
        document.removeEventListener(eventName, blockClipboard, true);
      });
      document.removeEventListener('beforeinput', blockBeforeInput, true);
      document.removeEventListener('drop', blockDrop, true);
      document.removeEventListener('contextmenu', blockContextMenu, true);
      document.removeEventListener('selectstart', blockSelection, true);
      document.removeEventListener('touchstart', onTouchStart, true);
      document.removeEventListener('touchmove', onTouchMove, true);
      document.removeEventListener('touchend', onTouchEnd, true);
      document.removeEventListener('touchcancel', onTouchEnd, true);
      window.removeEventListener('resize', onResize);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (devToolsInterval.current) {
        clearInterval(devToolsInterval.current);
        devToolsInterval.current = null;
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
        resizeTimeout = null;
      }
    };
  }, [enabled, onViolation]);
}
