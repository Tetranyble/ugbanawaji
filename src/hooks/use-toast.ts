"use client";

import * as React from "react";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 800;

export type ToastVariant = "default" | "destructive" | "success" | "info";

export type ToastItem = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  open?: boolean;
};

type State = { toasts: ToastItem[] };
type Listener = (state: State) => void;

let memoryState: State = { toasts: [] };
const listeners = new Set<Listener>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit(next: State) {
  memoryState = next;
  listeners.forEach((listener) => listener(memoryState));
}

function removeToast(id: string) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  emit({ toasts: memoryState.toasts.filter((item) => item.id !== id) });
}

function scheduleRemoval(id: string, delay = TOAST_REMOVE_DELAY) {
  if (timers.has(id)) return;
  timers.set(id, setTimeout(() => removeToast(id), delay));
}

export function dismiss(id?: string) {
  if (id) {
    const activeTimer = timers.get(id);
    if (activeTimer) clearTimeout(activeTimer);
    timers.delete(id);
    emit({ toasts: memoryState.toasts.map((item) => item.id === id ? { ...item, open: false } : item) });
    scheduleRemoval(id);
    return;
  }
  const ids = memoryState.toasts.map((item) => item.id);
  for (const toastId of ids) {
    const activeTimer = timers.get(toastId);
    if (activeTimer) clearTimeout(activeTimer);
    timers.delete(toastId);
  }
  emit({ toasts: memoryState.toasts.map((item) => ({ ...item, open: false })) });
  ids.forEach((toastId) => scheduleRemoval(toastId));
}

function createToast(input: Omit<ToastItem, "id" | "open">) {
  const id = crypto.randomUUID();
  const item: ToastItem = { ...input, id, open: true };
  emit({ toasts: [item, ...memoryState.toasts].slice(0, TOAST_LIMIT) });
  const duration = input.duration ?? 4600;
  if (duration > 0) {
    timers.set(id, setTimeout(() => {
      emit({ toasts: memoryState.toasts.map((current) => current.id === id ? { ...current, open: false } : current) });
      timers.delete(id);
      scheduleRemoval(id);
    }, duration));
  }
  return { id, dismiss: () => dismiss(id) };
}

type ToastApi = typeof createToast & {
  success: (title: React.ReactNode, options?: { description?: React.ReactNode; duration?: number }) => ReturnType<typeof createToast>;
  error: (title: React.ReactNode, options?: { description?: React.ReactNode; duration?: number }) => ReturnType<typeof createToast>;
  info: (title: React.ReactNode, options?: { description?: React.ReactNode; duration?: number }) => ReturnType<typeof createToast>;
};

export const toast = Object.assign(createToast, {
  success: (title: React.ReactNode, options?: { description?: React.ReactNode; duration?: number }) => createToast({ title, ...options, variant: "success" }),
  error: (title: React.ReactNode, options?: { description?: React.ReactNode; duration?: number }) => createToast({ title, ...options, variant: "destructive" }),
  info: (title: React.ReactNode, options?: { description?: React.ReactNode; duration?: number }) => createToast({ title, ...options, variant: "info" }),
}) as ToastApi;

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.add(setState);
    return () => { listeners.delete(setState); };
  }, []);

  return { ...state, toast, dismiss };
}
