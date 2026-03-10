import { AuthService } from '../../services/AuthService';
import APIClient from '../../api/client';
import { Button } from '../../components/Button';
import * as dom from '../../utils/dom';

export const AdminApprovalPage = () => {
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
            <span class="text-lg font-black text-slate-900 tracking-tight">Admin Console</span>
        </div>
    `;

    const navRight = document.createElement('div');
    navRight.className = "flex items-center gap-6";

    const backBtn = document.createElement('a');
    backBtn.href = "#/dashboard";
    backBtn.className = "text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors";
    backBtn.innerText = "Back to Dashboard";

    navRight.appendChild(backBtn);
    nav.appendChild(navRight);
    wrapper.appendChild(nav);

    const main = document.createElement('main');
    main.className = "flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-8";

    const header = document.createElement('div');
    header.innerHTML = `
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Manager Approvals</h1>
        <p class="text-slate-500 font-medium mt-1">Review and approve pending manager accounts.</p>
    `;
    main.appendChild(header);

    const alertContainer = document.createElement('div');
    alertContainer.id = "alertMessage";
    main.appendChild(alertContainer);

    const tableContainer = document.createElement('div');
    tableContainer.className = "bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm";

    const tableSkeleton = `
        <div class="p-12 text-center text-slate-400 font-bold">
            <div class="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            Loading pending requests...
        </div>
    `;
    tableContainer.innerHTML = tableSkeleton;
    main.appendChild(tableContainer);

    const loadApprovals = async () => {
        try {
            const response = await APIClient.getPendingManagers();
            if (response.success) {
                renderTable(response.data);
            }
        } catch (error: any) {
            dom.showAlert(error.message || "Failed to load approvals", "danger");
            tableContainer.innerHTML = `<div class="p-12 text-center text-red-500 font-bold">Error loading data.</div>`;
        }
    };

    const renderTable = (managers: any[]) => {
        if (managers.length === 0) {
            tableContainer.innerHTML = `
                <div class="p-20 text-center">
                    <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900">No Pending Approvals</h3>
                    <p class="text-slate-500 font-medium mt-1">All manager requests have been processed.</p>
                </div>
            `;
            return;
        }

        let rows = managers.map(m => `
            <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                            ${m.name[0].toUpperCase()}
                        </div>
                        <div>
                            <p class="font-bold text-slate-900">${m.name}</p>
                            <p class="text-xs text-slate-500 font-medium">${m.email}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                        ${m.position || 'Manager'}
                    </span>
                </td>
                <td class="px-6 py-5">
                    <p class="text-sm font-bold text-slate-700">${m.company || 'N/A'}</p>
                </td>
                <td class="px-6 py-5 text-right">
                    <button data-id="${m._id}" class="approve-btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all transform active:scale-95 shadow-md shadow-indigo-200">
                        Approve
                    </button>
                </td>
            </tr>
        `).join('');

        tableContainer.innerHTML = `
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100">
                        <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Manager Details</th>
                        <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Position</th>
                        <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Company</th>
                        <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;

        tableContainer.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.currentTarget as HTMLButtonElement;
                const id = target.getAttribute('data-id');
                if (!id) return;

                try {
                    target.disabled = true;
                    target.innerText = "Approving...";
                    const res = await APIClient.approveManager(id);
                    if (res.success) {
                        dom.showAlert(`Manager ${res.data.name} approved successfully!`, "success");
                        loadApprovals();
                    }
                } catch (err: any) {
                    dom.showAlert(err.message || "Approval failed", "danger");
                    target.disabled = false;
                    target.innerText = "Approve";
                }
            });
        });
    };

    loadApprovals();
    wrapper.appendChild(main);
    return wrapper;
};
