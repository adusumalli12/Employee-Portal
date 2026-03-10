import { AuthService } from '../services/AuthService';
import { AttendanceService } from '../services/AttendanceService';
import { Button } from '../components/Button';
import APIClient from '../api/client';
import * as dom from '../utils/dom';

export const Dashboard = () => {
    const user = AuthService.getUser();
    let attendance = AttendanceService.getState();
    let currentTab: 'overview' | 'insights' | 'tasks' | 'leaves' | 'reports' | 'settings' = 'overview';
    let activeLeaveTab: 'history' | 'calendar' = 'history';
    let myLeaves: any[] = [];
    let activeTasks: any[] = [];
    let timerInterval: any = null;
    let stats: any = null;
    let notifications: any[] = [];
    let isNotificationOpen = false;

    const wrapper = document.createElement('div');
    wrapper.className = "min-h-screen bg-slate-50 flex flex-col";

    // --- NAVIGATION ---
    const nav = document.createElement('nav');
    nav.className = "bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 py-3 flex justify-between items-center";
    nav.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200/50">
                EP
            </div>
            <span class="text-lg font-black text-slate-900 tracking-tight">Employee Portal</span>
        </div>
    `;

    const navRight = document.createElement('div');
    navRight.className = "flex items-center gap-6";

    const userProfile = document.createElement('div');
    userProfile.className = "flex items-center gap-3 pr-4 border-r border-slate-100";
    userProfile.innerHTML = `
        <div class="text-right hidden md:block">
            <p class="text-sm font-bold text-slate-900 leading-none">${user?.name || 'Employee'}</p>
            <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">${user?.position || 'Staff'}</p>
        </div>
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            ${(user?.name?.[0] || 'E').toUpperCase()}
        </div>
        <div class="relative ml-2">
            <button id="notif-bell" class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 relative transition-all">
                🔔
                ${notifications.filter(n => !n.isRead).length > 0 ? `<span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>` : ''}
            </button>
            ${isNotificationOpen ? `
                <div class="absolute right-0 top-10 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <div class="p-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h4 class="text-[9px] font-black uppercase tracking-widest text-slate-900">Alerts</h4>
                    </div>
                    <div class="max-h-60 overflow-y-auto">
                        ${notifications.length === 0 ? `
                            <div class="p-8 text-center text-slate-400 font-bold italic text-[9px]">No new alerts.</div>
                        ` : notifications.map(n => `
                            <div class="p-3 border-b border-slate-50 hover:bg-indigo-50/30 transition-all cursor-pointer ${!n.isRead ? 'bg-indigo-50/10' : ''}" data-nid="${n._id}">
                                <p class="text-[9px] font-black text-slate-900">${n.title}</p>
                                <p class="text-[8px] text-slate-500 mt-0.5 line-clamp-2">${n.message}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    const logoutBtn = Button({
        text: "Logout",
        variant: "danger",
        className: "text-xs py-1.5 px-4 h-auto rounded-full font-bold bg-slate-50 !text-slate-600 hover:!bg-red-50 hover:!text-red-600 border-none shadow-none",
        onClick: () => AuthService.logout()
    });

    navRight.appendChild(userProfile);
    navRight.appendChild(logoutBtn);
    nav.appendChild(navRight);
    wrapper.appendChild(nav);

    const main = document.createElement('main');
    main.className = "flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-8";
    wrapper.appendChild(main);

    // --- MODAL SYSTEM ---
    const showModal = (title: string, content: string) => {
        const modal = document.createElement('div');
        modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300";
        modal.innerHTML = `
            <div class="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 class="text-xl font-black text-slate-900 tracking-tight">${title}</h3>
                    <button class="modal-close w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div class="p-8 overflow-y-auto flex-1">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
        return modal;
    };

    const showCreateTaskModal = () => {
        const m = showModal("New Working Task", `
            <form id="quick-task-form" class="space-y-6">
                <div>
                    <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Task Title</label>
                    <input name="title" required placeholder="What needs to be done?" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                </div>
                <div>
                    <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Description</label>
                    <textarea name="description" rows="3" placeholder="Additional context..." class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none resize-none"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                     <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Priority</label>
                        <select name="priority" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Due Date</label>
                        <input type="date" name="dueDate" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                    </div>
                </div>
                <button type="submit" class="w-full py-5 rounded-3xl bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all">Create Task</button>
            </form>
        `);

        m.querySelector('#quick-task-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            if (!user?.id) return;
            const data = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                priority: formData.get('priority') as string,
                dueDate: formData.get('dueDate') as string,
                employeeId: user.id
            };

            try {
                // Optimistic Update
                const tempId = 'temp-' + Date.now();
                const newTask = { ...data, _id: tempId, status: 'todo', createdAt: new Date().toISOString() };
                activeTasks = [newTask, ...activeTasks];
                refreshDashboard();
                m.remove();
                dom.showAlert("Task added to backlog.", "success");

                const res = await APIClient.createTask(data);
                if (!res.success) {
                    activeTasks = activeTasks.filter(t => t._id !== tempId);
                    refreshDashboard();
                    dom.showAlert("Sync error. Task removed.", "danger");
                } else {
                    await syncData();
                }
            } catch (err: any) {
                console.error(err);
                await syncData();
            }
        });
    };

    // --- COMPONENTS ---

    // 1. Header with Tabs
    const header = document.createElement('div');
    header.className = "flex flex-col md:flex-row justify-between items-center gap-6";

    const renderHeader = () => {
        header.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                <div>
                    <h1 class="text-3xl font-black text-slate-900 tracking-tight">Welcome, ${user?.name?.split(' ')[0] || 'User'}!</h1>
                    <p class="text-slate-500 font-medium mt-1">Daily Work Dashboard & Activity History</p>
                </div>
                <button id="quick-task-btn" class="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-indigo-100 hover:scale-105 transition-all text-xs font-black uppercase tracking-widest w-full md:w-auto justify-center">
                    <span class="text-lg">➕</span>
                    Quick Task
                </button>
            </div>
            <div class="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto max-w-full no-scrollbar" id="dashboard-tabs">
                <button data-tab="overview" class="whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}">Overview</button>
                <button data-tab="insights" class="whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'insights' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}">Insights</button>
                <button data-tab="tasks" class="whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'tasks' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}">Tasks</button>
                <button data-tab="leaves" class="whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'leaves' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}">Vacation</button>
                <button data-tab="reports" class="whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'reports' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}">Reports</button>
                <button data-tab="settings" class="whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}">Settings</button>
            </div>
        `;

        header.querySelectorAll('button[data-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentTab = (e.currentTarget as HTMLButtonElement).getAttribute('data-tab') as any;
                refreshDashboard();
            });
        });
    };

    // 2. High-Performance Attendance Card (Horizontal Style)
    const attendanceCard = document.createElement('div');
    attendanceCard.className = "bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8";

    const updateAttendanceUI = () => {
        const isIn = attendance.isClockedIn;
        const onBreak = attendance.isOnBreak;

        attendanceCard.innerHTML = `
            <div class="flex items-center gap-6 flex-1">
                <div class="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shadow-inner">
                    ${onBreak ? '☕' : (isIn ? '🔥' : '😴')}
                </div>
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Status</p>
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full ${isIn ? (onBreak ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-slate-300'}"></span>
                        <h3 class="text-xl font-black text-slate-900 tracking-tight">
                            ${onBreak ? 'Away on Break' : (isIn ? 'Currently Working' : 'Not Working')}
                        </h3>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col items-center">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Hours Today</p>
                <div id="work-timer" class="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">${(() => {
                const st = attendance;
                const displaySeconds = st.isClockedIn
                    ? (st.isOnBreak
                        ? st.totalSecondsToday
                        : st.totalSecondsToday + (st.clockInTime ? Math.floor((Date.now() - st.clockInTime) / 1000) : 0))
                    : st.totalSecondsToday;
                const h = Math.floor(displaySeconds / 3600);
                const m = Math.floor((displaySeconds % 3600) / 60);
                const s = displaySeconds % 60;
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            })()}</div>
            </div>

            <div class="flex gap-3 flex-wrap lg:flex-nowrap flex-1 justify-center lg:justify-end w-full lg:w-auto">
                ${!isIn ? `
                    <button id="btn-clock-in" class="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100 flex-1 lg:flex-none">
                        Start Session
                    </button>
                ` : `
                    <button id="btn-break" class="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 border-2 ${onBreak ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'} flex-1 lg:flex-none">
                        ${onBreak ? 'End Break' : 'Take Break'}
                    </button>
                    <button id="btn-clock-out" class="bg-red-50 text-red-600 border border-red-100 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all active:scale-95 flex-1 lg:flex-none">
                        Clock Out
                    </button>
                `}
            </div>
        `;

        attendanceCard.querySelector('#btn-clock-in')?.addEventListener('click', async () => {
            try {
                // 🔥 Optimistic UI Update: Instant visual feedback
                const now = Date.now();
                attendance.isClockedIn = true;
                attendance.isOnBreak = false;
                attendance.clockInTime = now;
                // Preserve totalSecondsToday if they already worked earlier today
                updateAttendanceUI();

                // Background Sync
                await AttendanceService.clockIn();
                await syncData();
            } catch (err: any) {
                // Rollback on failure
                await syncData();
                dom.showAlert(err.message, 'danger');
            }
        });

        attendanceCard.querySelector('#btn-clock-out')?.addEventListener('click', async () => {
            try {
                if (!confirm('Are you sure you want to end your working session?')) return;

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
                await syncData();
                dom.showAlert('Working session successfully completed!', 'success');
            } catch (err: any) {
                // Rollback on failure
                await syncData();
                dom.showAlert(err.message, 'danger');
            }
        });

        attendanceCard.querySelector('#btn-break')?.addEventListener('click', async () => {
            try {
                // 🔥 Optimistic UI Update
                const now = Date.now();
                if (!attendance.isOnBreak) {
                    // Going ON break: Add current work segment to total
                    const elapsed = Math.floor((now - (attendance.clockInTime || now)) / 1000);
                    attendance.totalSecondsToday += Math.max(0, elapsed);
                    attendance.isOnBreak = true;
                } else {
                    // Coming OFF break: Reset clockInTime to start new segment
                    attendance.clockInTime = now;
                    attendance.isOnBreak = false;
                }
                updateAttendanceUI();

                // Background Sync
                await AttendanceService.toggleBreak();
                await syncData();
            } catch (err: any) {
                // Rollback on failure
                await syncData();
                dom.showAlert(err.message, 'danger');
            }
        });
    };

    // 3. Stats Grid
    const statsGrid = document.createElement('div');
    statsGrid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

    const updateStats = () => {
        const attendanceRate = stats?.monthlyRate || 94.5;
        const perfScore = stats?.performanceScore || 88;

        statsGrid.innerHTML = `
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-300">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-slate-900 font-black text-lg tracking-tight">Attendance Rate</h3>
                    <span class="bg-emerald-50 text-emerald-600 font-black text-[10px] px-2 py-1 rounded-lg border border-emerald-100">Optimal</span>
                </div>
                <div class="flex items-end justify-between">
                    <div>
                        <p class="text-4xl font-black text-slate-900 tracking-tighter">${attendanceRate}%</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Monthly Average</p>
                    </div>
                    <div class="w-16 h-16 rounded-full border-4 border-indigo-500/10 flex items-center justify-center relative">
                        <svg class="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="32" cy="32" r="28" fill="none" class="stroke-indigo-100" stroke-width="4" />
                            <circle cx="32" cy="32" r="28" fill="none" class="stroke-indigo-500" stroke-width="4" stroke-dasharray="175.9" stroke-dashoffset="${175.9 - (175.9 * attendanceRate / 100)}" />
                        </svg>
                        <span class="text-[10px] font-black text-indigo-600 italic">🔥</span>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-300">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-slate-900 font-black text-lg tracking-tight">Performance Score</h3>
                    <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm border border-amber-100">✨</div>
                </div>
                <div class="space-y-3">
                    <div class="flex justify-between items-end">
                        <span class="text-2xl font-black text-indigo-600 tracking-tight">${perfScore}<span class="text-slate-300 text-xs">/100</span></span>
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expert Level</span>
                    </div>
                    <div class="h-2 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden p-0.5">
                        <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" style="width: ${perfScore}%"></div>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-300 lg:col-span-1 md:col-span-2">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-slate-900 font-black text-lg tracking-tight">Personal Details</h3>
                    <button id="view-profile-btn" class="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Full Profile</button>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Role</p>
                        <p class="text-[11px] font-black text-slate-700 truncate">${user?.position}</p>
                    </div>
                    <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Company</p>
                        <p class="text-[11px] font-black text-slate-700 truncate">${user?.company}</p>
                    </div>
                </div>
            </div>
        `;

        statsGrid.querySelector('#view-profile-btn')?.addEventListener('click', showFullProfile);
    };

    const showFullProfile = () => {
        const content = `
            <div class="space-y-8">
                <div class="flex items-center gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-100 border-dashed">
                    <div class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-3xl text-white font-black shadow-xl shadow-indigo-100">
                        ${(user?.name?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                        <h4 class="text-2xl font-black text-slate-900 tracking-tight">${user?.name}</h4>
                        <p class="text-indigo-600 font-bold uppercase text-[10px] tracking-widest mt-1">${user?.position} • ${user?.location}</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Email</p>
                        <p class="text-sm font-bold text-slate-700">${user?.email}</p>
                    </div>
                    <div class="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Phone</p>
                        <p class="text-sm font-bold text-slate-700">${user?.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div class="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Experience</p>
                        <p class="text-sm font-bold text-slate-700">${user?.experience} Years</p>
                    </div>
                    <div class="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Salary Grade</p>
                        <p class="text-sm font-bold text-indigo-600">$${user?.salary?.toLocaleString()}/yr</p>
                    </div>
                </div>
            </div>
        `;
        showModal("Detailed Identity Roster", content);
    };

    // 4. Analysis Chart
    const analysisCard = document.createElement('div');
    analysisCard.className = "bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col";

    const renderAnalysis = () => {
        analysisCard.innerHTML = `
            <div class="flex justify-between items-center mb-10">
                <h3 class="text-xl font-black text-slate-900 tracking-tight">Work Efficiency Analysis</h3>
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Activity Flow</span>
                </div>
            </div>
            <div class="h-48 flex items-end justify-between gap-2 px-2">
                ${[40, 65, 50, 85, 60, 95, 80, 45, 90, 70, 55, 100].map((h) => `
                    <div class="flex-1 bg-slate-50 relative rounded-xl h-full overflow-hidden group">
                        <div class="absolute bottom-0 w-full bg-indigo-500/10 group-hover:bg-indigo-600 transition-all cursor-pointer" style="height: ${h}%"></div>
                    </div>
                `).join('')}
            </div>
            <div class="flex justify-between mt-6 px-2 font-black text-[9px] text-slate-400 uppercase tracking-widest">
                ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => `<span>${m}</span>`).join('')}
            </div>
        `;
    };
    // --- INSIGHTS VIEW (REAL-TIME TRACKING) ---
    const renderInsights = () => {
        const container = document.createElement('div');
        container.className = "flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500";

        const chartHeader = (title: string) => `
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-sm font-black text-slate-800 tracking-tight">${title}</h3>
                <div class="flex items-center gap-1.5 text-slate-400">
                    <button class="hover:text-indigo-600 transition-colors p-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg></button>
                    <button class="hover:text-indigo-600 transition-colors p-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"></path></svg></button>
                    <button class="hover:text-indigo-600 transition-colors p-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></button>
                    <button class="hover:text-indigo-600 transition-colors p-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg></button>
                    <button class="hover:text-indigo-600 transition-colors p-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
                </div>
            </div>
        `;

        container.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h2 class="text-2xl font-black text-slate-900 tracking-tight">Real-time Performance</h2>
                <div class="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Success Rate Chart -->
                <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                    ${chartHeader('Task Efficiency (Success Vs Failure)')}
                    <div class="h-64 relative w-full pt-4">
                        <svg class="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M 0,90 Q 25,20 50,10 T 100,20" fill="none" stroke="#10b981" stroke-width="2" class="animate-draw-path" />
                            <path d="M 0,95 Q 25,80 50,85 T 100,75" fill="none" stroke="#ef4444" stroke-width="2" class="animate-draw-path" />
                            <circle cx="50" cy="10" r="1.5" fill="#10b981" class="animate-pulse" />
                            <circle cx="95" cy="75" r="1.5" fill="#ef4444" />
                        </svg>
                        <div class="absolute bottom-0 left-0 w-full flex justify-between text-[8px] font-bold text-slate-300 uppercase tracking-tighter pt-4">
                           ${['09:00', '11:00', '13:00', '15:00', '17:00'].map(t => `<span>${t}</span>`).join('')}
                        </div>
                    </div>
                    <div class="flex items-center gap-6 mt-8 justify-center">
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Efficiency</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Errors</span>
                        </div>
                    </div>
                </div>

                <!-- Productivity Over Time -->
                <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                    ${chartHeader('Productivity Flow over Time')}
                    <div class="h-64 relative w-full pt-4">
                         <svg class="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M 0,85 L 20,70 L 40,80 L 60,30 L 80,45 L 100,10" fill="none" stroke="#6366f1" stroke-width="2" class="animate-draw-path" />
                            <path d="M 0,95 L 20,90 L 40,85 L 60,70 L 80,75 L 100,60" fill="none" stroke="#f59e0b" stroke-width="2" class="animate-draw-path" />
                            <circle cx="100" cy="10" r="1.5" fill="#6366f1" />
                        </svg>
                        <div class="absolute bottom-0 left-0 w-full flex justify-between text-[8px] font-bold text-slate-300 uppercase tracking-tighter pt-4">
                           ${['09:00', '11:00', '13:00', '15:00', '17:00'].map(t => `<span>${t}</span>`).join('')}
                        </div>
                    </div>
                    <div class="flex items-center gap-6 mt-8 justify-center">
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Output</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Input</span>
                        </div>
                    </div>
                </div>

                <!-- Task Flowchart -->
                <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col lg:col-span-2">
                    <div class="flex justify-between items-center mb-10">
                        <h3 class="text-sm font-black text-slate-800 tracking-tight">Active Task Flowchart</h3>
                        <span class="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Live Status</span>
                    </div>
                    
                    <div class="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 px-4">
                        <div class="flex flex-col items-center gap-3">
                            <div class="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-2xl shadow-sm relative group cursor-pointer hover:border-indigo-500 transition-all" data-go-tasks="todo">
                                📝
                                <div class="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">${activeTasks.filter(t => t.status === 'todo').length}</div>
                            </div>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backlog</p>
                        </div>
                        
                        <div class="h-px w-12 bg-slate-200 hidden md:block"></div>
                        <div class="w-px h-8 bg-slate-200 md:hidden"></div>

                        <div class="flex flex-col items-center gap-3">
                            <div class="w-32 h-32 rounded-3xl bg-indigo-50 border-4 border-indigo-100 flex flex-col items-center justify-center text-3xl shadow-lg relative group cursor-pointer ${activeTasks.filter(t => t.status === 'in-progress').length > 0 ? 'animate-pulse' : ''}" data-go-tasks="in-progress">
                                ⚡
                                <p class="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-2">Active</p>
                                <div class="absolute -top-2 -right-2 w-7 h-7 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">${activeTasks.filter(t => t.status === 'in-progress').length}</div>
                            </div>
                            <p class="text-[10px] font-black text-slate-900 uppercase tracking-widest">In Progress</p>
                        </div>

                        <div class="h-px w-12 bg-slate-200 hidden md:block"></div>
                        <div class="w-px h-8 bg-slate-200 md:hidden"></div>

                        <div class="flex flex-col items-center gap-3">
                            <div class="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-2xl shadow-sm hover:border-indigo-500 transition-all cursor-pointer relative" data-go-tasks="review">
                                🔍
                                <div class="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">${activeTasks.filter(t => t.status === 'review').length}</div>
                            </div>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Review</p>
                        </div>

                        <div class="h-px w-12 bg-slate-200 hidden md:block"></div>
                        <div class="w-px h-8 bg-slate-200 md:hidden"></div>

                        <div class="flex flex-col items-center gap-3">
                            <div class="w-24 h-24 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-2xl shadow-sm hover:scale-105 transition-all cursor-pointer relative" data-go-tasks="done">
                                ✅
                                <div class="absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">${activeTasks.filter(t => t.status === 'done').length}</div>
                            </div>
                            <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest font-black">Completed</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                @keyframes drawPath {
                    from { stroke-dashoffset: 500; }
                    to { stroke-dashoffset: 0; }
                }
                .animate-draw-path {
                    stroke-dasharray: 500;
                    stroke-dashoffset: 500;
                    animation: drawPath 2s ease-out forwards;
                }
            </style>
        `;

        container.querySelectorAll('[data-go-tasks]').forEach(el => {
            el.addEventListener('click', () => {
                currentTab = 'tasks';
                refreshDashboard();
            });
        });

        return container;
    };

    // 5. My Tasks View
    const renderTasks = () => {
        const container = document.createElement('div');
        container.className = "flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20";

        const tasksTodo = activeTasks.filter(t => t.status === 'todo');
        const tasksInProgress = activeTasks.filter(t => t.status === 'in-progress');
        const tasksReview = activeTasks.filter(t => t.status === 'review');
        const tasksDone = activeTasks.filter(t => t.status === 'done');

        container.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h2 class="text-2xl font-black text-slate-900 tracking-tight">Assigned Protocols</h2>
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time Task Management</p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        ${activeTasks.length} Total Targets
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- TODO Column -->
                ${renderTaskColumn('Backlog', 'todo', tasksTodo, 'bg-slate-100 text-slate-500', '📝')}
                <!-- IN PROGRESS Column -->
                ${renderTaskColumn('Active', 'in-progress', tasksInProgress, 'bg-blue-100 text-blue-600', '⚡')}
                <!-- REVIEW Column -->
                ${renderTaskColumn('Validation', 'review', tasksReview, 'bg-amber-100 text-amber-600', '🔍')}
                <!-- DONE Column -->
                ${renderTaskColumn('Completed', 'done', tasksDone, 'bg-emerald-100 text-emerald-600', '✅')}
            </div>
        `;

        function renderTaskColumn(title: string, status: string, tasks: any[], colorClass: string, icon: string) {
            return `
                <div class="flex flex-col gap-4">
                    <div class="flex items-center justify-between px-2">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">${icon}</span>
                            <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500">${title}</h3>
                        </div>
                        <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${colorClass}">${tasks.length}</span>
                    </div>
                    <div class="flex flex-col gap-3 min-h-[150px] p-2 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                        ${tasks.length === 0 ? `
                             <div class="flex-1 flex flex-col items-center justify-center py-10 opacity-30">
                                <span class="text-2xl mb-1">${icon}</span>
                                <p class="text-[8px] font-black uppercase tracking-widest">Clear</p>
                             </div>
                        ` : tasks.map(t => `
                            <div class="task-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group relative cursor-pointer" data-id="${t._id}">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="w-2 h-2 rounded-full ${t.priority === 'high' ? 'bg-red-500' : (t.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500')}"></span>
                                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button class="status-btn w-6 h-6 rounded-lg bg-slate-50 hover:bg-indigo-600 hover:text-white flex items-center justify-center text-[10px] transition-all" data-next-status="${getNextStatus(t.status)}" title="Move to next stage">➔</button>
                                    </div>
                                </div>
                                <h4 class="text-xs font-black text-slate-900 leading-tight mb-1">${t.title}</h4>
                                <p class="text-[10px] text-slate-500 font-medium line-clamp-2">${t.description || 'No additional details.'}</p>
                                ${t.dueDate ? `<div class="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-300">
                                    <span>Due</span>
                                    <span>${new Date(t.dueDate).toLocaleDateString()}</span>
                                </div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        function getNextStatus(current: string) {
            const flow = ['todo', 'in-progress', 'review', 'done'];
            const idx = flow.indexOf(current);
            return flow[(idx + 1) % flow.length];
        }

        // Add Event Listeners
        container.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const taskId = (btn.closest('.task-card') as HTMLElement).getAttribute('data-id');
                const nextStatus = (btn as HTMLElement).getAttribute('data-next-status');
                if (!taskId || !nextStatus) return;

                try {
                    // Optimistic update
                    const taskIdx = activeTasks.findIndex(t => t._id === taskId);
                    if (taskIdx > -1) {
                        activeTasks[taskIdx].status = nextStatus;
                        refreshDashboard();
                    }

                    await APIClient.updateTaskStatus(taskId, nextStatus);
                    dom.showAlert('Task status updated successfully', 'success');
                    await syncData(); // Final sync
                } catch (err: any) {
                    dom.showAlert(err.message || 'Failed to update task', 'danger');
                    await syncData();
                }
            });
        });

        container.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', () => {
                const taskId = card.getAttribute('data-id');
                const task = activeTasks.find(t => t._id === taskId);
                if (task) {
                    showModal("Task Intelligence", `
                        <div class="space-y-6">
                            <div class="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm">🎯</div>
                                <div>
                                    <h4 class="text-lg font-black text-slate-900 tracking-tight">${task.title}</h4>
                                    <p class="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-0.5">${task.status} Protocol</p>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <h5 class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Description</h5>
                                <div class="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 leading-relaxed">
                                    ${task.description || 'No detailed instructions provided by manager.'}
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                                    <p class="text-sm font-black uppercase ${task.priority === 'high' ? 'text-red-500' : 'text-indigo-600'}">${task.priority}</p>
                                </div>
                                <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                                    <p class="text-sm font-black text-slate-900">${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</p>
                                </div>
                            </div>
                        </div>
                    `);
                }
            });
        });

        return container;
    };

    // 6. Reports View
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
                    <h2 class="text-xl font-black text-slate-900 tracking-tight">Working Hours History</h2>
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
                                    <p class="text-lg font-black text-slate-900 tracking-tight" id="${isToday ? 'report-today-timer' : ''}">
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

    // 6. Settings State & View
    let settingsState = {
        sms: true,
        biometric: false
    };

    const renderSettings = () => {
        const container = document.createElement('div');
        container.className = "grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500";

        container.innerHTML = `
            <div class="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all mb-8">
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
                
                <div class="p-8 md:p-10">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="relative group">
                            <label class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block px-1">Legal Full Name</label>
                            <div class="flex items-center gap-4 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl group-hover:border-indigo-100 transition-all">
                                <div class="text-xl">📛</div>
                                <div class="flex-1">
                                    <p class="text-sm font-black text-slate-900">${user?.name || ''}</p>
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
                                    <p class="text-sm font-black text-slate-900">${user?.email || ''}</p>
                                    <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verified Alias</p>
                                </div>
                                <div class="text-indigo-500 text-xs font-black">✓</div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-8 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                        <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-indigo-50 shrink-0">🏛️</div>
                        <div>
                            <h5 class="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Central Directory Sync</h5>
                            <p class="text-xs text-indigo-700 font-medium leading-relaxed">Personal identifiers are synchronized with the <strong>Global HR Directory</strong>. To update these records, please submit a modification request through the <span id="link-governance-employee" class="underline cursor-pointer decoration-2 underline-offset-4 font-black">Governance Portal</span>.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 class="text-xl font-black text-slate-900 mb-8 tracking-tight">Preferences</h3>
                <div class="space-y-4">
                    <div class="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-white hover:border-indigo-100 transition-all group cursor-pointer">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 shrink-0 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-sm">🔔</div>
                            <div>
                                <p class="text-sm font-black text-slate-700">SMS Alerts</p>
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time notifications</p>
                            </div>
                        </div>
                        <div class="w-12 h-6 bg-indigo-600 rounded-full relative">
                            <div class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                    </div>

                    <div class="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-white hover:border-indigo-100 transition-all group cursor-pointer opacity-50">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 shrink-0 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-sm">🧬</div>
                            <div>
                                <p class="text-sm font-black text-slate-700">Biometric Access</p>
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Unavailable on Web</p>
                            </div>
                        </div>
                        <div class="w-12 h-6 bg-slate-200 rounded-full relative">
                            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                <h3 class="text-xl font-black text-slate-900 mb-8 tracking-tight">Security Actions</h3>
                <div class="grid gap-4 flex-1">
                    <button class="w-full py-5 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all text-left flex justify-between items-center group">
                        Change System Password
                        <span class="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                    <button id="btn-delete-acc" class="w-full py-5 px-6 rounded-2xl bg-red-50 border border-red-100 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white transition-all text-left flex justify-between items-center group">
                        Termination (Delete Account)
                        <span class="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                </div>
                <div class="mt-8 pt-8 border-t border-slate-100">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Last Security Audit: Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
        `;

        container.querySelector('#btn-delete-acc')?.addEventListener('click', () => {
            const m = showModal("Account Deletion", `
                <div class="text-center py-4">
                    <div class="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 animate-bounce">⚠️</div>
                    <h4 class="text-2xl font-black text-slate-900 mb-4 tracking-tightest">Irreversible Action</h4>
                    <p class="text-slate-500 mb-10 text-sm leading-relaxed px-4">Your entire work record, profile, and access will be <span class="text-red-600 font-black">permanently wiped</span> from our servers instantly.</p>
                    <div class="flex flex-col gap-3">
                        <button id="confirm-del" class="w-full py-5 rounded-2xl bg-red-600 text-white font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-red-100 hover:bg-black active:scale-[0.98] transition-all">Destroy Data & Logout</button>
                        <button class="modal-close-manual w-full py-5 rounded-2xl bg-slate-100 text-slate-600 font-black text-[12px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">Retain Account</button>
                    </div>
                </div>
            `);
            m.querySelector('.modal-close-manual')?.addEventListener('click', () => m.remove());
            m.querySelector('#confirm-del')?.addEventListener('click', async () => {
                const b = m.querySelector('#confirm-del') as HTMLButtonElement;
                b.textContent = "WIPING..."; b.disabled = true;
                await APIClient.deleteAccount().catch(() => { });
                dom.showAlert("Account wiped. Redirecting...", "success");
                setTimeout(() => AuthService.logout(), 300);
            });
        });

        // Governance Portal Handler (Employee)
        container.querySelector('#link-governance-employee')?.addEventListener('click', () => {
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

        return container;
    };

    // 7. Time Off View
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
            <div class="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm self-start mb-4">
                <button id="tab-leave-history" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeLeaveTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}">My History</button>
                <button id="tab-holiday-calendar" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeLeaveTab === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}">Full Holiday Schedule</button>
            </div>

            ${activeLeaveTab === 'history' ? `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2 space-y-8">
                        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <div class="flex items-center justify-between mb-8">
                                <div>
                                    <h3 class="text-xl font-black text-slate-900 tracking-tight">Time Off History</h3>
                                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Track your leave applications</p>
                                </div>
                                <button id="btn-apply-leave" class="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100">Apply for Leave</button>
                            </div>
                            
                            <div class="space-y-4">
                                ${myLeaves.length === 0 ? `
                                    <div class="py-12 text-center text-slate-400 font-bold italic">You haven't applied for any leaves yet.</div>
                                ` : myLeaves.map(leave => `
                                    <div class="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-sm">
                                                ${leave.type === 'sick' ? '🤒' : (leave.type === 'vacation' ? '🏖️' : '🏠')}
                                            </div>
                                            <div>
                                                <p class="text-xs font-black text-slate-900 uppercase tracking-widest">${leave.type} Leave</p>
                                                <p class="text-[10px] text-slate-400 font-bold mt-1">
                                                    ${new Date(leave.startDate).toLocaleDateString()} — ${new Date(leave.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span class="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : (leave.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700')}">
                                            ${leave.status}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center justify-between">
                            Quick Stats
                            <span class="text-indigo-600">🌴</span>
                        </h3>
                        <div class="grid grid-cols-1 gap-4">
                            <div class="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-center">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Approved Leaves</p>
                                <p class="text-3xl font-black text-slate-900">${myLeaves.filter(l => l.status === 'approved').length}</p>
                            </div>
                            <div class="p-6 rounded-3xl bg-amber-50 border border-amber-100 text-center">
                                <p class="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2">Pending Requests</p>
                                <p class="text-3xl font-black text-amber-600">${myLeaves.filter(l => l.status === 'pending').length}</p>
                            </div>
                        </div>
                        <button id="view-full-cal-btn" class="w-full mt-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100">View Holiday Calendar</button>
                    </div>
                </div>
            ` : `
                <div class="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
                    <div class="relative z-10">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                            <div>
                                <h3 class="text-2xl font-black text-slate-900 tracking-tight">2026 Company Holiday Schedule</h3>
                                <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Full breakdown of all company-wide holidays and observances</p>
                            </div>
                            <button id="back-to-history" class="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Back to history</button>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            ${publicHolidays.map(h => `
                                <div class="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all group flex flex-col justify-between">
                                    <div class="flex justify-between items-start mb-4">
                                        <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            📅
                                        </div>
                                        <span class="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${h.type === 'Public' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}">
                                            ${h.type}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 class="text-sm font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">${h.name}</h4>
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            ${new Date(h.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `}
        `;

        container.querySelector('#tab-leave-history')?.addEventListener('click', () => {
            activeLeaveTab = 'history';
            refreshDashboard();
        });

        container.querySelector('#tab-holiday-calendar')?.addEventListener('click', () => {
            activeLeaveTab = 'calendar';
            refreshDashboard();
        });

        container.querySelector('#view-full-cal-btn')?.addEventListener('click', () => {
            activeLeaveTab = 'calendar';
            refreshDashboard();
        });

        container.querySelector('#back-to-history')?.addEventListener('click', () => {
            activeLeaveTab = 'history';
            refreshDashboard();
        });

        container.querySelector('#btn-apply-leave')?.addEventListener('click', () => {
            const m = showModal("Apply for Leave", `
                <form id="leave-form" class="space-y-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Leave Type</label>
                            <select name="type" required class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                                <option value="vacation">Vacation</option>
                                <option value="sick">Sick Leave</option>
                                <option value="personal">Personal</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Reason</label>
                            <input name="reason" required placeholder="Reason for leave..." class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Start Date</label>
                            <input type="date" name="startDate" required class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                        </div>
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">End Date</label>
                            <input type="date" name="endDate" required class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:border-indigo-500 transition-all outline-none">
                        </div>
                    </div>
                    <button type="submit" class="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all">Submit Application</button>
                </form>
            `);

            m.querySelector('#leave-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data = Object.fromEntries(formData.entries()) as any;

                try {
                    // Optimistic update
                    const tempLeave = {
                        _id: 'temp-' + Date.now(),
                        ...data,
                        status: 'pending',
                        createdAt: new Date().toISOString()
                    };
                    myLeaves = [tempLeave, ...myLeaves];
                    refreshDashboard();
                    m.remove();
                    dom.showAlert("Leave application transmitted.", "success");

                    const res = await APIClient.applyLeave(data);
                    if (!res.success) {
                        myLeaves = myLeaves.filter(l => l._id !== tempLeave._id);
                        refreshDashboard();
                        dom.showAlert("Application failed. Reverted.", "danger");
                    } else {
                        await syncData();
                    }
                } catch (err: any) {
                    console.error(err);
                    await syncData();
                }
            });
        });

        return container;
    };

    // --- REFRESH LOGIC ---
    const refreshDashboard = () => {
        main.innerHTML = '';
        renderHeader();
        main.appendChild(header);

        // --- NAV RE-RENDER --- (Keeping bell listeners alive)
        const bell = navRight.querySelector('#notif-bell');
        if (bell) {
            bell.addEventListener('click', (e) => {
                e.stopPropagation();
                isNotificationOpen = !isNotificationOpen;
                refreshDashboard(); // Simple re-render to update nav too
            });
        }
        navRight.querySelectorAll('[data-nid]').forEach(item => {
            item.addEventListener('click', async () => {
                const nid = item.getAttribute('data-nid');
                if (nid) {
                    await APIClient.markNotificationRead(nid);
                    notifications = notifications.map(n => n._id === nid ? { ...n, isRead: true } : n);
                    refreshDashboard();
                }
            });
        });

        // Attach Quick Task Listener
        header.querySelector('#quick-task-btn')?.addEventListener('click', () => showCreateTaskModal());

        if (currentTab === 'overview') {
            updateAttendanceUI();
            main.appendChild(attendanceCard);
            updateStats();
            main.appendChild(statsGrid);
            renderAnalysis();
            main.appendChild(analysisCard);
        } else if (currentTab === 'insights') {
            main.appendChild(renderInsights());
        } else if (currentTab === 'tasks') {
            main.appendChild(renderTasks());
        } else if (currentTab === 'leaves') {
            main.appendChild(renderLeaves());
        } else if (currentTab === 'reports') {
            main.appendChild(renderReports());
        } else if (currentTab === 'settings') {
            main.appendChild(renderSettings());
        }
    };

    const syncData = async () => {
        try {
            attendance = await AttendanceService.refreshState();
            const [statsRes, leaveRes, taskRes, notifRes] = await Promise.all([
                AttendanceService.getStats(),
                APIClient.getMyLeaves(),
                APIClient.getMyTasks(),
                APIClient.getNotifications()
            ]);
            if (statsRes?.success) stats = statsRes;
            if (leaveRes.success) myLeaves = leaveRes.data as any[];
            if (taskRes.success) activeTasks = taskRes.data as any[];
            if (notifRes.success) {
                const newUnread = (notifRes.data as any[]).filter(n => !n.isRead && !notifications.some(on => on._id === n._id));
                if (newUnread.length > 0) dom.showAlert(`Alert: ${newUnread[0].title}`, 'info');
                notifications = notifRes.data;
            }
            refreshDashboard();
        } catch (e) {
            console.error("Dashboard sync error", e);
        }
    };

    syncData();

    // --- REAL-TIME DATA POLLING ---
    const dataPollingInterval = setInterval(() => {
        if (!wrapper.isConnected) return clearInterval(dataPollingInterval);
        // Only pool when the tab is overview, insights or tasks to keep it highly reactive
        if (['overview', 'insights', 'tasks'].includes(currentTab)) {
            syncData();
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
            : st.totalSecondsToday;

        const h = Math.floor(displaySeconds / 3600);
        const m = Math.floor((displaySeconds % 3600) / 60);
        const s = displaySeconds % 60;

        const timerEl = document.getElementById('work-timer');
        if (timerEl) {
            timerEl.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }

        const reportsTimerEl = document.getElementById('report-today-timer');
        if (reportsTimerEl) {
            reportsTimerEl.innerText = `${h}h ${m}m`;
        }
    }, 1000);

    document.addEventListener('click', () => {
        if (isNotificationOpen) {
            isNotificationOpen = false;
            refreshDashboard();
        }
    });

    return wrapper;
};
