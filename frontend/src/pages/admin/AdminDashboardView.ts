import { AuthService } from '../../services/auth.service';
import APIClient from '../../api/client';
import { Button } from '../../components/Button';
import * as dom from '../../utils/dom';
import { PAGES } from '../../config/constants';
import SocketService from '../../services/socket.service';

export const AdminDashboardView = () => {
    const wrapper = document.createElement('div');
    wrapper.className = "min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900";

    // State
    let activeTab = 'overview';
    let stats: any = {};
    let pendingManagers: any[] = [];
    let allEmployees: any[] = [];
    let allTasks: any[] = [];
    let intelligence: any = { graphs: { productivityFlow: [], efficiencyMetrics: [] } };
    let productivityChart: any = null;
    let efficiencyChart: any = null;
    let notifications: any[] = [];
    let isNotificationOpen = false;

    // --- REAL-TIME UPDATES ---
    const unsubscribe = SocketService.onNotification((notification) => {
        notifications = [notification, ...notifications];
        renderNav(); // Update bell dot
        
        if (['task_assigned', 'task_completed', 'leave_requested', 'leave_approved', 'leave_rejected', 'user_registered'].includes(notification.type)) {
            loadAllData().then(() => updateUI());
            dom.showAlert(`Live Alert: ${notification.title}`, "info");
        }
    });

    // Cleanup when removed from DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
                if (node === wrapper || node.contains(wrapper)) {
                    unsubscribe();
                    observer.disconnect();
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // --- NAVIGATION ---
    const nav = document.createElement('nav');
    nav.className = "bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-[100] px-8 py-4 flex justify-between items-center";
    const renderNav = () => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        nav.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200/50 group cursor-pointer" onclick="window.location.hash = '${PAGES.ADMIN_DASHBOARD}'">
                    <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                </div>
                <div>
                    <span class="text-xl font-black tracking-tight text-slate-800 uppercase">Administrative Control</span>
                </div>
            </div>
            <div class="flex items-center gap-6 relative">
                <div class="flex items-center gap-3 relative">
                    <button id="admin-notification-bell" class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all relative border border-slate-100">
                        🔔
                        ${unreadCount > 0 ? `<span class="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>` : ''}
                    </button>
                    ${isNotificationOpen ? `
                        <div class="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div class="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <span class="text-[10px] font-black uppercase tracking-widest text-slate-900">Notifications</span>
                                <button id="admin-mark-read" class="text-[8px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Mark all read</button>
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
                <button id="logout-btn" class="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 border-rose-100/50 h-10 transition-all">Sign Out</button>
            </div>
        `;

        nav.querySelector('#admin-notification-bell')?.addEventListener('click', (e) => {
            e.stopPropagation();
            isNotificationOpen = !isNotificationOpen;
            renderNav();
        });

        nav.querySelector('#admin-mark-read')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await APIClient.markAllNotificationsRead();
            notifications = []; // Clear all locally for real-time feel
            renderNav();
        });

        nav.querySelector('#logout-btn')?.addEventListener('click', () => AuthService.logout());

        nav.querySelectorAll('[data-nid]').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                const nid = item.getAttribute('data-nid');
                const n = notifications.find(notif => notif._id === nid);
                
                if (nid && n) {
                    await APIClient.markNotificationRead(nid);
                    // Remove from list immediately (Auto-delete)
                    notifications = notifications.filter(notif => notif._id !== nid);
                    
                    if (n.type === 'user_registered') {
                        activeTab = 'approvals';
                        updateUI();
                    }
                    isNotificationOpen = notifications.length > 0; // Close if empty
                    renderNav();
                }
            });
        });
    };

    renderNav();
    wrapper.appendChild(nav);

    // Close notifications on click outside
    document.addEventListener('click', () => {
        if (isNotificationOpen) {
            isNotificationOpen = false;
            renderNav();
        }
    });

    const main = document.createElement('main');
    main.className = "flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-8 flex flex-col gap-6 sm:gap-8";

    // Sidebar/Tabs
    const tabNav = document.createElement('div');
    tabNav.className = "flex gap-2 p-1 bg-slate-200/50 rounded-2xl overflow-x-auto no-scrollbar w-full sm:w-fit whitespace-nowrap scroll-smooth";
    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'approvals', label: 'Approvals', icon: '✅' },
        { id: 'directory', label: 'Employee Directory', icon: '👥' },
        { id: 'tasks', label: 'Platform Tasks', icon: '🎯' }
    ];

    tabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.className = `px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`;
        btn.innerHTML = `<span class="mr-2">${tab.icon}</span> ${tab.label}`;
        btn.onclick = () => {
            activeTab = tab.id;
            updateUI();
        };
        tabNav.appendChild(btn);
    });
    main.appendChild(tabNav);

    const contentArea = document.createElement('div');
    contentArea.className = "flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500";
    main.appendChild(contentArea);

    const updateUI = () => {
        // Update tab buttons
        Array.from(tabNav.children).forEach((btn: any, idx) => {
            btn.className = `px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === tabs[idx].id ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`;
        });

        contentArea.innerHTML = '';
        if (activeTab === 'overview') {
            renderOverview();
            setTimeout(renderIntelligenceCharts, 100);
        }
        else if (activeTab === 'approvals') renderApprovals();
        else if (activeTab === 'directory') renderDirectory();
        else if (activeTab === 'tasks') renderTasks();
    };

    const renderIntelligenceCharts = () => {
        const prodCtx = (wrapper.querySelector('#productivityChart') as HTMLCanvasElement)?.getContext('2d');
        const effCtx = (wrapper.querySelector('#efficiencyChart') as HTMLCanvasElement)?.getContext('2d');

        if (!prodCtx || !effCtx || !intelligence.graphs) return;

        if (productivityChart) productivityChart.destroy();
        if (efficiencyChart) efficiencyChart.destroy();

        // @ts-ignore (Chart is global from CDN)
        productivityChart = new Chart(prodCtx, {
            type: 'line',
            data: {
                labels: intelligence.graphs.productivityFlow.map((d: any) => d.time),
                datasets: [
                    {
                        label: 'Input',
                        data: intelligence.graphs.productivityFlow.map((d: any) => d.input),
                        borderColor: '#F59E0B',
                        backgroundColor: '#F59E0B',
                        tension: 0.4,
                        borderWidth: 4,
                        pointRadius: 0
                    },
                    {
                        label: 'Output',
                        data: intelligence.graphs.productivityFlow.map((d: any) => d.output),
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
                labels: intelligence.graphs.efficiencyMetrics.map((d: any) => d.time),
                datasets: [
                    {
                        label: 'Efficiency',
                        data: intelligence.graphs.efficiencyMetrics.map((d: any) => d.efficiency),
                        borderColor: '#10B981',
                        backgroundColor: '#10B981',
                        tension: 0.4,
                        borderWidth: 4,
                        pointRadius: 0
                    },
                    {
                        label: 'Errors',
                        data: intelligence.graphs.efficiencyMetrics.map((d: any) => d.errors),
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
    };

    const renderOverview = () => {
        contentArea.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${renderStatCard('Pending Approvals', stats.pendingManagers || 0, 'bg-amber-500', '⚠️')}
                ${renderStatCard('Total Employees', stats.totalEmployees || 0, 'bg-indigo-600', '👥')}
                ${renderStatCard('Active Tasks', stats.activeTasks || 0, 'bg-emerald-500', '📝')}
                ${renderStatCard('Leave Requests', stats.pendingLeaves || 0, 'bg-rose-500', '🏠')}
            </div>

            ${(() => {
                const completedTasks = allTasks.filter(t => t.status === 'done').length;
                const progressPerc = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;
                return `
                <div class="bg-indigo-600 text-white p-8 rounded-[2rem] shadow-xl flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden">
                    <div class="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500 opacity-50 rounded-full blur-3xl"></div>
                    <div class="z-10 flex-1 w-full">
                        <h3 class="text-sm font-black uppercase tracking-[0.2em] text-indigo-200 mb-2">Project Management Status</h3>
                        <div class="flex items-end gap-4">
                            <span class="text-5xl font-black">${progressPerc}%</span>
                            <span class="text-indigo-200 font-bold mb-2">Overall Completion Rate</span>
                        </div>
                        <div class="w-full bg-indigo-900/50 h-3 rounded-full mt-6 overflow-hidden">
                            <div class="bg-emerald-400 h-full rounded-full transition-all duration-1000" style="width: ${progressPerc}%"></div>
                        </div>
                    </div>
                    <div class="z-10 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-12 lg:pl-12 lg:border-l lg:border-indigo-500/50 w-full lg:w-auto">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Active Sprints</p>
                            <p class="text-2xl font-black">${allTasks.filter(t => t.status === 'in-progress').length}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">In Review</p>
                            <p class="text-2xl font-black">${allTasks.filter(t => t.status === 'review').length}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Completed</p>
                            <p class="text-2xl font-black">${completedTasks}</p>
                        </div>
                    </div>
                </div>`;
            })()}

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 bg-white rounded-[2rem] border-2 border-slate-100 p-8 shadow-sm">
                    <div class="flex justify-between items-center mb-10">
                        <div>
                            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">Team Performance Intelligence</h3>
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time behavior analysis</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div class="space-y-4">
                            <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Productivity Flow over Time</h4>
                            <div class="h-64">
                                <canvas id="productivityChart"></canvas>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Task Efficiency (Success Vs Failure)</h4>
                            <div class="h-64">
                                <canvas id="efficiencyChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-[2rem] border-2 border-slate-100 p-8 shadow-sm">
                    <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">System Health</h3>
                    <div class="space-y-4">
                        ${renderHealthItem('Database', 'Connected', 'text-emerald-500')}
                        ${renderHealthItem('API Server', 'Healthy', 'text-emerald-500')}
                        ${renderHealthItem('Socket Engine', 'Active', 'text-emerald-500')}
                        ${renderHealthItem('Mailing Service', 'Operational', 'text-emerald-500')}
                    </div>
                </div>
            </div>
        `;
    };

    const renderStatCard = (label: string, value: number, color: string, icon: string) => `
        <div class="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-all cursor-default">
            <div class="absolute -right-4 -top-4 w-24 h-24 ${color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div class="flex items-center justify-between mb-4">
                <span class="p-3 bg-slate-50 text-xl rounded-2xl">${icon}</span>
                <span class="text-3xl font-black text-slate-900">${value}</span>
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${label}</p>
        </div>
    `;

    const renderHealthItem = (service: string, status: string, colorClass: string) => `
        <div class="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
            <span class="text-xs font-bold text-slate-600">${service}</span>
            <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full ${colorClass.replace('text', 'bg')} animate-pulse"></div>
                <span class="text-[10px] font-black uppercase tracking-wider ${colorClass}">${status}</span>
            </div>
        </div>
    `;

    const renderApprovals = () => {
        if (pendingManagers.length === 0) {
            contentArea.innerHTML = `<div class="p-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                <p class="text-slate-400 font-bold italic">No pending manager requests at this time.</p>
            </div>`;
            return;
        }

        contentArea.innerHTML = `
            <div class="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
                <table class="w-full text-left min-w-[600px]">
                    <thead>
                        <tr class="bg-slate-50/50 border-b border-slate-100">
                            <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Requestor</th>
                            <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Organization</th>
                            <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Verification</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${pendingManagers.map(m => `
                            <tr class="hover:bg-slate-50/30 transition-colors">
                                <td class="px-8 py-6">
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                                            ${m.name[0]}
                                        </div>
                                        <div>
                                            <p class="text-sm font-black text-slate-900">${m.name}</p>
                                            <p class="text-[10px] font-bold text-slate-400">${m.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-8 py-6">
                                    <p class="text-sm font-bold text-slate-700">${m.company}</p>
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${m.position}</p>
                                </td>
                                <td class="px-8 py-6 text-right">
                                    <div class="flex gap-2 justify-end">
                                        <button data-id="${m._id}" data-action="approve" class="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-emerald-100/50">Verify</button>
                                        <button data-id="${m._id}" data-action="reject" class="px-6 py-2 bg-white text-rose-600 border-2 border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">Reject</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        contentArea.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.currentTarget as HTMLButtonElement;
                const id = target.getAttribute('data-id')!;
                const action = target.getAttribute('data-action')!;
                
                try {
                    dom.showLoading(target.id || 'btn', action === 'approve' ? 'Approving...' : 'Rejecting...');
                    const res = await APIClient.approveAdminManager(id, action === 'approve');
                    if (res.success) {
                        dom.showAlert(res.message, 'success');
                        await loadAllData();
                        updateUI();
                    }
                } catch (err: any) {
                    dom.showAlert(err.message, 'danger');
                }
            });
        });
    };

    const renderDirectory = () => {
        contentArea.innerHTML = `
            <div class="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
                <div class="p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">Global Directory</h3>
                        <p class="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">${allEmployees.length} Records Found</p>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50/50 border-b border-slate-100">
                                <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                                <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Role & Position</th>
                                <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Reporting To</th>
                                <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            ${allEmployees.map(e => `
                                <tr class="hover:bg-slate-50/30 transition-colors">
                                    <td class="px-8 py-6">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">
                                                ${e.name[0]}
                                            </div>
                                            <div>
                                                <p class="text-sm font-black text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors" data-employee-details="${e._id}">${e.name}</p>
                                                <p class="text-[10px] font-bold text-slate-400">${e.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-8 py-6">
                                        <span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest">${e.role}</span>
                                        <p class="text-[10px] font-bold text-slate-500 mt-1">${e.position}</p>
                                    </td>
                                    <td class="px-8 py-6">
                                        <p class="text-xs font-bold text-slate-700">${e.managerId?.name || '-'}</p>
                                    </td>
                                    <td class="px-8 py-6 text-right">
                                        <span class="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${e.isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}">
                                            ${e.isApproved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        contentArea.querySelectorAll('[data-employee-details]').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-employee-details');
                const employee = allEmployees.find(emp => emp._id === id);
                if (employee) showEmployeeDetails(employee);
            });
        });
    };

    const renderTasks = () => {
        const todo = allTasks.filter(t => t.status === 'todo');
        const inProgress = allTasks.filter(t => t.status === 'in-progress');
        const review = allTasks.filter(t => t.status === 'review');
        const done = allTasks.filter(t => t.status === 'done');

        contentArea.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-3xl border-2 border-slate-100 shadow-sm gap-4">
                <div>
                   <h2 class="text-lg font-black text-slate-800 tracking-tight">Global Operation Center</h2>
                   <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time task synchronization across all teams</p>
                </div>
                <div class="flex gap-4">
                    <div class="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        ${allTasks.length} Live Tasks
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 h-full pb-20">
                ${renderTaskCol('Backlog', 'todo', todo, 'bg-slate-500', '📝')}
                ${renderTaskCol('Active', 'in-progress', inProgress, 'bg-indigo-600', '⚡')}
                ${renderTaskCol('Validation', 'review', review, 'bg-amber-500', '🔍')}
                ${renderTaskCol('Extracted', 'done', done, 'bg-emerald-600', '✅')}
            </div>
        `;
    };

    const renderTaskCol = (title: string, status: string, tasks: any[], color: string, icon: string) => `
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between px-2">
                <div class="flex items-center gap-2">
                    <span class="text-lg">${icon}</span>
                    <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500">${title}</h3>
                </div>
                <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${color.replace('bg-', 'bg-opacity-10 ' + color.replace('bg-', 'text-'))}">${tasks.length}</span>
            </div>
            <div class="flex flex-col gap-3 min-h-[500px] p-3 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                ${tasks.length === 0 ? `
                        <div class="flex-1 flex flex-col items-center justify-center py-20 opacity-20">
                            <span class="text-4xl mb-2">${icon}</span>
                            <p class="text-[10px] font-black uppercase tracking-widest">Zone Clear</p>
                        </div>
                ` : tasks.map(t => `
                    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all cursor-default group relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-1 h-full ${t.priority === 'high' ? 'bg-rose-500' : (t.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')}"></div>
                        <h4 class="text-xs font-black text-slate-900 leading-tight mb-3 line-clamp-2">${t.title}</h4>
                        <div class="flex items-center gap-2 mb-4">
                            <div class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                ${t.employee?.name?.[0] || '?'}
                            </div>
                            <span class="text-[10px] font-bold text-slate-600 truncate">${t.employee?.name || 'Unassigned'}</span>
                        </div>
                        <div class="flex items-center justify-between pt-3 border-t border-slate-50">
                             <div class="flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full ${t.priority === 'high' ? 'bg-rose-500' : (t.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')}"></span>
                                <span class="text-[8px] font-black uppercase tracking-widest text-slate-400">${t.priority}</span>
                             </div>
                             <span class="text-[8px] font-black text-slate-300 uppercase">${new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const showEmployeeDetails = (employee: any) => {
        const employeeTasks = allTasks.filter(t => t.employee?._id === employee._id || t.employee === employee._id);
        const stats = {
            total: employeeTasks.length,
            done: employeeTasks.filter(t => t.status === 'done').length,
            pending: employeeTasks.filter(t => t.status !== 'done').length
        };

        const modal = document.createElement('div');
        modal.className = "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300";
        modal.innerHTML = `
            <div class="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div class="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]">
                    <div class="flex items-center gap-6">
                        <div class="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-indigo-100">
                            ${employee.name[0]}
                        </div>
                        <div>
                             <h3 class="text-2xl font-black text-slate-900 tracking-tight">${employee.name}</h3>
                             <p class="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] mt-1">${employee.position} • ${employee.role}</p>
                        </div>
                    </div>
                    <button class="modal-close w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div class="p-10 overflow-y-auto flex-1 bg-white">
                    <!-- Metrics -->
                    <div class="grid grid-cols-3 gap-6 mb-10">
                        ${renderDetailMetric('Active Intelligence', stats.pending, 'bg-amber-500')}
                        ${renderDetailMetric('Resolved Protocols', stats.done, 'bg-emerald-600')}
                        ${renderDetailMetric('Total Involvements', stats.total, 'bg-indigo-600')}
                    </div>

                    <!-- Personal Intel -->
                    <div class="space-y-8">
                        <div>
                            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Identity Profile</h4>
                            <div class="grid grid-cols-2 gap-4">
                                ${renderInfoField('Email Address', employee.email)}
                                ${renderInfoField('Organization', employee.company || 'Global Entity')}
                                ${renderInfoField('Reporting Chain', employee.managerId?.name || 'Unassigned')}
                                ${renderInfoField('Access Status', employee.isApproved ? 'Verified' : 'Pending')}
                            </div>
                        </div>

                        <!-- Tasks Progress -->
                        <div>
                            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Operation Status</h4>
                            <div class="space-y-3">
                                ${employeeTasks.length === 0 ? `<div class="p-8 text-center bg-slate-50 rounded-3xl text-xs font-bold text-slate-400 italic">No assigned tasks detected.</div>` : employeeTasks.map(t => `
                                    <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex justify-between items-center group hover:bg-white hover:border-indigo-200 transition-all">
                                        <div class="flex items-center gap-4">
                                            <div class="w-1.5 h-1.5 rounded-full ${t.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'}"></div>
                                            <p class="text-xs font-black text-slate-700">${t.title}</p>
                                        </div>
                                        <span class="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-400">${t.status}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
    };

    const renderDetailMetric = (label: string, value: number, color: string) => `
        <div class="flex flex-col gap-1">
            <span class="text-3xl font-black text-slate-900">${value}</span>
            <span class="text-[8px] font-black uppercase tracking-widest text-slate-400">${label}</span>
            <div class="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div class="h-full ${color}" style="width: ${value > 0 ? '100%' : '0'}"></div>
            </div>
        </div>
    `;

    const renderInfoField = (label: string, value: string) => `
        <div class="p-4 rounded-2xl border border-slate-100 bg-[#F8FAFC]">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">${label}</p>
            <p class="text-xs font-bold text-slate-700 truncate">${value}</p>
        </div>
    `;

    const loadAllData = async () => {
        try {
            // Execute all requests but catch errors for each individually to prevent one failure from blocking others.
            const statsRes = await APIClient.getAdminStats().catch(e => { console.error('Error fetching admin stats:', e); return { success: false, data: {}, error: e }; });
            const pendingRes = await APIClient.getPendingAdminManagers().catch(e => { console.error('Error fetching pending managers:', e); return { success: false, data: [], error: e }; });
            const employeesRes = await APIClient.getAllGlobalEmployees().catch(e => { console.error('Error fetching employees:', e); return { success: false, data: [], error: e }; });
            const tasksRes = await APIClient.getGlobalAdminTasks().catch(e => { console.error('Error fetching tasks:', e); return { success: false, data: [], error: e }; });
            const intelRes = await APIClient.getTeamIntelligence().catch(e => { console.error('Error fetching team intelligence:', e); return { success: false, data: intelligence, error: e }; });
            const notifRes = await APIClient.getNotifications().catch(e => { console.error('Error fetching notifications:', e); return { success: false, data: [], error: e }; });

            if (statsRes.success) stats = statsRes.data;
            if (pendingRes.success) pendingManagers = pendingRes.data;
            if (employeesRes.success) allEmployees = employeesRes.data;
            if (tasksRes.success) allTasks = tasksRes.data;
            if (intelRes.success) intelligence = intelRes.data;
            if (notifRes.success) {
                notifications = notifRes.data;
                renderNav();
            }

            // If any critical ones failed, show alert (optional, based on criticality)
            if (!statsRes.success || !pendingRes.success) {
                console.error('Critical data load failure detected for stats or pending managers.', { statsRes, pendingRes });
                // Optionally, show a general error if critical data is missing
                // dom.showAlert('Some critical data could not be loaded. Please check console for details.', 'danger');
            }

            updateUI(); // Update UI with whatever data was successfully loaded

        } catch (err: any) {
            // This catch block will now only handle errors that occur outside the individual API calls
            // e.g., issues with variable assignment or updateUI itself.
            console.error('General data load process error', err);
            if (err.status === 403) {
                dom.showAlert('Access Denied: You must be a Super Administrator to access these records.', 'danger');
            } else if (err.status === 401) {
                dom.showAlert('Session expired. Please sign in again.', 'warning');
            } else {
                dom.showAlert(`Synchronizer Error: ${err.message || 'Unknown protocol failure'}`, 'danger');
            }
        }
    };

    // Polling fallback
    const pollInterval = setInterval(() => {
        if (!wrapper.isConnected) return clearInterval(pollInterval);
        loadAllData().then(() => updateUI());
    }, 10000);

    // Load initial data
    loadAllData().then(() => {
        updateUI();
    });

    wrapper.appendChild(main);
    return wrapper;
};
