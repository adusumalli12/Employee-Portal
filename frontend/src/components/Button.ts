export const Button = (props: {
    text: string,
    onClick?: (e: MouseEvent) => void,
    type?: "submit" | "button",
    variant?: "primary" | "secondary" | "danger",
    className?: string,
    id?: string,
    loading?: boolean
}) => {
    const btn = document.createElement('button');
    btn.type = props.type || "button";
    if (props.id) btn.id = props.id;

    const baseStyles = "w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2";
    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 shadow-indigo-200/50",
        secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:-translate-y-0.5",
        danger: "bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5"
    };

    btn.className = `${baseStyles} ${variants[props.variant || "primary"]} ${props.className || ""}`;

    if (props.loading) {
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> Processing...`;
    } else {
        btn.innerText = props.text;
    }

    if (props.onClick) btn.addEventListener('click', props.onClick);

    return btn;
};
