export const AuthLayout = (
    title: string,
    subtitle: string,
    children: HTMLElement,
    leftSlot?: HTMLElement
) => {
    const wrapper = document.createElement('div');
    wrapper.className = "min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50";

    const container = document.createElement('div');
    container.className = "w-full max-w-6xl flex flex-col lg:flex-row bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100";

    // Left side (Information/Branding)
    const leftPane = document.createElement('div');
    leftPane.className = "hidden lg:flex lg:w-1/2 bg-indigo-600 p-12 text-white flex-col justify-between relative overflow-hidden";

    // Abstract geometric background pattern
    leftPane.innerHTML = `
        <div class="absolute inset-0 opacity-10">
            <svg class="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon fill="currentColor" points="0,100 100,0 100,100"/>
            </svg>
            <div class="absolute top-10 left-10 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-xl"></div>
            <div class="absolute bottom-10 right-10 w-48 h-48 bg-purple-400 rounded-full mix-blend-overlay filter blur-xl"></div>
        </div>
        
        <div class="relative z-10 flex flex-col gap-6 max-w-md">
            <div class="flex items-center gap-3">
                <span class="text-3xl">✨</span>
                <span class="text-xl font-bold tracking-tight">EmployeePortal</span>
            </div>
            
            <div class="mt-8 space-y-6">
                <h2 class="text-4xl font-black leading-tight tracking-tight">
                    Manage your workforce <br/>
                    <span class="text-indigo-200">with beautiful simplicity.</span>
                </h2>
                <p class="text-indigo-100 text-lg leading-relaxed">
                    Access powerful tools to streamline your HR processes, manage employee data, and get insights instantly.
                </p>
            </div>
        </div>
        
        <div class="relative z-10 text-sm font-medium text-indigo-200 mt-12">
            © ${new Date().getFullYear()} Employee Portal Inc.
        </div>
    `;

    // Right side (Auth Form)
    const rightPane = document.createElement('div');
    rightPane.className = "w-full lg:w-1/2 p-8 sm:p-12 md:p-16 xl:p-20 flex flex-col justify-center bg-white";

    const header = document.createElement('div');
    header.className = "mb-10";

    const titleEl = document.createElement('h1');
    titleEl.className = "text-3xl sm:text-4xl font-black text-slate-900 mb-3 tracking-tight";
    titleEl.innerText = title;

    const subtitleEl = document.createElement('p');
    subtitleEl.className = "text-slate-500 font-medium text-lg";
    subtitleEl.innerText = subtitle;

    header.appendChild(titleEl);
    header.appendChild(subtitleEl);

    rightPane.appendChild(header);
    rightPane.appendChild(children);

    container.appendChild(leftPane);
    container.appendChild(rightPane);
    wrapper.appendChild(container);

    return wrapper;
};
