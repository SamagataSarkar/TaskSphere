import { useWorkspace } from '../components/WorkspaceContext';
import Dialog from '../components/Dialog';
import Skeleton from '../components/Skeleton';
import Badge from '../components/Badge';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, AlertCircle, Loader2, UserPlus, X, CheckCircle2, Search, RotateCcw, RefreshCw, MessageSquare, Send } from 'lucide-react';
import { request } from '../lib/api';
import './ProjectView.css';

export default function ProjectView() {
    const { setCurrentUser, setProfileData } = useWorkspace();
    const { projectId } = useParams();
    const navigate = useNavigate();
    
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [filterPriority, setFilterPriority] = useState('ALL');
    const [filterAssignee, setFilterAssignee] = useState('ALL');
    
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newTask, setNewTask] = useState({ title: '', deadline: '', assignedToUserId: '', priority: 'MEDIUM' });
    const [inviteEmail, setInviteEmail] = useState('');

    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState([]);

    // --- NEW: Comment Modal States ---
    const [selectedTask, setSelectedTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    useEffect(() => {
        const searchUsers = async () => {
            if (userSearchQuery.trim().length < 2) {
                setUserSearchResults([]);
                return;
            }
            try {
                const results = await request(`/users/search?q=${encodeURIComponent(userSearchQuery)}`);
                setUserSearchResults(results);
            } catch (err) {
                console.error('Search failed:', err);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [userSearchQuery]);

    const fetchProjectData = async () => {
        try {
            setIsLoading(true);
            const [projectData, tasksData, membersData, currentUserMe] = await Promise.all([
                request(`/projects/${projectId}`),
                request(`/tasks/project/${projectId}`),
                request(`/projects/${projectId}/members`).catch(() => []),
                request(`/auth/me`).catch(() => null)
            ]);
            
            setCurrentUser(currentUserMe);
            if (currentUserMe) {
                setProfileData({ name: currentUserMe.name || '', currentPassword: '', newPassword: '', confirmPassword: '' });
            }
            setProject(projectData);
            setTasks(tasksData);
            setMembers(membersData);

            if (currentUserMe && currentUserMe.email) {
                const currentMember = membersData.find(m => m.email === currentUserMe.email);
                if (currentMember) {
                    setCurrentUserRole(currentMember.role);
                } else {
                    setCurrentUserRole('MEMBER');
                }
            }
        } catch (err) {
            setError(err.message || 'Failed to load project details.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const taskPayload = {
                title: newTask.title,
                status: 'TODO',
                projectId: Number(projectId),
                deadline: newTask.deadline || null,
                assignedToUserId: newTask.assignedToUserId ? Number(newTask.assignedToUserId) : null,
                priority: newTask.priority
            };
            const createdTask = await request('/tasks', 'POST', taskPayload);
            setTasks([...tasks, createdTask]);
            setIsTaskModalOpen(false);
            setNewTask({ title: '', deadline: '', assignedToUserId: '', priority: 'MEDIUM' });
        } catch (err) {
            alert(err.message || 'Failed to create task.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await request(`/projects/${projectId}/invite`, 'POST', { email: inviteEmail });
            alert('Invitation sent successfully!');
            setIsInviteModalOpen(false);
            setInviteEmail('');
            setUserSearchQuery('');
            setUserSearchResults([]);
            fetchProjectData();
        } catch (err) {
            alert(err.message || 'Failed to invite member. Only owners can invite.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- ENHANCED: Supports explicit target statuses for the modal ---
    const handleStatusChange = async (taskId, currentStatus, targetStatus = null) => {
        if ((currentStatus === 'IN_REVIEW' || targetStatus === 'DONE') && currentUserRole === 'MEMBER') {
            alert('Members can only transition tasks to IN_REVIEW. Only project owners can approve as DONE.');
            return;
        }

        const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
        const currentIndex = statuses.indexOf(currentStatus);
        
        // If targetStatus is provided (from modal), use it. Otherwise, just cycle to the next one.
        const nextStatus = targetStatus || (currentIndex < 3 ? statuses[currentIndex + 1] : statuses[0]);

        if (nextStatus === 'DONE' && !targetStatus) {
            if (!window.confirm("Are you sure you want to mark this task as completed? It will be moved to the archive.")) {
                return;
            }
        }

        if (currentStatus === 'DONE') {
            if (!window.confirm("Are you sure you want to reopen this completed task?")) {
                return;
            }
        }

        try {
            const taskToUpdate = tasks.find(t => t.id === taskId);
            const updatedTask = await request(`/tasks/${taskId}`, 'PUT', {
                ...taskToUpdate,
                status: nextStatus
            });
            
            setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
            
            // If the modal is currently open, update its state too!
            if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask(updatedTask);
            }
        } catch (err) {
            alert(err.message || 'Status transition denied.');
        }
    };

    // --- NEW: Open Task Modal & Fetch Comments ---
    const handleOpenTask = async (task) => {
        setSelectedTask(task);
        setComments([]);
        try {
            const fetchedComments = await request(`/tasks/${task.id}/comments`);
            setComments(fetchedComments);
        } catch (err) {
            console.error("Failed to load comments", err);
        }
    };

    // --- NEW: Add Comment ---
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        
        setIsSubmittingComment(true);
        try {
            const addedComment = await request(`/tasks/${selectedTask.id}/comments`, 'POST', { content: newComment });
            setComments([addedComment, ...comments]); // Add to top of list
            setNewComment('');
        } catch (err) {
            alert(err.message || 'Failed to add comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleUnarchiveProject = async () => {
        if (!window.confirm("Are you sure you want to restore this project to the active workspace?")) {
            return;
        }
        try {
            await request(`/projects/${projectId}/unarchive`, 'PUT');
            setProject({ ...project, archived: false });
        } catch (err) {
            alert(err.message || 'Failed to unarchive project.');
        }
    };

    const isOverdue = (deadlineStr) => {
        if (!deadlineStr) return false;
        const deadlineDate = new Date(deadlineStr);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        return deadlineDate < todayDate;
    };

    const isDeadlineClose = (deadlineStr) => {
        if (!deadlineStr) return false;
        const deadlineDate = new Date(deadlineStr);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const diffTime = deadlineDate - todayDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
    };

    const filteredTasks = tasks.filter(task => {
        const matchPriority = filterPriority === 'ALL' || task.priority === filterPriority;
        const matchAssignee = filterAssignee === 'ALL' 
            || (filterAssignee === 'UNASSIGNED' && !task.assignedToUserId)
            || (task.assignedToUserId && task.assignedToUserId.toString() === filterAssignee);
        return matchPriority && matchAssignee;
    });

    const activeTasks = filteredTasks.filter(t => t.status !== 'DONE');
    const completedTasks = filteredTasks.filter(t => t.status === 'DONE');

    if (isLoading) return (
        <Skeleton rows />
    );

    return (
        <>
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate('/dashboard')} className="flex items-center mb-8 text-sm font-medium transition-colors text-muted hover:text-ink">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Workspace
                </button>

                {error && <div role="alert" className="notice"><AlertCircle size={20} /><span>Unable to load this project. Return to your workspace or refresh to try again.</span></div>}
                {project?.archived && (
                    <div className="project-archive flex flex-col justify-between p-4 mb-6 text-sm gap-3 sm:flex-row sm:items-center text-amber-700 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                            This project is archived. You can view its history, but it is currently read-only.
                        </div>
                        {currentUserRole === 'OWNER' && (
                            <button 
                                onClick={handleUnarchiveProject}
                                className="flex items-center px-3 py-1.5 font-semibold transition-colors whitespace-nowrap bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-800"
                            >
                                <RefreshCw className="w-4 h-4 mr-1.5" />
                                Restore Project
                            </button>
                        )}
                    </div>
                )}

                <div className="project-heading flex flex-col items-start justify-between gap-4 mb-10 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-ink">{project?.name || 'Project workspace'}</h1>
                            <span className="project-role text-xs font-medium text-muted">
                                {currentUserRole || 'LOADING...'}
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-muted">Manage and track project deliverables</p>
                        <div className="project-members flex flex-wrap items-center gap-2 mt-4 text-xs text-muted"><UserPlus size={14} aria-hidden="true" /><span>{members.length} members</span>{members.map(member => <span key={member.id} className="project-member" title={member.email}>{member.name || member.email}</span>)}</div>
                    </div>

                    {!project?.archived && (
                        <div className="flex flex-wrap gap-3">
                            {currentUserRole === 'OWNER' && (
                                <button onClick={() => setIsInviteModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium transition-colors bg-panel border shadow-sm rounded-xl text-muted border-line hover:bg-elevated">
                                    <UserPlus className="w-4 h-4 mr-2 text-muted" />
                                    Invite Member
                                </button>
                            )}
                            <button onClick={() => setIsTaskModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm bg-brand-600 rounded-xl hover:bg-brand-700">
                                <Plus className="w-4 h-4 mr-2" />
                                New Task
                            </button>
                        </div>
                    )}
                </div>

                {!project?.archived && tasks.length > 0 && (
                    <div className="task-filters flex flex-col gap-3 mb-8 sm:flex-row">
                        <div className="flex items-center gap-2 min-w-0">
                            <label htmlFor="filter-priority" className="text-sm font-medium text-muted">Priority</label>
                            <select 
                                id="filter-priority" value={filterPriority} 
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="px-3 py-1.5 text-sm transition-colors border rounded-lg border-line focus:outline-none focus:ring-2 focus:ring-brand-500 bg-elevated"
                            >
                                <option value="ALL">All</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <label htmlFor="filter-assignee" className="text-sm font-medium text-muted">Assignee</label>
                            <select 
                                id="filter-assignee" value={filterAssignee} 
                                onChange={(e) => setFilterAssignee(e.target.value)}
                                className="px-3 py-1.5 text-sm transition-colors border rounded-lg border-line focus:outline-none focus:ring-2 focus:ring-brand-500 bg-elevated"
                            >
                                <option value="ALL">Everyone</option>
                                <option value="UNASSIGNED">Unassigned</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id.toString()}>{m.name || m.email}</option>
                                ))}
                            </select>
                        </div>
                        {(filterPriority !== 'ALL' || filterAssignee !== 'ALL') && (
                            <button 
                                onClick={() => { setFilterPriority('ALL'); setFilterAssignee('ALL'); }}
                                className="ml-auto text-sm font-medium text-muted hover:text-ink underline underline-offset-4"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}

                {/* Active Tasks Grid */}
                <h2 className="text-lg font-semibold mb-4">Active tasks <span className="text-sm text-subtle font-normal ml-2">{activeTasks.length}</span></h2>
                <div className="task-list mb-10">
                    {activeTasks.map((task) => (
                        <div 
                            key={task.id}
                            className="task-row"
                        >
                            <div>
                                <h3><button className="task-title" onClick={() => handleOpenTask(task)}>{task.title}</button></h3>
                                <div className="task-meta">
                                    <Badge value={task.status} />
                                    <Badge value={task.priority || "MEDIUM"} priority />
                                    {task.assignedToUserId && members.find(m => m.id === task.assignedToUserId) && (
                                        <span className="flex items-center px-2 py-0.5 rounded text-muted bg-elevated">
                                            {members.find(m => m.id === task.assignedToUserId).email}
                                        </span>
                                    )}
                                    {task.deadline && (
                                        <span className={`flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            isOverdue(task.deadline)
                                                ? 'bg-red-100 text-red-800 border border-red-300 font-bold'
                                                : isDeadlineClose(task.deadline) 
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200 ' 
                                                    : 'text-muted bg-elevated border border-line'
                                        }`}>
                                            {isOverdue(task.deadline) ? (
                                                <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                                            ) : (
                                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                            )}
                                            {isOverdue(task.deadline) ? `OVERDUE: ${task.deadline}` : 
                                             isDeadlineClose(task.deadline) ? `Due soon: ${task.deadline}` : 
                                             task.deadline}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Inline Advance Button - wrapped in e.stopPropagation to avoid opening modal when clicked */}
                            {!project?.archived && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(task.id, task.status);
                                    }}
                                    className="flex items-center px-3 py-1.5 text-sm font-medium transition-colors rounded-lg text-muted hover:bg-elevated hover:text-ink"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    Advance
                                </button>
                            )}
                        </div>
                    ))}
                    
                    {activeTasks.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-sm text-muted">{filterPriority !== "ALL" || filterAssignee !== "ALL" ? "No tasks match your filters. Try clearing the filters." : "No active tasks. You’re all caught up."}</p>
                        </div>
                    )}
                </div>

                {/* Completed Tasks Section */}
                {completedTasks.length === 0 && <section className="mb-8"><h2 className="text-lg font-semibold mb-3">Completed tasks</h2><p className="text-sm text-muted">Completed tasks will appear here.</p></section>}
                {completedTasks.length > 0 && (
                    <div>
                        <h2 className="pb-2 mb-4 text-lg font-semibold border-b text-ink border-line">Completed Tasks</h2>
                        <div className="task-list">
                            {completedTasks.map((task) => (
                                <div 
                                    key={task.id}
                                    className="task-row"
                                >
                                    <div>
                                        <h3><button className="task-title" onClick={() => handleOpenTask(task)}>{task.title}</button></h3>
                                        <div className="task-meta">
                                            <Badge value="DONE" />
                                        </div>
                                    </div>
                                    {!project?.archived && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(task.id, task.status);
                                            }}
                                            className="flex items-center px-3 py-1.5 text-sm font-medium transition-colors bg-panel border rounded-lg text-muted border-line hover:bg-elevated"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-1.5" />
                                            Reopen
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Task Review & Comment Modal --- */}
                {selectedTask && (
                    <Dialog label="Task details" labelledBy="task-details-title" onClose={() => setSelectedTask(null)} drawer>
                        <div className="project-task-detail w-full max-w-2xl flex flex-col">
                            
                            {/* Modal Header */}
                            <div className="flex items-start justify-between gap-3 p-6 border-b border-line">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <Badge value={selectedTask.status} />
                                        <Badge value={selectedTask.priority} priority />
                                    </div>
                                    <p className="eyebrow mb-3">Task details</p>
                                    <h2 id="task-details-title" className="text-xl font-semibold text-ink">{selectedTask.title}</h2>
                                    <dl className="grid grid-cols-2 gap-4 mt-5 text-xs"><div><dt className="text-subtle mb-1">Assignee</dt><dd>{members.find(m => m.id === selectedTask.assignedToUserId)?.email || "Unassigned"}</dd></div><div><dt className="text-subtle mb-1">Due date</dt><dd>{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : "No due date"}</dd></div></dl>
                                </div>
                                <button aria-label="Close dialog" onClick={() => setSelectedTask(null)} className="p-2 transition-colors rounded-full hover:bg-elevated text-subtle">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Comments Feed */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                <h3 className="flex items-center mb-4 text-sm font-semibold text-ink">
                                    <MessageSquare className="w-4 h-4 mr-2" /> Activity & Comments
                                </h3>
                                
                                {comments.length === 0 ? (
                                    <p className="py-8 text-sm italic text-center text-muted">No comments yet. Start the conversation!</p>
                                ) : (
                                    <div className="space-y-4">
                                        {comments.map(comment => (
                                            <div key={comment.id} className="project-comment py-4 border-b border-line">
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className="text-sm font-semibold text-ink">{comment.authorName}</span>
                                                    <span className="text-xs text-subtle">
                                                        {new Date(comment.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap text-muted">{comment.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Footer */}
                            {!project?.archived && (
                                <div className="p-4 bg-panel border-t border-line">
                                    
                                    {/* Workflow Action Buttons */}
                                    <div className="flex gap-2 pb-4 mb-4 border-b border-line">
                                        {selectedTask.status === 'TODO' && (
                                            <button onClick={() => handleStatusChange(selectedTask.id, selectedTask.status, 'IN_PROGRESS')} className="flex-1 py-2 text-sm font-medium transition-colors bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100">
                                                Start Work
                                            </button>
                                        )}
                                        {selectedTask.status === 'IN_PROGRESS' && (
                                            <button onClick={() => handleStatusChange(selectedTask.id, selectedTask.status, 'IN_REVIEW')} className="flex-1 py-2 text-sm font-medium transition-colors bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100">
                                                Submit for Review
                                            </button>
                                        )}
                                        {selectedTask.status === 'IN_REVIEW' && currentUserRole === 'OWNER' && (
                                            <button onClick={() => handleStatusChange(selectedTask.id, selectedTask.status, 'DONE')} className="flex items-center justify-center flex-1 py-2 text-sm font-medium transition-colors bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100">
                                                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Complete
                                            </button>
                                        )}
                                    </div>

                                    {/* Comment Input */}
                                    <label htmlFor="task-comment" className="block text-sm font-medium mb-2">Add a comment</label>
                                    <form onSubmit={handleAddComment} className="flex gap-2">
                                        <input
                                            type="text"
                                            id="task-comment" value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Add a comment or update..."
                                            className="flex-1 px-4 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-elevated focus:bg-panel transition-colors"
                                        />
                                        <button aria-label="Post comment" 
                                            type="submit" 
                                            disabled={!newComment.trim() || isSubmittingComment}
                                            className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center"
                                        >
                                            {isSubmittingComment ? <Loader2 role="status" aria-label="Loading" className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </Dialog>
                )}

                {/* --- Existing Modals --- */}
                {isInviteModalOpen && (
                    <Dialog label="Assign New Member" labelledBy="invite-member-title" onClose={() => { setIsInviteModalOpen(false); setUserSearchQuery(''); setUserSearchResults([]); }}>
                        <div className="w-full max-w-md p-6 bg-panel shadow-xl rounded-3xl animate-in zoom-in-95">
                            <div className="flex items-center justify-between mb-6">
                                <h2 id="invite-member-title" className="text-xl font-bold text-ink">Assign New Member</h2>
                                <button aria-label="Close dialog" onClick={() => { setIsInviteModalOpen(false); setUserSearchQuery(''); setUserSearchResults([]); }} className="p-2 transition-colors rounded-full text-subtle hover:bg-elevated">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleInviteMember}>
                                <div className="relative mb-6">
                                    <label htmlFor="projectview-field-1" className="block mb-2 text-sm font-medium text-muted">Search User</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                                        <input id="projectview-field-1"
                                            type="text"
                                            required
                                            data-autofocus="true"
                                            value={userSearchQuery}
                                            onChange={(e) => {
                                                setUserSearchQuery(e.target.value);
                                                setInviteEmail(e.target.value);
                                            }}
                                            className="w-full py-3 pl-10 pr-4 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            placeholder="Type a name or email..."
                                            autoComplete="off"
                                        />
                                    </div>

                                    {userSearchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-2 overflow-y-auto bg-panel border shadow-lg border-line rounded-xl max-h-48">
                                            {userSearchResults.map(user => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setInviteEmail(user.email);
                                                        setUserSearchQuery(user.email);
                                                        setUserSearchResults([]);
                                                    }}
                                                    className="w-full px-4 py-3 text-left transition-colors border-b hover:bg-elevated border-line last:border-0"
                                                >
                                                    <p className="text-sm font-semibold text-ink">{user.name}</p>
                                                    <p className="text-xs text-muted">{user.email}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button aria-live="polite" type="submit" disabled={isSubmitting} className="w-full py-3 text-sm font-semibold text-white transition-colors bg-brand-600 rounded-xl hover:bg-brand-700">
                                    {isSubmitting ? <Loader2 role="status" aria-label="Loading" className="w-5 h-5 mx-auto animate-spin" /> : 'Send Invitation'}
                                </button>
                            </form>
                        </div>
                    </Dialog>
                )}

                {isTaskModalOpen && (
                    <Dialog label="Create & Assign Task" labelledBy="create-task-title" onClose={() => setIsTaskModalOpen(false)}>
                        <div className="w-full max-w-md p-6 bg-panel shadow-xl rounded-3xl animate-in zoom-in-95">
                            <div className="flex items-center justify-between mb-6">
                                <h2 id="create-task-title" className="text-xl font-bold text-ink">Create & Assign Task</h2>
                                <button aria-label="Close dialog" onClick={() => setIsTaskModalOpen(false)} className="p-2 transition-colors rounded-full text-subtle hover:bg-elevated">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateTask}>
                                <div className="mb-4">
                                    <label htmlFor="projectview-field-2" className="block mb-2 text-sm font-medium text-muted">Task Title</label>
                                    <input id="projectview-field-2"
                                        type="text"
                                        required
                                        data-autofocus="true"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                        className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="projectview-field-3" className="block mb-2 text-sm font-medium text-muted">Assign To (Optional)</label>
                                    <select id="projectview-field-3"
                                        value={newTask.assignedToUserId}
                                        onChange={(e) => setNewTask({...newTask, assignedToUserId: e.target.value})}
                                        className="w-full px-4 py-3 text-sm transition-colors bg-panel border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">Unassigned</option>
                                        {members.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.email} ({member.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="projectview-field-4" className="block mb-2 text-sm font-medium text-muted">Priority</label>
                                    <select id="projectview-field-4"
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                                        className="w-full px-4 py-3 text-sm transition-colors bg-panel border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </div>
                                <div className="mb-8">
                                    <label htmlFor="projectview-field-5" className="block mb-2 text-sm font-medium text-muted">Deadline</label>
                                    <input id="projectview-field-5"
                                        type="date"
                                        min={today}
                                        value={newTask.deadline}
                                        onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                                        className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <button aria-live="polite" type="submit" disabled={isSubmitting} className="w-full py-3 text-sm font-semibold text-white transition-colors bg-brand-600 rounded-xl hover:bg-brand-700">
                                    {isSubmitting ? <Loader2 role="status" aria-label="Loading" className="w-5 h-5 mx-auto animate-spin" /> : 'Create Task'}
                                </button>
                            </form>
                        </div>
                    </Dialog>
                )}
            </div>
        </>
    );
}
