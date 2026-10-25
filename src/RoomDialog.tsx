import { useEffect, useRef, type ReactNode } from 'react';

export default function RoomDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    const scroll = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = scroll; previous?.focus(); };
  }, []);
  useEffect(() => { dialog.current?.querySelector<HTMLButtonElement>('button')?.focus(); }, [title]);
  return <dialog ref={dialog} className="room-dialog" aria-label={title}
    onCancel={event => { event.preventDefault(); close.current(); }}
    onClick={event => { if (event.target === event.currentTarget) {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close.current();
    } }}>
    <div className="room-dialog-head"><h2>{title}</h2><button autoFocus onClick={onClose} aria-label="Close room panel">✕</button></div>
    <div className="room-dialog-content" key={title}>{children}</div>
    <div className="room-dialog-foot">Your room, your pace. <span>Esc to return</span></div>
  </dialog>;
}
