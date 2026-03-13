let toastContainer: HTMLDivElement | null = null;

const createToastContainer = () => {
    if (toastContainer) return toastContainer;
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none w-full max-w-sm';
    document.body.appendChild(toastContainer);
    return toastContainer;
};

export const showAlert = (message: string, type: 'success' | 'danger' | 'warning' | 'info' | string = 'info'): void => {
    const container = createToastContainer();
    
    const toast = document.createElement('div');
    
    const icons = {
        success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>`,
        danger: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>`,
        warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
        info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
    };

    const colors = {
        success: 'from-emerald-500 to-teal-600 text-white shadow-emerald-200/50',
        danger: 'from-rose-500 to-red-600 text-white shadow-rose-200/50',
        warning: 'from-amber-400 to-orange-500 text-white shadow-amber-200/50',
        info: 'from-indigo-500 to-blue-600 text-white shadow-indigo-200/50'
    };

    const iconBg = {
        success: 'bg-emerald-400/20',
        danger: 'bg-rose-400/20',
        warning: 'bg-amber-400/20',
        info: 'bg-indigo-400/20'
    };

    const selectedIcon = (icons as any)[type] || icons.info;
    const selectedColor = (colors as any)[type] || colors.info;
    const selectedIconBg = (iconBg as any)[type] || iconBg.info;

    toast.className = `
        pointer-events-auto
        flex items-center gap-4
        pl-2 pr-8 py-2
        rounded-2xl
        bg-gradient-to-r ${selectedColor}
        shadow-[0_20px_50px_rgba(0,0,0,0.15)]
        text-sm
        font-black
        tracking-tight
        animate-in fade-in slide-in-from-right-8 duration-700
        z-[10000]
        relative
        overflow-hidden
        group
    `;
    
    toast.innerHTML = `
        <div class="w-10 h-10 rounded-xl ${selectedIconBg} flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
            ${selectedIcon}
        </div>
        <div class="flex flex-col">
            <span class="uppercase text-[10px] opacity-70 font-black tracking-widest">${type}</span>
            <span class="leading-tight">${message}</span>
        </div>
        <div class="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
            <div class="h-full bg-white/60 w-full origin-left animate-[toast-progress_5s_linear_forwards]"></div>
        </div>
        <style>
            @keyframes toast-progress {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }
        </style>
    `;
    
    container.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out', 'slide-out-to-right-8', 'zoom-out-95');
        setTimeout(() => toast.remove(), 600);
    }, 5000);
};

export const hideAlert = (): void => {
    // Legacy support: remove all toasts if needed
    if (toastContainer) {
        toastContainer.innerHTML = '';
    }
};

export const showLoading = (buttonId: string, loadingText: string = 'Processing...'): void => {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    if (!button) return;

    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `<span class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> ${loadingText}`;
};

export const hideLoading = (buttonId: string, originalText?: string): void => {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    if (!button) return;

    button.disabled = false;
    button.innerHTML = originalText || button.dataset.originalText || 'Submit';
};
