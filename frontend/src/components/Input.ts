export const Input = (props: {
    label: string,
    type: string,
    id: string,
    name: string,
    placeholder?: string,
    required?: boolean,
    className?: string,
    icon?: string
}) => {
    const container = document.createElement('div');
    container.className = "mb-4";

    const label = document.createElement('label');
    label.htmlFor = props.id;
    label.className = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1";
    label.innerText = props.label;

    const inputWrapper = document.createElement('div');
    inputWrapper.className = "relative";

    const input = document.createElement('input');
    input.type = props.type;
    input.id = props.id;
    input.name = props.name;
    input.placeholder = props.placeholder || "";
    input.required = !!props.required;
    input.className = `w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 ${props.className || ""}`;

    inputWrapper.appendChild(input);

    if (props.icon) {
        const iconSpan = document.createElement('span');
        iconSpan.className = "absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors select-none";
        iconSpan.innerText = props.icon;

        iconSpan.onclick = () => {
            if (input.type === 'password') {
                input.type = 'text';
                iconSpan.innerText = '🙈'; // Eye with no-see or similar
            } else {
                input.type = 'password';
                iconSpan.innerText = '👁️';
            }
        };

        inputWrapper.appendChild(iconSpan);
    }

    container.appendChild(label);
    container.appendChild(inputWrapper);

    return { container, input };
};
