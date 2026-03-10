export const PhoneInput = (props: {
    label: string,
    id: string,
    name: string,
    placeholder?: string,
    required?: boolean,
    className?: string
}) => {
    const container = document.createElement('div');
    container.className = `mb-4 ${props.className || ''}`;

    const label = document.createElement('label');
    label.htmlFor = props.id;
    label.className = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1";
    label.innerText = props.label;

    const inputWrapper = document.createElement('div');
    inputWrapper.className = "flex gap-2 relative";

    // Lightweight country prefix dropdown
    const countrySelect = document.createElement('select');
    countrySelect.className = "flex-shrink-0 w-24 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500 transition-all font-medium appearance-none";
    countrySelect.innerHTML = `
        <option value="+1">🇺🇸 +1</option>
        <option value="+44">🇬🇧 +44</option>
        <option value="+91" selected>🇮🇳 +91</option>
        <option value="+61">🇦🇺 +61</option>
        <option value="+971">🇦🇪 +971</option>
        <option value="+1">🇨🇦 +1</option>
        <option value="+49">🇩🇪 +49</option>
        <option value="+33">🇫🇷 +33</option>
        <option value="+81">🇯🇵 +81</option>
        <option value="+65">🇸🇬 +65</option>
        <option value="+49">🇩🇪 +49</option>
        <option value="+7">🇷🇺 +7</option>
        <option value="+86">🇨🇳 +86</option>
        <option value="+39">🇮🇹 +39</option>
        <option value="+34">🇪🇸 +34</option>
        <option value="+55">🇧🇷 +55</option>
        <option value="+27">🇿🇦 +27</option>
        <option value="+82">🇰🇷 +82</option>
        <option value="+92">🇵🇰 +92</option>
        <option value="+880">🇧🇩 +880</option>
        <option value="+62">🇮🇩 +62</option>
        <option value="+60">🇲🇾 +60</option>
        <option value="+66">🇹🇭 +66</option>
        <option value="+84">🇻🇳 +84</option>
        <option value="+63">🇵🇭 +63</option>
        <option value="+90">🇹🇷 +90</option>
        <option value="+20">🇪🇬 +20</option>
        <option value="+234">🇳🇬 +234</option>
        <option value="+54">🇦🇷 +54</option>
        <option value="+52">🇲🇽 +52</option>
    `;

    const input = document.createElement('input');
    input.type = "tel";
    input.id = props.id;
    input.name = props.name;
    input.placeholder = props.placeholder !== undefined ? props.placeholder : "Phone Number";
    input.required = !!props.required;
    input.className = "flex-1 w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200";

    inputWrapper.appendChild(countrySelect);
    inputWrapper.appendChild(input);

    container.appendChild(label);
    container.appendChild(inputWrapper);

    const getFullNumber = () => {
        return countrySelect.value + input.value.trim().replace(/\s+/g, '');
    };

    return { container, input, countrySelect, getFullNumber };
};
