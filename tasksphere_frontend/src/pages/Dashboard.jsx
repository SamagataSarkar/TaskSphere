import { useWorkspace } from '../components/WorkspaceContext';
import Dialog from '../components/Dialog';
import Skeleton from '../components/Skeleton';
import Badge from '../components/Badge';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Folder, Loader2, ChevronRight, Plus, X, Archive, Activity, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { request } from '../lib/api';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const { activeTab, setActiveTab, currentUser, setCurrentUser, setProfileData } = useWorkspace();
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [metrics, setMetrics] = useState({ activeTasks: 0, completedTasks: 0, overdueTasks: 0 });
    
    // Create Project Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Interactive Task List Modal States
    const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
    const [taskModalType, setTaskModalType] = useState('');
    const [modalTasks, setModalTasks] = useState([]);
    const [isLoadingModalTasks, setIsLoadingModalTasks] = useState(false);
    


    useEffect(() => {
        fetchDashboardData();
        // Preserve the existing mount-only fetch; shared account setters are stable.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const [projectsData, metricsData, userData] = await Promise.all([
                request('/projects'),
                request('/tasks/metrics').catch(() => ({ activeTasks: 0, completedTasks: 0, overdueTasks: 0 })),
                request('/users/me').catch(() => null)
            ]);
            setProjects(projectsData);
            setMetrics(metricsData);
            setCurrentUser(userData);
            if (userData) {
                setProfileData({ name: userData.name || '', currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (err) {
            setError(err.message || 'Failed to load dashboard data.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMetricClick = async (type) => {
        setTaskModalType(type);
        setIsTasksModalOpen(true);
        setIsLoadingModalTasks(true);
        try {
            const fetchedTasks = await request(`/tasks/${type}`);
            setModalTasks(fetchedTasks);
        } catch (err) {
            alert(err.message || 'Failed to load tasks.');
        } finally {
            setIsLoadingModalTasks(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        setIsCreating(true);
        try {
            const newProject = await request('/projects', 'POST', { name: newProjectName });
            setProjects([...projects, newProject]);
            setNewProjectName('');
            setIsModalOpen(false);
        } catch (err) {
            alert(err.message || 'Failed to create project.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleArchiveProject = async (e, projectId) => {
        e.stopPropagation(); 
        if (!window.confirm("Are you sure you want to archive this project? It will be moved to history.")) return;
        
        try {
            await request(`/projects/${projectId}/archive`, 'PUT');
            setProjects(projects.map(p => p.id === projectId ? { ...p, archived: true } : p));
        } catch (err) {
            alert(err.message || 'Failed to archive project. Only Owners can perform this action.');
        }
    };

    const displayedProjects = projects.filter(p => activeTab === 'ACTIVE' ? !p.archived : p.archived);

    return (
        <>
            <div className="dashboard-content max-w-6xl mx-auto">
                <div className="dashboard-heading">
                    <div>
                        <p className="eyebrow mb-3">Your workspace, at a glance</p>
                        <h1 className="text-3xl font-bold tracking-tight text-ink">
                            Welcome, {currentUser?.name || 'User'}
                        </h1>
                        <p className="mt-1 text-sm text-muted">Manage your active projects and teams</p>
                    </div>
                    <div className="dashboard-actions">
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-sm bg-brand-600 rounded-xl hover:bg-brand-700">
                            <Plus className="w-4 h-4 mr-2" /> New Project
                        </button>
                    </div>
                </div>

                <div className="dashboard-metrics">
                    <button onClick={() => handleMetricClick('active')} className="dashboard-metric">
                        <div className="dashboard-metric-icon">
                            <Activity className="w-5 h-5 text-muted" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted">Active Tasks</p>
                            <h3 className="text-2xl font-bold text-ink">{isLoading ? <span className="skeleton-line inline-block w-12 mb-0" aria-label="Loading count" /> : metrics.activeTasks}</h3>
                        </div>
                    </button>
                    
                    <button onClick={() => handleMetricClick('completed')} className="dashboard-metric">
                        <div className="dashboard-metric-icon">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted">Completed</p>
                            <h3 className="text-2xl font-bold text-ink">{isLoading ? <span className="skeleton-line inline-block w-12 mb-0" aria-label="Loading count" /> : metrics.completedTasks}</h3>
                        </div>
                    </button>

                    <button onClick={() => handleMetricClick('overdue')} className="dashboard-metric">
                        <div className="dashboard-metric-icon">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted">Overdue Tasks</p>
                            <h3 className="text-2xl font-bold text-ink">{isLoading ? <span className="skeleton-line inline-block w-12 mb-0" aria-label="Loading count" /> : metrics.overdueTasks}</h3>
                        </div>
                    </button>
                </div>

                <h2 className="dashboard-projects-title text-xl font-semibold">Projects</h2>
                <div className="dashboard-project-tabs" role="group" aria-label="Project view">
                    <button aria-pressed={activeTab === 'ACTIVE'} onClick={() => setActiveTab('ACTIVE')} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ACTIVE' ? 'border-brand-600 text-brand-700' : 'border-transparent text-muted hover:text-muted'}`}>
                        Active Projects
                    </button>
                    <button aria-pressed={activeTab === 'ARCHIVED'} onClick={() => setActiveTab('ARCHIVED')} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ARCHIVED' ? 'border-brand-600 text-brand-700' : 'border-transparent text-muted hover:text-muted'}`}>
                        Archived Projects
                    </button>
                </div>

                {error && <div role="alert" className="notice"><AlertTriangle size={20} /><span>Unable to load your workspace. Please refresh to try again.</span></div>}
                {isLoading ? (
                    <Skeleton />
                ) : (
                    <div className="dashboard-project-grid">
                        {displayedProjects.map((project) => (
                            <div key={project.id} className="project-card dashboard-project-card">
                                <div className="dashboard-card-header">
                                    <div className="dashboard-project-icon">
                                        <Folder className="w-5 h-5 text-subtle" />
                                    </div>
                                    <div className="dashboard-card-actions">
                                        {!project.archived && (
                                            <button aria-label="Archive Project" onClick={(e) => handleArchiveProject(e, project.id)} className="dashboard-archive-button text-subtle hover:text-ink" title="Archive Project">
                                                <Archive className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className="dashboard-project-arrow" aria-hidden="true">
                                            <ChevronRight className="w-4 h-4 text-muted" />
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-base font-semibold text-ink"><Link className="project-link" to={`/projects/${project.id}`}>{project.name}</Link></h3>
                                <p className="dashboard-project-description text-muted">
                                    {project.archived ? 'Archived project (Read-only)' : 'Click to view tasks and manage team members'}
                                </p>
                            </div>
                        ))}
                        
                        {displayedProjects.length === 0 && !error && (
                            <div className="dashboard-empty col-span-full text-center">
                                <p className="text-sm text-muted">
                                    {activeTab === 'ACTIVE' ? 'No active projects. Create one to get started.' : 'No archived projects in history.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isTasksModalOpen && (
                <Dialog label={`${taskModalType} tasks`} labelledBy="metric-dialog-title" onClose={() => setIsTasksModalOpen(false)} wide>
                    <div className="w-full max-w-2xl p-6 bg-panel shadow-xl flex flex-col rounded-3xl animate-in zoom-in-95 max-h-[85vh]">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h2 id="metric-dialog-title" className="text-xl font-bold capitalize text-ink">
                                {taskModalType} Tasks
                            </h2>
                            <button aria-label="Close dialog" onClick={() => setIsTasksModalOpen(false)} className="p-2 transition-colors rounded-full text-subtle hover:bg-elevated">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto pr-2 flex-grow scrollbar-thin">
                            {isLoadingModalTasks ? (
                                <div className="flex items-center justify-center py-12"><Loader2 role="status" aria-label="Loading" className="w-8 h-8 animate-spin text-brand-600" /></div>
                            ) : modalTasks.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-muted">No {taskModalType} tasks found.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {modalTasks.map(task => (
                                        <div 
                                            key={task.id} 
                                            role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") navigate(`/projects/${task.projectId}`); }} onClick={() => navigate(`/projects/${task.projectId}`)}
                                            className="task-row rounded-xl cursor-pointer group"
                                        >
                                            <div className="pr-4">
                                                <h4 className="font-semibold text-ink group-hover:text-brand-600 transition-colors">{task.title}</h4>
                                                <div className="task-meta">
                                                    <Badge value={task.priority || "NORMAL"} priority />
                                                    <Badge value={task.status} />
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end shrink-0">
                                                {task.deadline && (
                                                    <div className={`flex items-center text-sm ${
                                                        taskModalType === 'overdue' ? 'text-red-600 font-medium' : 'text-muted'
                                                    }`}>
                                                        <Calendar className="w-4 h-4 mr-1.5" />
                                                        {new Date(task.deadline).toLocaleDateString()}
                                                    </div>
                                                )}
                                                <span className="flex items-center mt-2 text-xs font-medium text-brand-600  transition-opacity">
                                                    Go to project <ChevronRight className="w-3 h-3 ml-1" />
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Dialog>
            )}

            {isModalOpen && (
                <Dialog label="Create New Project" labelledBy="create-project-title" onClose={() => setIsModalOpen(false)}>
                    <div className="w-full max-w-md p-6 bg-panel shadow-xl rounded-3xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-6">
                            <h2 id="create-project-title" className="text-xl font-bold text-ink">Create New Project</h2>
                            <button aria-label="Close dialog" onClick={() => setIsModalOpen(false)} className="p-2 transition-colors rounded-full text-subtle hover:bg-elevated">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateProject}>
                            <div className="mb-8">
                                <label htmlFor="dashboard-field-1" className="block mb-2 text-sm font-medium text-muted">Project Name</label>
                                <input id="dashboard-field-1"
                                    type="text"
                                    required
                                    data-autofocus="true"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    placeholder="e.g., Q3 Marketing Campaign"
                                />
                            </div>
                            <button aria-live="polite" type="submit" disabled={isCreating} className="w-full flex items-center justify-center py-3 text-sm font-semibold text-white transition-colors bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-70">
                                {isCreating ? <Loader2 role="status" aria-label="Loading" className="w-5 h-5 animate-spin" /> : 'Create Project'}
                            </button>
                        </form>
                    </div>
                </Dialog>
            )}

        </>
    );
}
