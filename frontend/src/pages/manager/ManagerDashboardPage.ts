import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import SocketService from '../../services/socket.service';
import { Button } from '../../components/Button';
import APIClient from '../../api/client';
import * as dom from '../../utils/dom';

export const ManagerDashboardPage = () => {
    const user = AuthService.getUser();

    // --- STATE & DATA ---
    let myTeam: any[] = [];
    let allEmployees: any[] = [];
    let activeTab: 'team' | 'available' = 'team'; // Directory tabs
    let currentMainTab: 'overview' | 'intelligence' | 'team' | 'leaves' | 'reports' | 'settings' = 'overview'; // Main dashboard tabs
    let activeLeaveView: 'requests' | 'calendar' = 'requests';
    let teamLeaves: any[] = [];
    let attendance = AttendanceService.getState();
    let stats: any = null;
    let teamIntelligence: any = null;
    let selectedMemberId: string | null = null;
    let allTeamTasks: any[] = [];
    let notifications: any[] = [];
    let isNotificationOpen = false;
    let timerInterval: any = null;
    let productivityChart: any = null;
    let efficiencyChart: any = null;
    let searchQuery = '';

    // --- REAL-TIME NOTIFICATIONS ---
    const unsubscribe = SocketService.onNotification((notification) => {
        notifications = [notification, ...notifications];
        renderTopBar();
        // Refresh full data for real-time tracking if it's a task, leave, or registration event
        if (['task_assigned', 'task_completed', 'leave_requested', 'leave_approved', 'leave_rejected', 'user_registered'].includes(notification.type)) {
            fetchData();
        } else {
            refreshDashboard();
        }
        dom.showAlert(`New Alert: ${notification.title}`, "info");
    });

    // --- MODAL FUNCTIONS (Hoisted) ---
    function showCreateTaskModal() {
        const modal = document.createElement('div');
        modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300";
        modal.innerHTML = `
            <div class="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 class="text-2xl font-black text-slate-900 tracking-tight">Assign New Task</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Directly assign to team members</p>
                    </div>
                    <button id="close-task-modal" class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <form id="create-task-form" class="p-8 space-y-4">
                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Task Title</label>
                        <input name="title" required placeholder="Project presentation, Code review..." class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Description</label>
                        <textarea name="description" rows="3" placeholder="Brief details about the task..." class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none resize-none"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assign To</label>
                            <select name="employeeId" required class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                                <option value="">Select Member</option>
                                ${myTeam.map((m: any) => `<option value="${m._id}">${m.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Priority</label>
                            <select name="priority" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    
                    <button type="submit" id="submit-task-btn" class="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black tracking-widest uppercase text-sm hover:group-hover:scale-105 transition-all shadow-xl shadow-indigo-100 mt-4 h-16 flex items-center justify-center">
                        Assign Task Now
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#close-task-modal')?.addEventListener('click', () => modal.remove());

        const form = modal.querySelector('#create-task-form') as HTMLFormElement;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                employeeId: formData.get('employeeId') as string,
                priority: formData.get('priority') as string,
            };

            try {
                // Optimistic UI Update
                const tempId = 'temp-' + Date.now();
                const assignee = allEmployees.find(e => e._id === data.employeeId);
                const newTask = {
                    _id: tempId,
                    ...data,
                    employee: assignee || { _id: data.employeeId, name: 'Assignee...' },
                    status: 'todo',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                allTeamTasks = [newTask, ...allTeamTasks];
                refreshDashboard();
                modal.remove();
                dom.showAlert('Task assigned!', 'success');

                const res = await APIClient.createTask(data);
                if (!res.success) {
                    // Rollback on failure
                    allTeamTasks = allTeamTasks.filter(t => t._id !== tempId);
                    refreshDashboard();
                    dom.showAlert('Sync failed. Please retry.', 'danger');
                } else {
                    // Replace temp task with real data if needed (usually ID changes)
                    await fetchData();
                }
            } catch (err: any) {
                console.error(err);
                await fetchData(); // Final sync
            } finally {
                // Modal already removed in optimistic path
            }
        });
    }

    function showEditTaskModal(task: any) {
        const modal = document.createElement('div');
        modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300";
        modal.innerHTML = `
            <div class="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 class="text-2xl font-black text-slate-900 tracking-tight">Modify Task</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Refine or reassign team tasks</p>
                    </div>
                    <button id="close-edit-modal" class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <form id="edit-task-form" class="p-8 space-y-4">
                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Task Title</label>
                        <input name="title" required value="${task.title}" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Description</label>
                        <textarea name="description" rows="3" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none resize-none">${task.description || ''}</textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assigned To</label>
                            <select name="employeeId" required class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                                ${myTeam.map((m: any) => `<option value="${m._id}" ${m._id === (task.employee._id || task.employee) ? 'selected' : ''}>${m.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Priority</label>
                            <select name="priority" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Status</label>
                        <select name="status" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                            <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
                            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                            <option value="review" ${task.status === 'review' ? 'selected' : ''}>Under Review</option>
                            <option value="done" ${task.status === 'done' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                    
                    <div class="flex gap-4 mt-6">
                        <button type="button" id="delete-task-btn" class="flex-1 bg-rose-50 text-rose-600 border border-rose-100 py-4 rounded-3xl font-black tracking-widest uppercase text-[10px] hover:bg-rose-600 hover:text-white transition-all">
                            Delete Task
                        </button>
                        <button type="submit" id="update-task-btn" class="flex-[2] bg-indigo-600 text-white py-4 rounded-3xl font-black tracking-widest uppercase text-[10px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#close-edit-modal')?.addEventListener('click', () => modal.remove());

        const form = modal.querySelector('#edit-task-form') as HTMLFormElement;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                employeeId: formData.get('employeeId') as string,
                priority: formData.get('priority') as string,
                status: formData.get('status') as string,
            };

            try {
                // Optimistic UI Update
                const originalTasks = [...allTeamTasks];
                const taskIndex = allTeamTasks.findIndex(t => t._id === task._id);
                if (taskIndex > -1) {
                    const assignee = allEmployees.find(e => e._id === data.employeeId);
                    allTeamTasks[taskIndex] = {
                        ...allTeamTasks[taskIndex],
                        ...data,
                        employee: assignee || allTeamTasks[taskIndex].employee,
                        updatedAt: new Date().toISOString()
                    };
                    refreshDashboard();
                }
                modal.remove();
                dom.showAlert('Action synchronized.', 'success');

                const res = await APIClient.updateTask(task._id, data);
                if (!res.success) {
                    allTeamTasks = originalTasks;
                    refreshDashboard();
                    dom.showAlert('Update failed. Reverted.', 'danger');
                } else {
                    await fetchData(); // Refresh stats/actual data
                }
            } catch (err: any) {
                console.error(err);
                await fetchData();
            }
        });

        modal.querySelector('#delete-task-btn')?.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete this task?')) return;

            try {
                const originalTasks = [...allTeamTasks];
                allTeamTasks = allTeamTasks.filter(t => t._id !== task._id);
                refreshDashboard();
                modal.remove();
                dom.showAlert('Target extracted.', 'success');

                const res = await APIClient.deleteTask(task._id);
                if (!res.success) {
                    allTeamTasks = originalTasks;
                    refreshDashboard();
                    dom.showAlert('System error. Task restored.', 'danger');
                } else {
                    await fetchData();
                }
            } catch (err: any) {
                console.error(err);
                await fetchData();
            }
        });
    }

    function showReportModal(preselectedEmployeeId?: string) {
        const modal = document.createElement('div');
        modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300";
        modal.innerHTML = `
            <div class="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 class="text-2xl font-black text-slate-900 tracking-tight">Generate Employee Tracker</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time attendance & activity insights</p>
                    </div>
                    <button id="close-report-modal" class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div id="modal-content" class="p-8 overflow-y-auto">
                    <div class="mb-6">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Select Employee</label>
                        <select id="employee-select" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                            <option value="">Choose an employee...</option>
                            ${allEmployees.map(emp => `<option value="${emp._id}" ${preselectedEmployeeId === emp._id ? 'selected' : ''}>${emp.name} (${emp.position})</option>`).join('')}
                        </select>
                    </div>
                    
                    <div id="report-results" class="hidden">
                        <!-- Results injected here -->
                    </div>
                    
                    <button id="fetch-report-btn" class="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black tracking-widest uppercase text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-4">
                        Fetch Real-time Tracker
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#close-report-modal')?.addEventListener('click', () => modal.remove());
        const fetchBtn = modal.querySelector('#fetch-report-btn') as HTMLButtonElement;
        const select = modal.querySelector('#employee-select') as HTMLSelectElement;
        const resultsDiv = modal.querySelector('#report-results') as HTMLElement;

        fetchBtn?.addEventListener('click', async () => {
            const empId = select.value;
            if (!empId) return dom.showAlert('Please select an employee', 'warning');

            try {
                dom.showLoading('fetch-report-btn', 'Generating...');
                const res = await APIClient.getEmployeeReport(empId);
                if (res.success) {
                    const data = res.data as any[];
                    const summary = (res as any).summary;
                    resultsDiv.classList.remove('hidden');
                    resultsDiv.innerHTML = `
                        <!-- Real-time Status Header -->
                        <div class="flex items-center justify-between mb-8 p-6 rounded-[2rem] ${summary.isWorking ? 'bg-emerald-50 border- emerald-100' : 'bg-slate-50 border-slate-100'} border-2 relative overflow-hidden">
                            <div class="relative z-10">
                                <p class="text-[10px] font-black ${summary.isWorking ? 'text-emerald-500' : 'text-slate-400'} uppercase tracking-[0.2em] mb-1">Live Connection Status</p>
                                <div class="flex items-center gap-3">
                                    <div class="w-2.5 h-2.5 rounded-full ${summary.currentStatus === 'working' ? 'bg-emerald-500 animate-pulse' : (summary.currentStatus === 'on-break' ? 'bg-amber-500' : 'bg-slate-300')}"></div>
                                    <h4 class="text-xl font-black text-slate-900 uppercase tracking-tight">${summary.currentStatus}</h4>
                                </div>
                            </div>
                            <div class="text-right relative z-10">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Productivity</p>
                                <p class="text-2xl font-black text-slate-900">${summary.totalHours} <span class="text-sm text-slate-400">Hours</span></p>
                            </div>
                            ${summary.isWorking ? '<div class="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl"></div>' : ''}
                        </div>

                        <!-- Metric Analytics Grid -->
                        <div class="grid grid-cols-3 gap-4 mb-8">
                            <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                                <span class="text-xl mb-2">⚡</span>
                                <p class="text-2xl font-black text-indigo-600">${summary.taskSummary.pending}</p>
                                <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending Tasks</p>
                            </div>
                            <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                                <span class="text-xl mb-2">✅</span>
                                <p class="text-2xl font-black text-emerald-600">${summary.taskSummary.completed}</p>
                                <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Done Tasks</p>
                            </div>
                            <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                                <span class="text-xl mb-2">🗓️</span>
                                <p class="text-2xl font-black text-slate-900">${summary.totalDays}</p>
                                <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Days</p>
                            </div>
                        </div>

                        <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Activity Log (Last 30 Days)</p>
                            ${data.length === 0 ? `<div class="text-center py-10 text-slate-400 font-bold italic">No activity recorded.</div>` : data.map(day => `
                                <div class="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center group hover:bg-white hover:border-indigo-200 transition-all">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs shadow-sm">🗓️</div>
                                        <p class="text-xs font-black text-slate-700">${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                    <div class="flex items-center gap-4">
                                        <div class="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                            <div class="h-full bg-indigo-500" style="width: ${Math.min(100, (day.totalSeconds / (8 * 3600)) * 100)}%"></div>
                                        </div>
                                        <span class="text-[10px] font-bold text-slate-500 tabular-nums">${Math.round(day.totalSeconds / 360) / 10}h</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    fetchBtn.innerText = "Refresh Tracker";
                }
            } catch (err: any) {
                dom.showAlert(err.message, 'danger');
            } finally {
                dom.hideLoading('fetch-report-btn', 'Fetch Real-time Tracker');
            }
        });

        // Auto-fetch if pre-selected
        if (preselectedEmployeeId) {
            setTimeout(() => {
                fetchBtn.click();
            }, 300);
        }
    }

    const wrapper = document.createElement('div');
    wrapper.className = "min-h-screen bg-[#f1f5f9] flex overflow-hidden font-inter";

    // --- SIDEBAR ---
    const sidebar = document.createElement('aside');
    sidebar.className = "w-64 bg-[#1e293b] flex flex-col transition-all duration-300 z-30 shrink-0";

    const renderSidebar = () => {
        const menuItems = [
            { id: 'overview', label: 'Dashboard', icon: '🏠' },
            { id: 'intelligence', label: 'Intelligence', icon: '🧠' },
            { id: 'team', label: 'My Team', icon: '👥' },
            { id: 'leaves', label: 'Time Off', icon: '🌴' },
            { id: 'reports', label: 'Reports', icon: '📊' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
        ];

        sidebar.innerHTML = `
            <div class="h-16 flex items-center px-6 gap-3 border-b border-slate-700/50">
                <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-black shadow-lg">EP</div>
                <span class="text-white font-black text-sm tracking-tight">People Hub</span>
            </div>
            
            <div class="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                ${menuItems.map(item => `
                    <button data-nav="${item.id}" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentMainTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                        <span class="text-lg leading-none">${item.icon}</span>
                        <span>${item.label}</span>
                    </button>
                `).join('')}
            </div>

            <div class="p-4 border-t border-slate-700/50">
                <div class="flex items-center gap-3 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/30">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-black shadow-inner">
                        ${(user?.name?.[0] || 'M').toUpperCase()}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-black text-white truncate">${user?.name || 'Manager'}</p>
                        <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Manager Account</p>
                    </div>
                </div>
                <button id="sidebar-logout" class="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
                    <span>🚪</span> Logout
                </button>
            </div>
        `;

        sidebar.querySelectorAll('button[data-nav]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentMainTab = (e.currentTarget as HTMLButtonElement).getAttribute('data-nav') as any;
                refreshDashboard();
                renderSidebar();
            });
        });
        sidebar.querySelector('#sidebar-logout')?.addEventListener('click', () => AuthService.logout());
    };

    wrapper.appendChild(sidebar);

    const mainContainer = document.createElement('div');
    mainContainer.className = "flex-1 flex flex-col overflow-hidden relative";
    wrapper.appendChild(mainContainer);

    // --- TOP BAR ---
    const topBar = document.createElement('header');
    topBar.className = "h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20 shrink-0";

    const renderTopBar = () => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        topBar.innerHTML = `
            <div class="flex items-center gap-4 text-slate-400 overflow-hidden">
                <span class="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-[0.2em] truncate">${currentMainTab}</span>
                <span class="text-slate-200">/</span>
                <span class="text-[10px] sm:text-xs font-bold text-slate-400 whitespace-nowrap">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div class="flex items-center gap-3 sm:gap-6 relative">
                <div class="relative flex-1 max-w-md mx-2 sm:mx-6 group">
                    <input id="global-search" type="text" value="${searchQuery}" placeholder="Search team, tasks, or leaves..." 
                        class="w-full bg-slate-50 border border-slate-100 rounded-full pl-10 pr-4 py-2.5 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none shadow-sm group-hover:border-indigo-200">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 group-focus-within:text-indigo-500 transition-colors">🔍</span>
                </div>
                <div class="flex items-center gap-2 relative">
                    <button id="notification-bell" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all relative">
                        🔔
                        ${unreadCount > 0 ? `<span class="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>` : ''}
                    </button>
                    ${isNotificationOpen ? `
                        <div class="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div class="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <span class="text-[10px] font-black uppercase tracking-widest text-slate-900">Notifications</span>
                                <button id="mark-all-read" class="text-[8px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Mark all as read</button>
                            </div>
                            <div class="max-h-64 overflow-y-auto">
                                ${notifications.length === 0 ? `
                                    <div class="p-8 text-center text-slate-400 font-bold italic text-[10px]">No new alerts.</div>
                                ` : notifications.map(n => `
                                    <div class="p-4 border-b border-slate-50 hover:bg-indigo-50/30 transition-all cursor-pointer ${!n.isRead ? 'bg-indigo-50/10' : ''}" data-nid="${n._id}">
                                        <p class="text-[10px] font-black text-slate-900 mb-1">${n.title}</p>
                                        <p class="text-[9px] text-slate-500 font-medium leading-relaxed">${n.message}</p>
                                        <p class="text-[8px] text-slate-400 mt-2 font-bold">${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        topBar.querySelector('#notification-bell')?.addEventListener('click', (e) => {
            e.stopPropagation();
            isNotificationOpen = !isNotificationOpen;
            renderTopBar();
        });

        topBar.querySelector('#mark-all-read')?.addEventListener('click', async () => {
            await APIClient.markAllNotificationsRead();
            notifications = [];
            renderTopBar();
        });

        topBar.querySelectorAll('[data-nid]').forEach(item => {
            item.addEventListener('click', async () => {
                const nid = item.getAttribute('data-nid');
                const n = notifications.find(notif => notif._id === nid);
                
                if (nid && n) {
                    await APIClient.markNotificationRead(nid);
                    notifications = notifications.filter(notif => notif._id !== nid);
                    
                    if (['leave_requested', 'leave_approved', 'leave_rejected'].includes(n.type)) {
                        currentMainTab = 'leaves';
                        isNotificationOpen = false;
                        refreshDashboard();
                        renderSidebar();
                    } else {
                        isNotificationOpen = notifications.length > 0;
                        renderTopBar();
                    }
                }
            });
        });

        const searchInput = topBar.querySelector('#global-search') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = (e.target as HTMLInputElement).value;
                refreshDashboard();
            });
        }
    };

    mainContainer.appendChild(topBar);

    const contentArea = document.createElement('div');
    contentArea.className = "flex-1 overflow-y-auto p-8 relative scroll-smooth";
    mainContainer.appendChild(contentArea);

    const main = document.createElement('div');
    main.className = "max-w-7xl mx-auto w-full flex flex-col gap-8";
    contentArea.appendChild(main);

    // --- COMPONENTS ---

    // 1. Header (Dynamic Title)
    const header = document.createElement('div');
    header.className = "mb-2 animate-in fade-in slide-in-from-left-4 duration-500";

    const renderHeaderTitle = () => {
        header.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 class="text-3xl font-black text-slate-900 tracking-tighter">
                        ${currentMainTab === 'overview' ? `Good ${new Date().getHours() < 12 ? 'Morning' : (new Date().getHours() < 17 ? 'Afternoon' : 'Evening')}, ${user?.name?.split(' ')[0]}!` : currentMainTab.charAt(0).toUpperCase() + currentMainTab.slice(1)}
                    </h1>
                    <p class="text-slate-500 font-bold mt-1 text-sm uppercase tracking-widest opacity-80">
                        ${currentMainTab === 'overview' ? 'Here is a quick look at your team today.' : ''}
                    </p>
                </div>
                ${currentMainTab === 'overview' ? `
                    <div id="quick-task-btn" class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 sm:px-6 sm:py-3 rounded-2xl shadow-xl shadow-indigo-200 cursor-pointer hover:scale-105 transition-all w-full sm:w-auto justify-center">
                        <span class="text-lg">➕</span>
                        <span class="text-[10px] sm:text-xs font-black uppercase tracking-widest">Quick Task</span>
                    </div>
                ` : ''}
            </div>
        `;
    };

    // 2. Attendance Card (Manager's own clock-in/out)
    const attendanceCard = document.createElement('div');
    attendanceCard.className = "bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8";

    const updateAttendanceUI = () => {
        const isIn = attendance.isClockedIn;
        const onBreak = attendance.isOnBreak;

        attendanceCard.innerHTML = `
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shadow-sm">
                        ${onBreak ? '☕' : (isIn ? '🔥' : '😴')}
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-slate-900 tracking-tight leading-none">${onBreak ? 'Away' : (isIn ? 'Active' : 'Offline')}</h3>
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1.5 flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full ${isIn ? (onBreak ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-slate-300'}"></span>
                            Work Session
                        </p>
                    </div>
                </div>
                <div id="manager-timer" class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter tabular-nums mb-1">${(() => {
                const st = attendance;
                const displaySeconds = st.isClockedIn
                    ? (st.isOnBreak
                        ? st.totalSecondsToday
                        : st.totalSecondsToday + (st.clockInTime ? Math.floor((Date.now() - st.clockInTime) / 1000) : 0))
                    : 0; // Reset to 00:00:00 when not working as requested
                const h = Math.floor(displaySeconds / 3600);
                const m = Math.floor((displaySeconds % 3600) / 60);
                const s = displaySeconds % 60;
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            })()}</div>
                <p class="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Hours Today</p>
            </div>
            
            <div class="flex flex-col gap-3 shrink-0">
                ${!isIn ? `
                    <button id="mgr-clock-in" class="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 transition-all active:scale-95 shadow-2xl shadow-indigo-200">
                        Check In
                    </button>
                ` : `
                    <div class="flex gap-3">
                        <button id="mgr-break" class="px-8 py-5 rounded-3xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 border-2 ${onBreak ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}">
                            ${onBreak ? 'Resume' : '☕ Break'}
                        </button>
                        <button id="mgr-clock-out" class="bg-red-50 text-red-600 border border-red-100 px-8 py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all active:scale-95">
                             Clock Out
                        </button>
                    </div>
                    <p class="text-[9px] text-center font-bold text-slate-300 uppercase mt-2">Manage your session with care</p>
                `}
            </div>
        `;

        attendanceCard.querySelector('#mgr-clock-in')?.addEventListener('click', async () => {
            try {
                // 🔥 Optimistic UI Update: Instant visual feedback
                const now = Date.now();
                attendance.isClockedIn = true;
                attendance.isOnBreak = false;
                attendance.clockInTime = now;
                updateAttendanceUI();

                // Background Sync
                await AttendanceService.clockIn();
                attendance = await AttendanceService.refreshState();
                updateAttendanceUI();
            } catch (err: any) {
                // Rollback on failure
                attendance = await AttendanceService.refreshState();
                updateAttendanceUI();
                dom.showAlert(err.message, 'danger');
            }
        });

        attendanceCard.querySelector('#mgr-clock-out')?.addEventListener('click', async () => {
            try {
                if (!confirm('Are you sure you want to end your session?')) return;

                // 🔥 Optimistic UI Update
                const now = Date.now();
                if (attendance.isClockedIn && !attendance.isOnBreak) {
                    const elapsed = Math.floor((now - (attendance.clockInTime || now)) / 1000);
                    attendance.totalSecondsToday += Math.max(0, elapsed);
                }
                attendance.isClockedIn = false;
                attendance.isOnBreak = false;
                attendance.clockInTime = null;
                updateAttendanceUI();

                // Background Sync
                await AttendanceService.clockOut();
                attendance = await AttendanceService.refreshState();
                await fetchData(); // Refresh stats for reports
                updateAttendanceUI();
                dom.showAlert('Session completed successfully!', 'success');
            } catch (err: any) {
                // Rollback on failure
                attendance = await AttendanceService.refreshState();
                updateAttendanceUI();
                dom.showAlert(err.message, 'danger');
            }
        });

        attendanceCard.querySelector('#mgr-break')?.addEventListener('click', async () => {
            try {
                // 🔥 Optimistic UI Update
                const now = Date.now();
                if (!attendance.isOnBreak) {
                    // Start Break
                    const elapsed = Math.floor((now - (attendance.clockInTime || now)) / 1000);
                    attendance.totalSecondsToday += Math.max(0, elapsed);
                    attendance.isOnBreak = true;
                } else {
                    // End Break
                    attendance.clockInTime = now;
                    attendance.isOnBreak = false;
                }
                updateAttendanceUI();

                // Background Sync
                await AttendanceService.toggleBreak();
                attendance = await AttendanceService.refreshState();
                updateAttendanceUI();
            } catch (err: any) {
                // Rollback on failure
                attendance = await AttendanceService.refreshState();
                updateAttendanceUI();
                dom.showAlert(err.message, 'danger');
            }
        });
    };

    // 3. Stats Grid
    const statsGrid = document.createElement('div');
    statsGrid.className = "grid grid-cols-1 md:grid-cols-3 gap-6";

    const updateStats = () => {
        const createStat = (title: string, value: string, sub: string, icon: string, color: string) => `
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-all duration-700"></div>
                <div class="relative z-10 flex flex-col h-full">
                    <div class="w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-xl mb-6 shadow-lg shadow-indigo-500/10">
                        ${icon}
                    </div>
                    <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">${title}</p>
                    <h3 class="text-4xl font-black text-slate-900 tracking-tighter mb-2">${value}</h3>
                    <div class="mt-auto pt-4 flex items-center gap-2">
                        <span class="text-[10px] font-bold py-1 px-3 rounded-full bg-slate-50 text-slate-500">${sub}</span>
                    </div>
                </div>
            </div>
        `;

        statsGrid.innerHTML = `
            ${createStat('Active Team', `${myTeam.length}`, 'Members in roster', '👥', 'bg-indigo-500 text-white')}
            ${createStat('Presence Ratio', '94%', 'Average daily', '⚡', 'bg-emerald-500 text-white')}
            ${createStat('Total Reach', `${allEmployees.length}`, 'Staff mapped', '🌍', 'bg-amber-500 text-white')}
        `;
    };

    // 4. Hero Action
    const renderHero = () => {
        const hero = document.createElement('div');
        hero.className = "bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6";
        hero.innerHTML = `
            <div>
                <h3 class="text-xl font-black text-slate-900 tracking-tight">Intelligence & Reporting</h3>
                <p class="text-slate-500 font-medium mt-1">Generate deep activity trackers for any employee.</p>
            </div>
            <button id="generate-report-btn" class="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all transform active:scale-95 shadow-xl shadow-indigo-100">
                Generate Report
            </button>
        `;
        hero.querySelector('#generate-report-btn')?.addEventListener('click', () => showReportModal());
        return hero;
    };

    // 5. Team Management Section
    const teamSection = document.createElement('div');
    teamSection.className = "bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col";

    const renderTeamUI = () => {
        const query = searchQuery.toLowerCase();
        let listToDisplay = activeTab === 'team' ? myTeam : allEmployees.filter(emp => !myTeam.some(m => m._id === emp._id) && emp._id !== user?.id);

        if (query) {
            listToDisplay = listToDisplay.filter(emp => 
                emp.name?.toLowerCase().includes(query) || 
                emp.position?.toLowerCase().includes(query) || 
                emp.location?.toLowerCase().includes(query) ||
                emp.email?.toLowerCase().includes(query)
            );
        }

        teamSection.innerHTML = `
            <div class="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h3 class="text-xl font-black text-slate-900 tracking-tight">Personnel Directory</h3>
                    <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage your team members and roster</p>
                </div>
                <div class="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button id="tab-team" class="px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'team' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">My Team</button>
                    <button id="tab-available" class="px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'available' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">All Employees</button>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50/50">
                            <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                            <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role / Position</th>
                            <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                            <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${listToDisplay.length === 0 ? `
                            <tr>
                                <td colspan="4" class="px-8 py-20 text-center text-slate-400 font-bold italic">No employees found in this section.</td>
                            </tr>
                        ` : listToDisplay.map(emp => `
                            <tr class="hover:bg-slate-50/50 transition-colors group">
                                <td class="px-8 py-5">
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                            ${emp.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p class="text-sm font-black text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors employee-report-link" data-id="${emp._id}">${emp.name}</p>
                                            <p class="text-[10px] text-slate-400 font-bold">${emp.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-8 py-5">
                                    <p class="text-xs font-black text-slate-700">${emp.position}</p>
                                    <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">${emp.company}</p>
                                </td>
                                <td class="px-8 py-5">
                                    <span class="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest">${emp.location}</span>
                                </td>
                                <td class="px-8 py-5 text-right">
                                    ${activeTab === 'available' ? `
                                        <button id="add-${emp._id}" data-id="${emp._id}" class="add-btn px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">Add to Team</button>
                                    ` : `
                                        <button id="remove-${emp._id}" data-id="${emp._id}" class="remove-btn px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all active:scale-95">Remove</button>
                                    `}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        teamSection.querySelector('#tab-team')?.addEventListener('click', () => { activeTab = 'team'; renderTeamUI(); });
        teamSection.querySelector('#tab-available')?.addEventListener('click', () => { activeTab = 'available'; renderTeamUI(); });

        teamSection.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const btnEl = e.currentTarget as HTMLButtonElement;
                const id = btnEl.getAttribute('data-id');
                if (!id) return;
                try {
                    // Optimistic UI Update
                    const employee = allEmployees.find(e => e._id === id);
                    if (employee) {
                        myTeam = [...myTeam, employee];
                        renderTeamUI();
                        dom.showAlert('Roster updated.', 'success');
                    }

                    const res = await APIClient.addToTeam(id);
                    if (!res.success) {
                        myTeam = myTeam.filter(m => m._id !== id);
                        renderTeamUI();
                        dom.showAlert('Sync failed. Please retry.', 'danger');
                    } else {
                        await fetchData();
                    }
                } catch (err: any) {
                    console.error(err);
                    await fetchData();
                }
            });
        });

        teamSection.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const btnEl = e.currentTarget as HTMLButtonElement;
                const id = btnEl.getAttribute('data-id');
                if (!id) return;
                try {
                    // Optimistic UI Update
                    const originalTeam = [...myTeam];
                    myTeam = myTeam.filter(m => m._id !== id);
                    renderTeamUI();
                    dom.showAlert('Member extracted from roster.', 'info');

                    const res = await APIClient.removeFromTeam(id);
                    if (!res.success) {
                        myTeam = originalTeam;
                        renderTeamUI();
                        dom.showAlert('Update failed.', 'danger');
                    } else {
                        await fetchData();
                    }
                } catch (err: any) {
                    console.error(err);
                    await fetchData();
                }
            });
        });

        teamSection.querySelectorAll('.employee-report-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
                if (id) {
                    showReportModal(id);
                }
            });
        });
    };

    // 6. Reports View for Manager
    const renderReports = () => {
        const container = document.createElement('div');
        container.className = "flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500";

        const formatTime = (seconds: number) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return `${h}h ${m}m`;
        };

        const today = new Date().toISOString().split('T')[0];
        const weeklyLogs = (stats?.weekly?.slice().reverse() || []).filter((log: any) => log && log.date);

        container.innerHTML = `
            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div class="flex items-center justify-between mb-10">
                    <h2 class="text-xl font-black text-slate-900 tracking-tight">Your Working Hours History</h2>
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Real-time Updates</span>
                    </div>
                </div>
                
                <div class="space-y-4">
                    ${weeklyLogs.length > 0 ? weeklyLogs.map((log: any) => {
            const isToday = log.date === today;
            const displaySeconds = isToday
                ? (attendance.isClockedIn && !attendance.isOnBreak && attendance.clockInTime
                    ? attendance.totalSecondsToday + Math.floor((Date.now() - attendance.clockInTime) / 1000)
                    : attendance.totalSecondsToday)
                : log.totalSeconds;

            const sessionsCount = (isToday && !attendance.isClockedIn && log.sessions === 0 && attendance.totalSecondsToday > 0)
                ? 1 // Optimistic session count if stats aren't synced yet
                : log.sessions;

            return `
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                            ${isToday ? '<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600"></div>' : ''}
                            <div class="flex items-center gap-5 relative z-10">
                                <div class="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center text-xl border border-slate-200 shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                                    🗓️
                                </div>
                                <div>
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">
                                        ${new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        ${isToday ? '<span class="ml-2 text-indigo-600 font-black">● Today</span>' : ''}
                                    </p>
                                    <h4 class="text-sm font-black text-slate-800">${sessionsCount} Active Session${sessionsCount !== 1 ? 's' : ''}</h4>
                                </div>
                            </div>
                            
                            <div class="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-6 relative z-10">
                                <div class="text-right">
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Worked Duration</p>
                                    <p class="text-lg font-black text-slate-900 tracking-tight" id="${isToday ? 'reports-today-timer' : ''}">
                                        ${formatTime(displaySeconds)}
                                    </p>
                                </div>
                                <div class="w-px h-8 bg-slate-200 hidden sm:block"></div>
                                <div class="text-right">
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Daily Goal</p>
                                    <div class="flex items-center gap-2">
                                        <div class="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div class="h-full bg-indigo-500 rounded-full" style="width: ${Math.min(100, (log.totalSeconds / (8 * 3600)) * 100)}%"></div>
                                        </div>
                                        <span class="text-xs font-black text-slate-500">${Math.round((log.totalSeconds / (8 * 3600)) * 100)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        `;
        }).join('') : `
                        <div class="p-12 text-center text-slate-400 font-bold italic">No history found for this week.</div>
                    `}
                </div>
            </div>
        `;

        return container;
    };

    // 7. Intelligence View (Team Performance)
    const renderIntelligence = () => {
        const container = document.createElement('div');
        container.className = "flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20";

        const chartHeader = (title: string, subtitle: string) => `
            <div class="flex flex-col mb-4">
              <h3 class="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-0.5">${title}</h3>
              <p class="text-xs font-black text-slate-900 uppercase tracking-widest">${subtitle}</p>
            </div>
        `;

        const chartToolbar = (title: string, subtitle: string, id: string) => `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                   <h3 class="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-0.5">${title}</h3>
                   <p class="text-xs font-black text-slate-900 uppercase tracking-widest">${subtitle}</p>
                </div>
                <div class="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <button data-action="sync" data-chart="${id}" title="Force Real-time Sync" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-indigo-600 text-slate-400 transition-all hover:scale-110 active:scale-95"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg></button>
                    <button data-action="minimize" data-chart="${id}" title="Collapse Chart" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-indigo-600 text-slate-400 transition-all hover:scale-110 active:scale-95"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"></path></svg></button>
                    <button data-action="search" data-chart="${id}" title="Analyze Details" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-indigo-600 text-slate-400 transition-all hover:scale-110 active:scale-95"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></button>
                    <button data-action="home" data-chart="${id}" title="Reset View" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-indigo-600 text-slate-400 transition-all hover:scale-110 active:scale-95"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg></button>
                    <button data-action="menu" data-chart="${id}" title="More Options" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-indigo-600 text-slate-400 transition-all hover:scale-110 active:scale-95"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
                </div>
            </div>
        `;

        const members = teamIntelligence?.members || [];
        const totals = teamIntelligence?.totals || { done: 0, pending: 0 };

        const query = searchQuery.toLowerCase();
        const filteredMembers = query ? members.filter((m: any) => 
            m.name?.toLowerCase().includes(query) || 
            m.position?.toLowerCase().includes(query)
        ) : members;

        if (filteredMembers.length > 0) {
            if (!filteredMembers.find((m: any) => m._id === selectedMemberId)) {
                selectedMemberId = filteredMembers[0]._id;
            }
        } else {
            selectedMemberId = null;
        }

        container.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h2 class="text-3xl font-black text-slate-900 tracking-tight">Team Intelligence</h2>
                    <p class="text-sm text-slate-500 font-medium mt-1">Real-time task synchronization & performance tracking</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live sync active
                    </span>
                    <div class="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Refresh: 5s
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <!-- Productivity & Efficiency Analytics (NEW) -->
                <div class="lg:col-span-12 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-100/30 transition-all duration-1000"></div>
                    
                    <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <!-- Productivity Flow -->
                        <div class="space-y-6">
                            ${chartToolbar('Operation Rhythm', 'Productivity Flow over Time', 'manager-prod')}
                            <div class="h-[280px] w-full" id="manager-prod-content">
                                <canvas id="managerProductivityChart"></canvas>
                            </div>
                            <div class="flex justify-center gap-8 mt-4">
                                <div class="flex items-center gap-2">
                                    <div class="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></div>
                                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Input (Tasks In)</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="w-2.5 h-2.5 rounded-full bg-[#6366F1]"></div>
                                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Output (Tasks Out)</span>
                                </div>
                            </div>
                        </div>

                        <!-- Task Efficiency -->
                        <div class="space-y-6">
                            ${chartToolbar('Accuracy & Precision', 'Task Efficiency (Success Vs Failure)', 'manager-eff')}
                            <div class="h-[280px] w-full" id="manager-eff-content">
                                <canvas id="managerEfficiencyChart"></canvas>
                            </div>
                            <div class="flex justify-center gap-8 mt-4">
                                <div class="flex items-center gap-2">
                                    <div class="w-2.5 h-2.5 rounded-full bg-[#10B981]"></div>
                                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency %</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></div>
                                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Review Errors</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Team Workload Distribution (List) -->
                <div class="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-fit">
                    ${chartHeader('Distribution', 'Workload Engine')}
                    <div class="space-y-3 mt-4 overflow-y-auto max-h-[500px] pr-2">
                        ${(() => {
                            const query = searchQuery.toLowerCase();
                            const filteredMembers = query ? members.filter((m: any) => 
                                m.name?.toLowerCase().includes(query) || 
                                m.position?.toLowerCase().includes(query)
                            ) : members;

                            if (filteredMembers.length === 0) {
                                return `<p class="text-center py-10 text-slate-400 italic">${query ? 'No matching members' : 'No team members available'}</p>`;
                            }

                            return filteredMembers.map((m: any) => {
            const total = m.tasks.todo + m.tasks.inProgress + m.tasks.review + m.tasks.done;
            const isSelected = selectedMemberId === m._id;
            const completionRate = total > 0 ? Math.round((m.tasks.done / total) * 100) : 0;

            return `
                            <div class="member-selector group cursor-pointer p-5 rounded-3xl border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-50 hover:border-slate-200 bg-slate-50/50'}" data-member-id="${m._id}">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-2xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'} flex items-center justify-center font-black text-sm shadow-sm">
                                            ${m.name[0]}
                                        </div>
                                        <div>
                                            <p class="text-xs font-black text-slate-900">${m.name}</p>
                                            <p class="text-[9px] text-slate-400 font-bold uppercase">${m.position}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-[10px] font-black text-slate-900">${completionRate}%</p>
                                        <p class="text-[8px] text-slate-400 font-bold uppercase">Efficiency</p>
                                    </div>
                                </div>
                                <div class="h-1.5 bg-white rounded-full overflow-hidden border border-slate-100">
                                    <div class="bg-indigo-500 h-full rounded-full transition-all duration-1000" style="width: ${completionRate}%"></div>
                                </div>
                                <div class="flex justify-between mt-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>${m.tasks.done} Done</span>
                                    <span>${total - m.tasks.done} Pending</span>
                                </div>
                            </div>
                        `;
        }).join('');
                        })()}
                    </div>
                </div>

                <!-- Live Member Task Board (Drill down) -->
                <div class="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[600px]">
                    ${selectedMemberId ? renderSelectedBoard() : `
                        <div class="flex flex-col items-center justify-center h-full text-center py-20 grayscale opacity-50">
                            <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-4">📌</div>
                            <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest">Board Locked</h4>
                            <p class="text-xs text-slate-400 font-medium mt-2 max-w-[200px]">Select a team member to unlock their live task stream.</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        function renderSelectedBoard() {
            const member = members.find((m: any) => m._id === selectedMemberId);
            if (!member) return '';

            const query = searchQuery.toLowerCase();
            const memberTasks = allTeamTasks.filter(t => (t.employee?._id || t.employee) === selectedMemberId);
            const tasks = query ? memberTasks.filter(t => 
                t.title?.toLowerCase().includes(query) || 
                t.description?.toLowerCase().includes(query)
            ) : memberTasks;

            return `
                <div class="flex justify-between items-center mb-10 border-b border-slate-50 pb-8">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-indigo-100">
                            ${member.name[0]}
                        </div>
                        <div>
                            <h3 class="text-2xl font-black text-slate-900 tracking-tight">${member.name}</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">${member.position}</span>
                                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${tasks.length} Active Protocols</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    ${tasks.length === 0 ? `
                        <div class="flex flex-col items-center justify-center py-24 opacity-20">
                            <span class="text-5xl mb-4">🍃</span>
                            <p class="text-xs font-black uppercase tracking-widest">Protocol Clear</p>
                        </div>
                    ` : tasks.map(t => `
                        <div class="task-item-card p-6 bg-slate-50/50 rounded-3xl border-2 border-slate-100/50 hover:border-indigo-500 hover:bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer group" data-task-id="${t._id}">
                            <div class="flex justify-between items-start mb-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-2.5 h-2.5 rounded-full ${t.priority === 'high' ? 'bg-rose-500 animate-pulse' : (t.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')} shadow-sm"></div>
                                    <h4 class="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">${t.title}</h4>
                                </div>
                                <span class="text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${t.status === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}">
                                    ${t.status}
                                </span>
                            </div>
                            <p class="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">${t.description || 'No detailed instructions provided.'}</p>
                            
                            <div class="flex items-center justify-between mt-5 pt-5 border-t border-slate-100/50">
                                <div class="flex items-center gap-4">
                                    <div class="flex -space-x-1">
                                        <div class="w-5 h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[7px] font-black text-indigo-600 uppercase">${member.name[0]}</div>
                                    </div>
                                    <span class="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Updated ${new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <button class="text-[9px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    Refine Task ➔
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // --- Event Listeners ---
        container.querySelector('#add-task-trigger')?.addEventListener('click', () => showCreateTaskModal());

        container.querySelectorAll('.member-selector').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-member-id');
                if (id) {
                    selectedMemberId = id;
                    refreshDashboard();
                }
            });
        });

        container.querySelectorAll('.task-item-card').forEach(card => {
            card.addEventListener('click', () => {
                const taskId = card.getAttribute('data-task-id');
                const task = allTeamTasks.find(t => t._id === taskId);
                if (task) showEditTaskModal(task);
            });
        });

        // Initialize Charts (Optimized)
        setTimeout(() => {
            const prodCtx = (container.querySelector('#managerProductivityChart') as HTMLCanvasElement)?.getContext('2d');
            const effCtx = (container.querySelector('#managerEfficiencyChart') as HTMLCanvasElement)?.getContext('2d');

            if (!prodCtx || !effCtx || !teamIntelligence?.graphs) return;

            if (productivityChart && efficiencyChart && !teamIntelligence._dataChangedSinceLastRender) {
                return;
            }
            teamIntelligence._dataChangedSinceLastRender = false;

            if (productivityChart) productivityChart.destroy();
            if (efficiencyChart) efficiencyChart.destroy();

            // @ts-ignore
            productivityChart = new Chart(prodCtx, {
                type: 'line',
                data: {
                    labels: teamIntelligence.graphs.productivityFlow.map((d: any) => d.time),
                    datasets: [
                        {
                            label: 'Input',
                            data: teamIntelligence.graphs.productivityFlow.map((d: any) => d.input),
                            borderColor: '#F59E0B',
                            backgroundColor: '#F59E0B',
                            tension: 0.4,
                            borderWidth: 4,
                            pointRadius: 0
                        },
                        {
                            label: 'Output',
                            data: teamIntelligence.graphs.productivityFlow.map((d: any) => d.output),
                            borderColor: '#6366F1',
                            backgroundColor: '#6366F1',
                            tension: 0.4,
                            borderWidth: 4,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { 
                        y: { beginAtZero: true, grid: { display: false }, ticks: { display: false } },
                        x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' }, color: '#94A3B8' } }
                    }
                }
            });

            // @ts-ignore
            efficiencyChart = new Chart(effCtx, {
                type: 'line',
                data: {
                    labels: teamIntelligence.graphs.efficiencyMetrics.map((d: any) => d.time),
                    datasets: [
                        {
                            label: 'Efficiency',
                            data: teamIntelligence.graphs.efficiencyMetrics.map((d: any) => d.efficiency),
                            borderColor: '#10B981',
                            backgroundColor: '#10B981',
                            tension: 0.4,
                            borderWidth: 4,
                            pointRadius: 0
                        },
                        {
                            label: 'Errors',
                            data: teamIntelligence.graphs.efficiencyMetrics.map((d: any) => d.errors),
                            borderColor: '#EF4444',
                            backgroundColor: '#EF4444',
                            tension: 0.4,
                            borderWidth: 4,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { 
                        y: { beginAtZero: true, grid: { display: false }, ticks: { display: false } },
                        x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' }, color: '#94A3B8' } }
                    }
                }
            });
        }, 100);

        container.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = (e.currentTarget as HTMLElement).dataset.action;
                if (action === 'sync') {
                    dom.showAlert('Initiating deep sync with protocol server...', 'info');
                    fetchData();
                } else if (action === 'home') {
                    currentMainTab = 'overview';
                    refreshDashboard();
                } else if (action === 'search') {
                    currentMainTab = 'reports';
                    refreshDashboard();
                } else if (action === 'minimize') {
                    const chartId = (e.currentTarget as HTMLElement).dataset.chart;
                    const content = container.querySelector(`#${chartId}-content`);
                    if (content) {
                        content.classList.toggle('hidden');
                        dom.showAlert(content.classList.contains('hidden') ? 'Metric view collapsed' : 'Metric view expanded', 'info');
                    }
                } else if (action === 'menu') {
                    dom.showAlert('Managerial export protocols restricted to administrators.', 'warning');
                }
            });
        });

        return container;
    };



    // 8. Settings View
    const renderSettings = () => {
        const container = document.createElement('div');
        container.className = "flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20";

        // Simulated Local State for Toggles
        const configState = JSON.parse(localStorage.getItem('manager_config') || '{"syncAlerts": true, "weeklyDigest": false}');

        const saveConfig = (key: string, val: boolean) => {
            configState[key] = val;
            localStorage.setItem('manager_config', JSON.stringify(configState));
        };

        const renderToggles = () => {
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-6 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Team Notifications</p>
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-slate-600">Sync Alerts</span>
                            <div id="toggle-sync" class="w-10 h-5 ${configState.syncAlerts ? 'bg-indigo-600' : 'bg-slate-300'} rounded-full relative cursor-pointer transition-colors duration-300">
                                <div class="absolute ${configState.syncAlerts ? 'right-1' : 'left-1'} top-1 w-3 h-3 bg-white rounded-full transition-all"></div>
                            </div>
                        </div>
                        <p class="text-[8px] text-slate-400 font-medium mt-3 leading-relaxed">Alerts for clock-ins, clock-outs, and new reports.</p>
                    </div>

                    <div class="p-6 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Auto-Insights</p>
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-slate-600">Weekly Digest</span>
                            <div id="toggle-weekly" class="w-10 h-5 ${configState.weeklyDigest ? 'bg-indigo-600' : 'bg-slate-300'} rounded-full relative cursor-pointer transition-colors duration-300">
                                <div class="absolute ${configState.weeklyDigest ? 'right-1' : 'left-1'} top-1 w-3 h-3 bg-white rounded-full transition-all"></div>
                            </div>
                        </div>
                        <p class="text-[8px] text-slate-400 font-medium mt-3 leading-relaxed">Automated weekend summary of team performance.</p>
                    </div>
                </div>
            `;
        };

        container.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left Column: Profile Card -->
                <div class="lg:col-span-1 space-y-8">
                    <div class="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden relative group">
                        <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <div class="relative pt-12 flex flex-col items-center text-center">
                            <div class="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-indigo-600 to-purple-600 p-1 mb-6 shadow-xl relative group">
                                <div class="w-full h-full rounded-[2.2rem] bg-white flex items-center justify-center text-5xl text-indigo-600 font-black">
                                    ${(user?.name?.[0] || 'M').toUpperCase()}
                                </div>
                                <div class="absolute inset-0 bg-slate-900/60 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <span class="text-[10px] font-black text-white uppercase tracking-widest">Change</span>
                                </div>
                            </div>
                            <h3 class="text-2xl font-black text-slate-900 tracking-tight">${user?.name}</h3>
                            <p class="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest mt-2">${user?.position || 'Manager'}</p>
                            
                            <div class="w-full grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100">
                                <div>
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <p class="text-xs font-bold text-emerald-500 flex items-center justify-center gap-1.5">
                                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                    </p>
                                </div>
                                <div>
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Role</p>
                                    <p class="text-xs font-bold text-slate-700 uppercase tracking-widest">${user?.role || 'Staff'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-slate-900 p-8 rounded-[3rem] shadow-xl text-white relative overflow-hidden group">
                        <div class="relative z-10">
                            <h4 class="text-lg font-black tracking-tight mb-2">Manager Pro Tips</h4>
                            <p class="text-xs text-slate-400 font-medium leading-relaxed">Ensure your team's availability is synchronized with your timezone for accurate real-time tracking.</p>
                            <button id="knowledge-base-btn" class="mt-4 px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Knowledge Base</button>
                        </div>
                        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
                    </div>
                </div>

                <!-- Right Column: Settings Sections -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Section: Personal Information -->
                    <div class="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden transition-all">
                        <div class="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-lg shadow-indigo-100">👤</div>
                                <div>
                                    <h4 class="text-lg font-black text-slate-900 tracking-tight">Identity Roster</h4>
                                    <p class="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Corporate Verified Profile</p>
                                </div>
                            </div>
                            <span class="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Authenticated
                            </span>
                        </div>
                        
                        <div class="p-8 md:p-10 space-y-8">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div class="relative group">
                                    <label class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block px-1">Legal Full Name</label>
                                    <div class="flex items-center gap-4 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl group-hover:border-indigo-100 transition-all">
                                        <div class="text-xl">📛</div>
                                        <div class="flex-1">
                                            <p class="text-sm font-black text-slate-900">${user?.name || 'Venkata Naveen Adusumalli'}</p>
                                            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Primary Identity</p>
                                        </div>
                                        <div class="text-indigo-500 text-xs font-black">✓</div>
                                    </div>
                                </div>
                                
                                <div class="relative group">
                                    <label class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block px-1">Corporate Email</label>
                                    <div class="flex items-center gap-4 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl group-hover:border-indigo-100 transition-all">
                                        <div class="text-xl">📧</div>
                                        <div class="flex-1">
                                            <p class="text-sm font-black text-slate-900">${user?.email || 'avnnaidu4362@gmail.com'}</p>
                                            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verified Alias</p>
                                        </div>
                                        <div class="text-indigo-500 text-xs font-black">✓</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                                <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-indigo-50 shrink-0">🏛️</div>
                                <div>
                                    <h5 class="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Central Directory Sync</h5>
                                    <p class="text-xs text-indigo-700 font-medium leading-relaxed">Personal identifiers are synchronized with the <strong>Global HR Directory</strong>. To update these records, please submit a modification request through the <span id="link-governance-portal" class="underline cursor-pointer decoration-2 underline-offset-4 font-black">Governance Portal</span>.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section: Security & Access -->
                    <div class="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 shadow-sm transition-all">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl border border-amber-100 shadow-sm">🔐</div>
                            <div>
                                <h4 class="text-xl font-black text-slate-900 tracking-tight">Security & Governance</h4>
                                <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Control access to your management portal</p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-white hover:border-indigo-100 transition-all cursor-pointer">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">🔑</div>
                                    <div>
                                        <p class="text-sm font-black text-slate-700">System Password</p>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enhanced rotation recommended</p>
                                    </div>
                                </div>
                                <button id="change-password-trigger" class="w-full sm:w-auto px-6 py-3 bg-slate-200 group-hover:bg-indigo-600 text-slate-600 group-hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Modify</button>
                            </div>

                            <div class="p-6 rounded-3xl bg-rose-50 border border-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-rose-600 transition-all cursor-pointer">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-2xl bg-white border border-rose-200 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">💣</div>
                                    <div>
                                        <p class="text-sm font-black text-slate-700 group-hover:text-white">Account Deletion</p>
                                        <p class="text-[10px] text-rose-400 group-hover:text-rose-200 font-bold uppercase tracking-widest">Permanent extraction</p>
                                    </div>
                                </div>
                                <button id="delete-account-trigger" class="w-full sm:w-auto px-6 py-3 bg-rose-100 group-hover:bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Execute</button>
                            </div>
                        </div>
                    </div>

                    <!-- Section: Manager Preferences -->
                    <div class="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 shadow-sm">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl border border-emerald-100 shadow-sm">⚙️</div>
                            <div>
                                <h4 class="text-xl font-black text-slate-900 tracking-tight">Portal Configuration</h4>
                                <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Customize your oversight experience</p>
                            </div>
                        </div>

                        <div id="toggles-container">
                            ${renderToggles()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Toggle Event Handlers
        const attachToggleHandlers = () => {
            const syncToggle = container.querySelector('#toggle-sync') as HTMLElement;
            const weeklyToggle = container.querySelector('#toggle-weekly') as HTMLElement;

            syncToggle?.addEventListener('click', () => {
                saveConfig('syncAlerts', !configState.syncAlerts);
                container.querySelector('#toggles-container')!.innerHTML = renderToggles();
                attachToggleHandlers();
                dom.showAlert(`Sync Alerts ${configState.syncAlerts ? 'enabled' : 'disabled'}`, 'success');
            });

            weeklyToggle?.addEventListener('click', () => {
                saveConfig('weeklyDigest', !configState.weeklyDigest);
                container.querySelector('#toggles-container')!.innerHTML = renderToggles();
                attachToggleHandlers();
                dom.showAlert(`Weekly Digest ${configState.weeklyDigest ? 'enabled' : 'disabled'}`, 'success');
            });
        };

        attachToggleHandlers();

        // Knowledge Base Modal
        container.querySelector('#knowledge-base-btn')?.addEventListener('click', () => {
            const modal = document.createElement('div');
            modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300";
            modal.innerHTML = `
                <div class="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    <div class="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h4 class="text-2xl font-black text-slate-900 tracking-tight">Manager Playbook</h4>
                            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Personnel Management Guidelines</p>
                        </div>
                        <button id="close-kb-modal" class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">✕</button>
                    </div>
                    <div class="p-10 overflow-y-auto space-y-8">
                        <div class="space-y-4">
                            <h5 class="text-sm font-black text-indigo-600 uppercase tracking-widest">Real-time Oversight</h5>
                            <p class="text-sm text-slate-600 leading-relaxed font-medium">Use the **Intelligence** tab to monitor task velocity. Real-time updates ensure that the "Team IQ" scores reflect current output levels immediately.</p>
                        </div>
                        <div class="space-y-4 border-t border-slate-50 pt-8">
                            <h5 class="text-sm font-black text-emerald-600 uppercase tracking-widest">Team Dynamics</h5>
                            <p class="text-sm text-slate-600 leading-relaxed font-medium">Regularly sync with team members via the **My Team** section. Checking attendance history in **Reports** helps identify burnout patterns early.</p>
                        </div>
                        <div class="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 italic text-xs text-indigo-700 font-medium">
                            "Great management isn't just about tracking hours; it's about enabling growth and maintaining a steady rhythm of delivery."
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('#close-kb-modal')?.addEventListener('click', () => modal.remove());
        });

        // Governance Portal Handler
        container.querySelector('#link-governance-portal')?.addEventListener('click', () => {
            const modal = document.createElement('div');
            modal.className = "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300";
            modal.innerHTML = `
                <div class="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
                    <div class="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-indigo-900 text-white">
                        <div>
                            <h4 class="text-2xl font-black tracking-tight">Governance Portal</h4>
                            <p class="text-[9px] text-indigo-300 font-black uppercase tracking-[0.2em] mt-1">Identity Modification Protocol</p>
                        </div>
                        <button id="close-gov-modal" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-indigo-900 transition-all font-bold">✕</button>
                    </div>
                    
                    <div class="p-10 space-y-8">
                        <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100 italic text-[11px] text-slate-500 font-medium leading-relaxed">
                            "You are accessing the Corporate Governance layer. Any changes requested here will undergo a manual verification process by the Global HR Operations team."
                        </div>
                        
                        <form id="gov-request-form" class="space-y-6">
                            <div class="grid gap-4">
                                <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Nature of Modification</label>
                                <select required class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:border-indigo-500 outline-none transition-all">
                                    <option value="">Select category...</option>
                                    <option value="name">Legal Name Correction</option>
                                    <option value="email">Corporate Email Re-assignment</option>
                                    <option value="marriage">Marital Status / Name Update</option>
                                </select>
                            </div>
                            
                            <div class="grid gap-4">
                                <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Proposed Value</label>
                                <input type="text" required placeholder="Enter new corporate identity..." class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:border-indigo-500 outline-none transition-all">
                            </div>
                            
                            <div class="grid gap-4">
                                <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Supporting Context (Reason)</label>
                                <textarea required rows="3" placeholder="Explain the necessity for this change..." class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:border-indigo-500 outline-none transition-all"></textarea>
                            </div>
                            
                            <button type="submit" class="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]">
                                Submit Formal Request
                            </button>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#close-gov-modal')?.addEventListener('click', () => modal.remove());
            modal.querySelector('#gov-request-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                dom.showAlert("Governance request transmitted to HR. Ticket ID: #GOV-" + Math.floor(Math.random() * 100000), "success");
                modal.remove();
            });
        });

        // Profile Update Handler removed as identity details are read-only

        // Change Password Handler
        container.querySelector('#change-password-trigger')?.addEventListener('click', () => {
            const modal = document.createElement('div');
            modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300";
            modal.innerHTML = `
                <div class="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
                    <div class="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h4 class="text-2xl font-black text-slate-900 tracking-tight">Modify Credentials</h4>
                            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Enhance your account barrier</p>
                        </div>
                        <button id="close-pw-modal" class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm">✕</button>
                    </div>
                    <form id="change-pw-form" class="p-10 space-y-6">
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Current Password</label>
                            <input name="currentPassword" type="password" required class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:border-indigo-500 outline-none transition-all" placeholder="••••••••">
                        </div>
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">New Password</label>
                            <input name="newPassword" type="password" required class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:border-indigo-500 outline-none transition-all" placeholder="••••••••">
                        </div>
                        <button type="submit" id="submit-pw-btn" class="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100">
                            Apply Changes
                        </button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#close-pw-modal')?.addEventListener('click', () => modal.remove());
            const pwForm = modal.querySelector('#change-pw-form') as HTMLFormElement;
            pwForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(pwForm);
                const currentPassword = formData.get('currentPassword') as string;
                const newPassword = formData.get('newPassword') as string;

                try {
                    dom.showLoading('submit-pw-btn', 'Applying...');
                    const res = await APIClient.changePassword(currentPassword, newPassword);
                    if (res.success) {
                        dom.showAlert('Password specialized successfully!', 'success');
                        modal.remove();
                    }
                } catch (err: any) {
                    dom.showAlert(err.message, 'danger');
                } finally {
                    dom.hideLoading('submit-pw-btn', 'Apply Changes');
                }
            });
        });

        // Delete Account Handler
        container.querySelector('#delete-account-trigger')?.addEventListener('click', async () => {
            if (!confirm('EXTREME CAUTION: You are about to permanently delete your manager account. This extraction cannot be undone. Are you sure?')) return;

            try {
                const res = await APIClient.deleteAccount();
                if (res.success) {
                    dom.showAlert('Account successfully extracted.', 'success');
                    AuthService.logout();
                }
            } catch (err: any) {
                dom.showAlert(err.message, 'danger');
            }
        });

        return container;
    };

    // 9. Time Off / Leave Management View
    const renderLeaves = () => {
        const container = document.createElement('div');
        container.className = "flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500";

        const publicHolidays = [
            { name: 'New Year\'s Day', date: '2026-01-01', type: 'Public' },
            { name: 'Republic Day', date: '2026-01-26', type: 'Public' },
            { name: 'Maha Shivaratri', date: '2026-02-26', type: 'Restricted' },
            { name: 'Holi', date: '2026-03-14', type: 'Holiday' },
            { name: 'Good Friday', date: '2026-04-03', type: 'Public' },
            { name: 'Ambedkar Jayanti', date: '2026-04-14', type: 'Public' },
            { name: 'May Day', date: '2026-05-01', type: 'Holiday' },
            { name: 'Independence Day', date: '2026-08-15', type: 'Public' },
            { name: 'Ganesh Chaturthi', date: '2026-08-25', type: 'Restricted' },
            { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'Public' },
            { name: 'Dussehra', date: '2026-10-11', type: 'Public' },
            { name: 'Diwali', date: '2026-10-21', type: 'Public' },
            { name: 'Christmas', date: '2026-12-25', type: 'Public' }
        ];

        container.innerHTML = `
            <div class="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm self-start mb-6">
                <button id="tab-leave-requests" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeLeaveView === 'requests' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}">Pending Requests</button>
                <button id="tab-holiday-calendar-view" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeLeaveView === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}">Company Calendar</button>
            </div>

            ${activeLeaveView === 'requests' ? `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Leave Requests List -->
                    <div class="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 class="text-xl font-black text-slate-900 tracking-tight">Team Leave Requests</h3>
                                <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Review and manage time-off applications</p>
                            </div>
                            <span class="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">${teamLeaves.filter(l => l.status === 'pending').length} Pending</span>
                        </div>
                        
                        <div class="p-8 pb-4">
                            <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Pending Requests</h4>
                            <div class="space-y-4">
                                ${(() => {
                                    const query = searchQuery.toLowerCase();
                                    const pending = teamLeaves.filter(l => l.status === 'pending');
                                    const filtered = query ? pending.filter(l => 
                                        l.employee?.name?.toLowerCase().includes(query) || 
                                        l.reason?.toLowerCase().includes(query) || 
                                        l.type?.toLowerCase().includes(query)
                                    ) : pending;

                                    return filtered.map(leave => `
                                    <div class="p-6 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all rounded-3xl border-2 border-slate-50 group">
                                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div class="flex items-center gap-4">
                                                <div class="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                                    ${leave.type === 'sick' ? '🤒' : (leave.type === 'vacation' ? '🏖️' : '🏠')}
                                                </div>
                                                <div>
                                                    <div class="flex items-center gap-2">
                                                        <h4 class="text-sm font-black text-slate-900">${leave.employee?.name || 'Unknown'}</h4>
                                                        <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest">${leave.type}</span>
                                                    </div>
                                                    <p class="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                                                        ${new Date(leave.startDate).toLocaleDateString()} — ${new Date(leave.endDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div class="flex items-center gap-3 w-full md:w-auto">
                                                <button data-action="approve" data-id="${leave._id}" class="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 text-white hover:bg-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-100/50">Approve</button>
                                                <button data-action="reject" data-id="${leave._id}" class="flex-1 md:flex-none px-6 py-2.5 bg-white text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 border-rose-100">Reject</button>
                                            </div>
                                        </div>
                                        <div class="mt-4 p-4 bg-white/50 rounded-2xl border border-slate-100/50">
                                            <p class="text-[11px] font-bold text-slate-500 italic">"${leave.reason}"</p>
                                        </div>
                                    </div>
                                    `).join('') + (filtered.length === 0 ? `<div class="py-10 text-center text-slate-400 font-bold italic border-2 border-dashed border-slate-100 rounded-3xl">No ${query ? 'matching' : 'pending'} requests at this time.</div>` : '');
                                })()}
                            </div>
                        </div>

                        <div class="p-8 border-t border-slate-50">
                            <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Completed History</h4>
                            <div class="space-y-3">
                                ${(() => {
                                    const query = searchQuery.toLowerCase();
                                    const history = teamLeaves.filter(l => l.status !== 'pending');
                                    const filtered = query ? history.filter(l => 
                                        l.employee?.name?.toLowerCase().includes(query) || 
                                        l.status?.toLowerCase().includes(query) || 
                                        l.type?.toLowerCase().includes(query)
                                    ) : history;

                                    if (filtered.length === 0) {
                                        return `<div class="py-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">${query ? 'No matching results' : 'Archive Empty'}</div>`;
                                    }

                                    return filtered.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(leave => `
                                    <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white transition-all group">
                                        <div class="flex items-center gap-4">
                                            <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg border border-slate-100 grayscale group-hover:grayscale-0 transition-all">
                                                ${leave.type === 'sick' ? '🤒' : (leave.type === 'vacation' ? '🏖️' : '🏠')}
                                            </div>
                                            <div>
                                                <p class="text-xs font-black text-slate-700">${leave.employee?.name || 'Unknown'}</p>
                                                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">${new Date(leave.startDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - ${new Date(leave.endDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</p>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-4">
                                            <div class="text-right hidden sm:block">
                                                <p class="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Decision Date</p>
                                                <p class="text-[10px] font-bold text-slate-500">${new Date(leave.updatedAt || leave.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <span class="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${leave.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}">
                                                ${leave.status}
                                            </span>
                                        </div>
                                    </div>
                                    `).join('');
                                })()}
                            </div>
                        </div>
                    </div>

                    <!-- Calendar / Holidays Column -->
                    <div class="space-y-8">
                        <div class="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                            <div class="relative z-10 text-center">
                                <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Today's Date</p>
                                <h2 class="text-5xl font-black tracking-tighter mb-1">${new Date().getDate()}</h2>
                                <p class="text-lg font-bold">${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                <div class="mt-8 grid grid-cols-7 gap-1 opacity-50">
                                    ${Array.from({ length: 7 }).map((_, i) => `<div class="text-[8px] font-black">${['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}</div>`).join('')}
                                </div>
                            </div>
                            <div class="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700"></div>
                        </div>

                        <div class="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                            <h4 class="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center justify-between">
                                Upcoming Holidays
                                <span class="text-indigo-600">🇮🇳</span>
                            </h4>
                            <div class="space-y-4">
                                ${publicHolidays.slice(0, 5).map(h => `
                                    <div class="flex items-center justify-between group">
                                        <div class="flex items-center gap-3">
                                            <div class="w-1.5 h-1.5 rounded-full ${h.type === 'Public' ? 'bg-indigo-500' : 'bg-slate-300'}"></div>
                                            <div>
                                                <p class="text-[10px] font-black text-slate-800">${h.name}</p>
                                                <p class="text-[9px] font-bold text-slate-400 uppercase">${new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                    `).join('')}
                            </div>
                            <button id="btn-view-all-holidays" class="w-full mt-8 py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-100">Annual Calendar →</button>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="bg-indigo-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
                    <div class="relative z-10">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                            <div>
                                <h3 class="text-3xl font-black tracking-tightest">2026 Annual Holiday Roster</h3>
                                <p class="text-indigo-300 text-xs font-bold uppercase tracking-widest mt-2">Certified company holidays and observation dates</p>
                            </div>
                            <button id="btn-back-to-requests" class="px-8 py-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md border border-white/10">Return to requests</button>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            ${publicHolidays.map(h => `
                                <div class="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                                    <div class="flex justify-between items-start mb-6">
                                        <div class="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                            🏖️
                                        </div>
                                        <span class="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-200">
                                            ${h.type}
                                        </span>
                                    </div>
                                    <h4 class="text-lg font-black text-white mb-1">${h.name}</h4>
                                    <p class="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">
                                        ${new Date(h.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px]"></div>
                </div>
            `}
        `;

        container.querySelector('#tab-leave-requests')?.addEventListener('click', () => {
            activeLeaveView = 'requests';
            refreshDashboard();
        });

        container.querySelector('#tab-holiday-calendar-view')?.addEventListener('click', () => {
            activeLeaveView = 'calendar';
            refreshDashboard();
        });

        container.querySelector('#btn-view-all-holidays')?.addEventListener('click', () => {
            activeLeaveView = 'calendar';
            refreshDashboard();
        });

        container.querySelector('#btn-back-to-requests')?.addEventListener('click', () => {
            activeLeaveView = 'requests';
            refreshDashboard();
        });

        container.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = (e.currentTarget as HTMLButtonElement).getAttribute('data-action');
                const leaveId = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
                if (!leaveId) return;

                const status = action === 'approve' ? 'approved' : 'rejected';
                try {
                    // Optimistic UI Update
                    const originalLeaves = [...teamLeaves];
                    const leaveIdx = teamLeaves.findIndex(l => l._id === leaveId);
                    if (leaveIdx > -1) {
                        teamLeaves[leaveIdx] = { ...teamLeaves[leaveIdx], status };
                        refreshDashboard();
                        dom.showAlert(`Decision synchronized.`, 'success');
                    }

                    const res = await APIClient.updateLeaveStatus(leaveId, status);
                    if (!res.success) {
                        teamLeaves = originalLeaves;
                        refreshDashboard();
                        dom.showAlert('Sync error. Action reverted.', 'danger');
                    } else {
                        await fetchData();
                    }
                } catch (err: any) {
                    console.error(err);
                    await fetchData();
                }
            });
        });

        return container;
    };

    // 10. General Refresh/Tab Logic
    const refreshDashboard = () => {
        const searchInput = document.getElementById('global-search') as HTMLInputElement;
        const isSearchFocused = document.activeElement === searchInput;
        const selectionStart = searchInput?.selectionStart;
        const selectionEnd = searchInput?.selectionEnd;

        main.innerHTML = '';
        renderSidebar();
        renderTopBar();
        renderHeaderTitle();
        main.appendChild(header);

        // Restore focus
        if (isSearchFocused) {
            requestAnimationFrame(() => {
                const s = document.getElementById('global-search') as HTMLInputElement;
                if (s) {
                    s.focus();
                    if (selectionStart !== null) s.setSelectionRange(selectionStart, selectionEnd || selectionStart);
                }
            });
        }

        // Attach Quick Task Listener
        header.querySelector('#quick-task-btn')?.addEventListener('click', () => showCreateTaskModal());

        if (currentMainTab === 'overview') {
            const topGrid = document.createElement('div');
            topGrid.className = "grid grid-cols-1 lg:grid-cols-3 gap-8 items-start";

            attendanceCard.className = "lg:col-span-2 bg-white border border-slate-200 p-10 rounded-[3rem] shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group";
            updateAttendanceUI();

            // Team at a Glance Widget
            const quickTeam = document.createElement('div');
            quickTeam.className = "bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm h-full flex flex-col";
            quickTeam.innerHTML = `
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xs font-black uppercase tracking-widest text-slate-900">My Team</h3>
                    <span id="view-all-team-btn" class="text-xs font-bold text-indigo-600 cursor-pointer hover:underline underline-offset-4">View All →</span>
                </div>
                <div class="space-y-4 flex-1">
                    ${(() => {
                        const query = searchQuery.toLowerCase();
                        const filteredTeam = query ? myTeam.filter(m => 
                            m.name?.toLowerCase().includes(query) || 
                            m.position?.toLowerCase().includes(query)
                        ) : myTeam;

                        if (filteredTeam.length === 0) {
                            return `<p class="text-xs text-slate-400 italic text-center py-4">${query ? 'No matching members' : 'No team members yet'}</p>`;
                        }

                        return filteredTeam.slice(0, 4).map(m => `
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                                    ${m.name[0]}
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs font-bold text-slate-900 leading-none">${m.name}</p>
                                    <p class="text-[9px] text-slate-400 font-medium mt-1 uppercase">${m.position}</p>
                                </div>
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            </div>
                        `).join('');
                    })()}
                </div>
            `;

            quickTeam.querySelector('#view-all-team-btn')?.addEventListener('click', () => {
                currentMainTab = 'team';
                refreshDashboard();
            });

            topGrid.appendChild(attendanceCard);
            topGrid.appendChild(quickTeam);
            main.appendChild(topGrid);

            updateStats();
            main.appendChild(statsGrid);
            main.appendChild(renderHero());

            // Secondary row: Quick Actions
            const secondaryRow = document.createElement('div');
            secondaryRow.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8";

            const announcements = document.createElement('div');
            announcements.className = "bg-slate-900 p-8 rounded-[3rem] shadow-xl shadow-slate-200 relative overflow-hidden group cursor-pointer";
            announcements.innerHTML = `
                <div class="relative z-10">
                    <span class="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-widest border border-white/10">Announcement</span>
                    <h4 class="text-lg font-black text-white mt-4 tracking-tight">Q1 Performance Review is now live.</h4>
                    <p class="text-xs text-slate-400 font-medium mt-2 leading-relaxed">Check your team's metrics and submit feedback by Friday.</p>
                </div>
                <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
            `;

            const performanceShortcut = document.createElement('div');
            performanceShortcut.className = "bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm flex flex-col justify-center items-center text-center group cursor-pointer hover:border-indigo-500/30 transition-all";
            performanceShortcut.innerHTML = `
                 <div class="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-all">✨</div>
                 <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest">Team IQ</h4>
                 <p class="text-xs text-slate-400 font-medium mt-2">View advanced velocity metrics</p>
            `;
            performanceShortcut.onclick = () => { currentMainTab = 'intelligence'; refreshDashboard(); };

            const requestLeaveShortcut = document.createElement('div');
            requestLeaveShortcut.className = "bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm flex flex-col justify-center items-center text-center group cursor-pointer hover:border-indigo-500/30 transition-all";
            requestLeaveShortcut.innerHTML = `
                 <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-all">🌴</div>
                 <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest">Time Off</h4>
                 <p class="text-xs text-slate-400 font-medium mt-2">Plan your upcoming leaves</p>
            `;

            secondaryRow.appendChild(announcements);
            secondaryRow.appendChild(performanceShortcut);
            secondaryRow.appendChild(requestLeaveShortcut);
            main.appendChild(secondaryRow);

            // Real-time Tasks Widget
            const tasksWidget = document.createElement('div');
            tasksWidget.className = "bg-white border border-slate-200 p-10 rounded-[3rem] shadow-sm";
            tasksWidget.innerHTML = `
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h3 class="text-xs font-black uppercase tracking-widest text-slate-400">Live Team Protocols</h3>
                        <p class="text-xl font-black text-slate-900 mt-1">Recent Activity</p>
                    </div>
                    <button id="view-all-intel" class="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Intel Hub →</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${(() => {
                        const query = searchQuery.toLowerCase();
                        const filtered = query ? allTeamTasks.filter(t => 
                            t.title?.toLowerCase().includes(query) || 
                            t.description?.toLowerCase().includes(query) || 
                            t.employee?.name?.toLowerCase().includes(query)
                        ) : allTeamTasks;

                        return filtered.slice(0, 4).map(t => `
                        <div class="p-6 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:border-indigo-200 transition-all group">
                            <div class="flex justify-between items-start mb-4">
                                <div class="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
                                    ${(t.employee?.name?.[0] || 'E').toUpperCase()}
                                </div>
                                <span class="px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest ${t.status === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}">
                                    ${t.status}
                                </span>
                            </div>
                            <h4 class="text-[11px] font-black text-slate-900 truncate">${t.title}</h4>
                            <p class="text-[9px] text-slate-400 font-bold uppercase mt-1">Assigned to ${t.employee?.name || 'Unknown'}</p>
                        </div>
                    `).join('') + (filtered.length === 0 ? '<p class="text-xs text-slate-400 italic col-span-full py-10 text-center">No matching protocols detected.</p>' : '');
                    })()}
                </div>
            `;
            tasksWidget.querySelector('#view-all-intel')?.addEventListener('click', () => {
                currentMainTab = 'intelligence';
                refreshDashboard();
            });
            main.appendChild(tasksWidget);

        } else if (currentMainTab === 'intelligence') {
            main.appendChild(renderIntelligence());
        } else if (currentMainTab === 'team') {
            main.appendChild(teamSection);
            renderTeamUI();
        } else if (currentMainTab === 'leaves') {
            main.appendChild(renderLeaves());
        } else if (currentMainTab === 'reports') {
            main.appendChild(renderReports());
        } else if (currentMainTab === 'settings') {
            main.appendChild(renderSettings());
        }
    };

    const fetchData = async () => {
        try {
            const [teamRes, allRes, statsRes, intelligenceRes, leaveRes, taskRes, notifRes] = await Promise.all([
                APIClient.getMyTeam(),
                APIClient.getAllEmployees(),
                AttendanceService.getStats(),
                APIClient.getTeamIntelligence(),
                APIClient.getTeamLeaves(),
                APIClient.getTeamTasks(),
                APIClient.getNotifications()
            ]);
            if (teamRes.success) myTeam = teamRes.data as any[];
            if (allRes.success) {
                // Keep the manager in the list so they can see their own report, but filter out other managers and admins
                allEmployees = (allRes.data as any[]).filter(e => e.role === 'user' || e._id === user?.id);
            }
            if (statsRes?.success) stats = statsRes;
            if (intelligenceRes.success) {
                teamIntelligence = intelligenceRes.data;
                teamIntelligence._dataChangedSinceLastRender = true;
            }
            if (leaveRes.success) teamLeaves = leaveRes.data;
            if (taskRes.success) allTeamTasks = taskRes.data;
            if (notifRes.success) {
                // Check if new notifications arrived to maybe show a toast
                const newUnread = (notifRes.data as any[]).filter(n => !n.isRead && !notifications.some(on => on._id === n._id));
                if (newUnread.length > 0) {
                    // Small toast on first match
                    const latest = newUnread[0];
                    dom.showAlert(`New Alert: ${latest.title}`, 'info');
                }
                notifications = notifRes.data as any[];
                renderTopBar();
            }

            refreshDashboard();
        } catch (err: any) {
            console.error('Data error', err);
            dom.showAlert('Could not load dashboard data', 'danger');
        }
    };

    fetchData();

    // --- REAL-TIME DATA POLLING (Intelligence Updates) ---
    const dataInterval = setInterval(() => {
        if (!wrapper.isConnected) return clearInterval(dataInterval);
        // We only poll if the tab is overview or intelligence to save resources
        if (currentMainTab === 'overview' || currentMainTab === 'intelligence') {
            fetchData();
        }
    }, 5000);

    // --- REAL-TIME TIMER ---
    timerInterval = setInterval(() => {
        if (!wrapper.isConnected) return clearInterval(timerInterval);

        const st = attendance;
        const displaySeconds = st.isClockedIn
            ? (st.isOnBreak
                ? st.totalSecondsToday
                : st.totalSecondsToday + (st.clockInTime ? Math.floor((Date.now() - st.clockInTime) / 1000) : 0))
            : 0; // Reset to 00:00:00 when not working as requested

        const h = Math.floor(displaySeconds / 3600);
        const m = Math.floor((displaySeconds % 3600) / 60);
        const s = displaySeconds % 60;

        const timerEl = document.getElementById('manager-timer');
        if (timerEl) {
            timerEl.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }

        const reportsTimerEl = document.getElementById('reports-today-timer');
        if (reportsTimerEl) {
            reportsTimerEl.innerText = `${h}h ${m}m`;
        }
    }, 1000);

    // Close notifications on click outside
    document.addEventListener('click', () => {
        if (isNotificationOpen) {
            isNotificationOpen = false;
            renderTopBar();
        }
    });

    return wrapper;
};
