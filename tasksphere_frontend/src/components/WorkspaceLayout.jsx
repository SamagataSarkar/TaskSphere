import { useState } from 'react';
import { WorkspaceContext } from './WorkspaceContext';
import Dialog from './Dialog';
import { request } from '../lib/api';
import { Link, Outlet, useMatch, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Archive, Settings, LogOut, Folder, ChevronRight, X, User, Loader2 } from 'lucide-react';
import Brand from './Brand';
export default function WorkspaceLayout() {
    const navigate = useNavigate();
    const projectRoute = useMatch('/projects/:projectId');
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const [currentUser, setCurrentUser] = useState(null);
    // Profile Settings Modal States
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileData, setProfileData] = useState({ name: '', currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        // SECURED: Pre-flight frontend validation
        if (profileData.newPassword) {
            if (profileData.newPassword !== profileData.confirmPassword) {
                alert("New passwords do not match!");
                return;
            }
            if (!profileData.currentPassword) {
                alert("Please enter your current password to authorize this change.");
                return;
            }
        }

        setIsUpdatingProfile(true);
        try {
            const payload = { name: profileData.name };
            if (profileData.newPassword) {
                payload.password = profileData.newPassword;
                payload.currentPassword = profileData.currentPassword;
            }
            
            const updatedUser = await request('/auth/me', 'PUT', payload);
            
            // If password was changed, log them out because their current token was just invalidated
            if (profileData.newPassword) {
                alert('Password updated successfully! For security, please log in again.');
                handleLogout();
                return;
            }

            setCurrentUser(updatedUser);
            setIsProfileModalOpen(false);
            setProfileData({ name: updatedUser.name || '', currentPassword: '', newPassword: '', confirmPassword: '' });
            alert('Profile updated successfully!');
        } catch (err) {
            alert(err.message || 'Failed to update profile.');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const onTabChange = projectRoute ? null : setActiveTab;
    const onSettings = () => setIsProfileModalOpen(true);
    const onLogout = handleLogout;
    return <WorkspaceContext.Provider value={{ activeTab, setActiveTab, currentUser, setCurrentUser, setProfileData }}>
    <div className={projectRoute ? 'project-workspace' : undefined}>
    <div className="workspace">
        <a href="#workspace-content" className="skip-link">Skip to content</a>
        <aside className="workspace-sidebar">
            <Link to="/dashboard" aria-label="TaskSphere workspace"><Brand /></Link>
            <div><p className="eyebrow mb-4 px-3">Workspace</p>
                <nav className="workspace-nav" aria-label="Main navigation">
                    {onTabChange ? <>
                        <button aria-current={activeTab === 'ACTIVE' ? 'page' : undefined} onClick={() => onTabChange('ACTIVE')}><LayoutDashboard size={18} /> Overview</button>
                        <button aria-current={activeTab === 'ARCHIVED' ? 'page' : undefined} onClick={() => onTabChange('ARCHIVED')}><Archive size={18} /> Archived projects</button>
                    </> : <>
                        <Link to="/dashboard"><LayoutDashboard size={18} /> Overview</Link>
                        <span className="flex items-center gap-3 px-3 py-3 text-sm font-semibold bg-brand-50 rounded-lg" aria-current="page"><Folder size={18} /> Project workspace</span>
                    </>}
                    {onSettings && <button onClick={onSettings}><Settings size={18} /> Account settings</button>}
                    {onLogout && <button onClick={onLogout}><LogOut size={18} /> Log out</button>}
                </nav>
            </div>
            <div className="workspace-sidebar-footer"><p className="text-sm font-medium">Space to make progress.</p><p className="text-xs text-subtle mt-2 leading-relaxed">One project. One task.<br />One step forward.</p></div>
        </aside>
        <header className="workspace-topbar"><span className="flex items-center gap-3">Workspace <ChevronRight size={14} /> <span className="text-ink">{activeTab === 'ARCHIVED' ? 'Archived projects' : 'Overview'}</span></span><span className="eyebrow">TaskSphere / Your workspace</span></header>
        <main id="workspace-content" tabIndex={-1} className="workspace-main"><Outlet /></main>
    </div>
    </div>
            {isProfileModalOpen && (
                <Dialog label="Account Settings" labelledBy="account-settings-title" onClose={() => setIsProfileModalOpen(false)}>
                    <div className="w-full max-w-md p-6 bg-panel shadow-xl rounded-3xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-6">
                            <h2 id="account-settings-title" className="text-xl font-bold text-ink">Account Settings</h2>
                            <button aria-label="Close dialog" onClick={() => setIsProfileModalOpen(false)} className="p-2 transition-colors rounded-full text-subtle hover:bg-elevated">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex items-center mb-6 space-x-4 p-4 bg-elevated rounded-xl border border-line">
                            <div className="p-3 bg-panel rounded-full shadow-sm">
                                <User className="w-6 h-6 text-brand-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-ink">{currentUser?.email}</p>
                                <p className="text-xs text-muted">Role: {currentUser?.role}</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile}>
                            <div className="mb-4">
                                <label htmlFor="dashboard-field-2" className="block mb-2 text-sm font-medium text-muted">Display Name</label>
                                <input id="dashboard-field-2"
                                    type="text"
                                    required
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                    className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            
                            <div className="mb-4 border-t pt-4 border-line">
                                <label htmlFor="dashboard-field-3" className="block mb-2 text-sm font-medium text-muted">
                                    New Password <span className="font-normal text-subtle">(leave blank to keep current)</span>
                                </label>
                                <input id="dashboard-field-3"
                                    type="password"
                                    value={profileData.newPassword}
                                    onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
                                    className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    placeholder="Enter new password"
                                    minLength={6}
                                />
                            </div>

                            <div className="space-y-4 mb-6 bg-elevated p-4 rounded-xl border border-line">
                                <div>
                                    <label htmlFor="dashboard-field-4" className="block mb-2 text-sm font-medium text-red-600">Current Password (Required to change password)</label>
                                    <input id="dashboard-field-4"
                                        type="password"
                                        value={profileData.currentPassword}
                                        onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                                        className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-red-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="Verify your identity"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dashboard-field-5" className="block mb-2 text-sm font-medium text-muted">Confirm New Password</label>
                                    <input id="dashboard-field-5"
                                        type="password"
                                        value={profileData.confirmPassword}
                                        onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
                                        className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="Type new password again"
                                    />
                                </div>
                            </div>

                            <button aria-live="polite" type="submit" disabled={isUpdatingProfile} className="w-full flex items-center justify-center py-3 mt-6 text-sm font-semibold text-white transition-colors bg-elevated rounded-xl hover:bg-elevated disabled:opacity-70">
                                {isUpdatingProfile ? <Loader2 role="status" aria-label="Loading" className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </Dialog>
            )}
    </WorkspaceContext.Provider>;
}
