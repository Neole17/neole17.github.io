export function createMenu(state, callbacks = {}) {
  function open() {
    if (state.menuOpen) return;
    state.menuOpen = true;
    state.targetProgress = 1;
    callbacks.onOpen?.();
  }

  function close() {
    if (!state.menuOpen) return;
    state.menuOpen = false;
    state.targetProgress = 0;
    callbacks.onClose?.();
  }

  function toggle() {
    state.menuOpen ? close() : open();
  }

  function navigateUp() {
    state.activeIdx = (state.activeIdx - 1 + state.count) % state.count;
    callbacks.onNavigate?.(state.activeIdx);
  }

  function navigateDown() {
    state.activeIdx = (state.activeIdx + 1) % state.count;
    callbacks.onNavigate?.(state.activeIdx);
  }

  return { open, close, toggle, navigateUp, navigateDown };
}
