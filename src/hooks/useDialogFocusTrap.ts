import { useEffect, RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]):not([aria-hidden="true"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Trap Tab/Shift+Tab keyboard focus within an active aria-modal dialog container. */
export function useDialogFocusTrap(
  dialogRef: RefObject<HTMLElement | null>,
  active: boolean,
  options?: { restoreFocus?: boolean; onEscape?: () => void }
): void {
  const restoreFocus = options?.restoreFocus ?? false;
  const onEscape = options?.onEscape;

  useEffect(() => {
    if (!active) return;
    const previousFocus = restoreFocus ? (document.activeElement as HTMLElement | null) : null;
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length === 0) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === dialogRef.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last || !dialogRef.current.contains(document.activeElement))
      ) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (restoreFocus) {
        previousFocus?.focus?.();
      }
    };
  }, [dialogRef, active, restoreFocus, onEscape]);
}
