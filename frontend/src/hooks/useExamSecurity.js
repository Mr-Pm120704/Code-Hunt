import { useEffect } from 'react';

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

function isBlockedShortcut(e) {
  const key = getKey(e);
  const mac = isMacPlatform();
  const mod = mac ? e.metaKey : e.ctrlKey;

  if (key === 'f12') return true;
  if (e.ctrlKey && e.shiftKey && ['i', 'j'].includes(key)) return true;
  if (mac && e.metaKey && e.altKey && key === 'i') return true;

  return mod && ['c', 'v', 'x', 'z', 'y', 'a', 'p', 's', 't', 'n', 'w', 'u'].includes(key);
}

export default function useExamSecurity({ enabled, onViolation }) {
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

    const blockKeyboard = (e) => {
      if (!isBlockedShortcut(e)) return;
      e.preventDefault();
      e.stopPropagation();
      report(`shortcut:${getKey(e)}`);
    };

    const blockClipboard = (e) => {
      e.preventDefault();
      e.stopPropagation();
      report(e.type);
    };

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

    const blockDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      report('drop');
    };

    const blockContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      report('contextmenu');
    };

    const blockSelection = (e) => {
      if (isEditableField(e.target)) return;
      e.preventDefault();
      report('selectstart');
    };

    const onTouchStart = () => {
      // Keeps long-press menus from appearing on mobile when combined with user-select/touch-callout CSS.
    };

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
    };
  }, [enabled, onViolation]);
}
