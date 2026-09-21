export default function Skeleton({ rows = false }) {
    return <div role="status" aria-label="Loading workspace" className={rows ? 'space-y-4' : 'skeleton-grid'}>
        <span className="sr-only">Loading, please wait.</span>
        {[0, 1, 2].map(index => <div key={index} className="skeleton-card" style={rows ? { height: 90 } : undefined} aria-hidden="true"><div className="skeleton-line w-1/3" /><div className="skeleton-line w-3/4" /><div className="skeleton-line w-1/2" /></div>)}
    </div>;
}
