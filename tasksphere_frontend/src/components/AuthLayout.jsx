import { Layers3 } from 'lucide-react';
import Brand from './Brand';
import './AuthLayout.css';
export default function AuthLayout({ children }) {
    return <main className="auth-layout">
        <aside className="auth-story">
            <Brand />
            <div className="auth-copy">
                <div className="eyebrow">A little clarity. A lot of progress.</div>
                <h2>Great work starts<br />with <span>a clear space.</span></h2>
                <p>Bring your projects, people, and priorities together. Make room for what matters next.</p>
            </div>
            <div className="aurora-orbit" aria-hidden="true" />
            <div className="auth-foot"><Layers3 size={16} aria-hidden="true" /> Your work, in one shared orbit.</div>
        </aside>
        <section className="auth-content"><div className="auth-mobile-brand"><Brand /></div><div className="auth-panel">{children}</div></section>
    </main>;
}
