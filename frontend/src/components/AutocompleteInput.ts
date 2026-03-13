
export const AutocompleteInput = (props: {
    label: string,
    id: string,
    name: string,
    placeholder?: string,
    required?: boolean,
    className?: string,
    options: string[]
}) => {
    const container = document.createElement('div');
    container.className = `mb-4 relative ${props.className || ""}`;

    const label = document.createElement('label');
    label.htmlFor = props.id;
    label.className = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1";
    label.innerHTML = props.label + (props.required ? ' <span class="text-red-500">*</span>' : '');

    const inputWrapper = document.createElement('div');
    inputWrapper.className = "relative group";

    const input = document.createElement('input');
    input.type = "text";
    input.id = props.id;
    input.name = props.name;
    input.placeholder = props.placeholder || "";
    input.required = !!props.required;
    input.autocomplete = "off";
    input.className = "w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-200 pr-10 shadow-sm";

    const arrowIcon = document.createElement('div');
    arrowIcon.className = "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-200 group-focus-within:rotate-180";
    arrowIcon.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>`;

    const list = document.createElement('div');
    list.className = "absolute left-0 right-0 top-[calc(100%+8px)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200";
    
    const renderOptions = (filteredOptions: string[]) => {
        list.innerHTML = '';
        if (filteredOptions.length === 0) {
            const empty = document.createElement('div');
            empty.className = "px-4 py-3 text-xs text-slate-400 italic font-medium";
            empty.innerText = "No matches found";
            list.appendChild(empty);
            return;
        }

        filteredOptions.forEach(opt => {
            const item = document.createElement('div');
            item.className = "px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer transition-colors border-b border-slate-50 last:border-none";
            
            // Highlight matching text
            const val = input.value.toLowerCase();
            const idx = opt.toLowerCase().indexOf(val);
            if (idx > -1 && val.length > 0) {
                const before = opt.substring(0, idx);
                const match = opt.substring(idx, idx + val.length);
                const after = opt.substring(idx + val.length);
                item.innerHTML = `${before}<span class="text-indigo-600 underline decoration-2">${match}</span>${after}`;
            } else {
                item.innerText = opt;
            }

            item.onclick = (e) => {
                e.stopPropagation();
                input.value = opt;
                list.classList.add('hidden');
                input.dispatchEvent(new Event('input'));
            };
            list.appendChild(item);
        });
    };

    input.onfocus = () => {
        renderOptions(props.options);
        list.classList.remove('hidden');
    };

    input.oninput = () => {
        const val = input.value.toLowerCase();
        const filtered = props.options.filter(o => o.toLowerCase().includes(val));
        renderOptions(filtered);
        list.classList.remove('hidden');
    };

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target as Node)) {
            list.classList.add('hidden');
        }
    });

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(arrowIcon);
    inputWrapper.appendChild(list);

    container.appendChild(label);
    container.appendChild(inputWrapper);

    return { container, input };
};
