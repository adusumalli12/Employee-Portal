export const showAlert = (message: string, type: string = 'info'): void => {
    const alertDiv = document.getElementById('alertMessage');
    if (!alertDiv) return;

    alertDiv.textContent = message;

    const colors = {
        success: 'bg-green-50 border-green-200 text-green-700',
        danger: 'bg-red-50 border-red-200 text-red-700',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        info: 'bg-blue-50 border-blue-200 text-blue-700'
    };

    const colorClass = (colors as any)[type] || colors.info;

    alertDiv.className = `p-4 px-10 rounded-full border-2 text-sm font-black text-center animate-in fade-in slide-in-from-top-4 duration-300 ${colorClass}`;
    alertDiv.style.display = 'block';
};

export const hideAlert = (): void => {
    const alertDiv = document.getElementById('alertMessage');
    if (!alertDiv) return;
    alertDiv.style.display = 'none';
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
