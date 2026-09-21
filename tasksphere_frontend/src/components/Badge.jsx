import { Circle, Clock, CheckCircle2, AlertTriangle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
export default function Badge({ value, priority = false }) {
    const statuses = { TODO: ['To do', Circle, 'neutral'], IN_PROGRESS: ['In progress', Clock, 'info'], IN_REVIEW: ['In review', Clock, 'warning'], DONE: ['Completed', CheckCircle2, 'success'] };
    const priorities = { HIGH: ['High', ArrowUp, 'danger'], MEDIUM: ['Medium', ArrowRight, 'warning'], LOW: ['Low', ArrowDown, 'neutral'] };
    const [label, Icon, tone] = (priority ? priorities : statuses)[value] || [value || 'Normal', AlertTriangle, 'neutral'];
    return <span className={`badge badge-${tone}`}><Icon size={12} aria-hidden="true" />{label}<span className="sr-only">{priority ? ' priority' : ''}</span></span>;
}
