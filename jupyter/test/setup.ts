if (globalThis.DragEvent == null) {
  globalThis.DragEvent = class DragEvent extends MouseEvent {} as typeof DragEvent
}
