import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Dialog({ children, label, labelledBy, onClose, drawer = false, wide = false }) {
    const panel = useRef(null);
    const close = useRef(onClose);
    useEffect(() => { close.current = onClose; }, [onClose]);
    useEffect(() => {
        const trigger = document.activeElement;
        const root = document.getElementById('root');
        const previousInert = root.inert;
        const previousOverflow = document.body.style.overflow;
        root.inert = true;
        document.body.style.overflow = 'hidden';
        const focusables = () => [...panel.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(el => el.getClientRects().length);
        (panel.current.querySelector('[data-autofocus]') || focusables()[0] || panel.current).focus();
        const onKey = event => {
            if (event.key === 'Escape') { event.preventDefault(); close.current(); }
            if (event.key === 'Tab') {
                const items = focusables();
                const first = items[0];
                const last = items[items.length - 1];
                if (!first) { event.preventDefault(); panel.current.focus(); }
                else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus(); }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            root.inert = previousInert;
            document.body.style.overflow = previousOverflow;
            if (trigger?.isConnected) trigger.focus();
        };
    }, []);
    return createPortal(<div className={`dialog-backdrop ${drawer ? 'drawer-backdrop' : ''}`}>
        <section ref={panel} role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-label={label} tabIndex={-1} className={`dialog-panel ${drawer ? 'dialog-drawer' : ''} ${wide ? 'dialog-wide' : ''}`}>{children}</section>
    </div>, document.body);
}
