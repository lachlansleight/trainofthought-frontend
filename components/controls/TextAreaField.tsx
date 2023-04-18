const TextAreaField = ({
    label,
    value,
    onChange,
    error,
    placeholder,
    className = "",
}: {
    label?: string;
    value: string;
    onChange: (newVal: string) => void;
    error?: string;
    placeholder?: string;
    className?: string;
}): JSX.Element => {
    return (
        <div className={`flex flex-col ${className}`}>
            <label className="text-white text-opacity-50 text-xs">{label || " "}</label>
            <textarea
                className="bg-gray-800 text-white px-2 py-1 rounded sans-serif h-48 resize-none flex-grow"
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
            />
            {error ? (
                <p className="text-red-500 text-opacity-50 text-xs">{error}</p>
            ) : (
                <div className="h-4" />
            )}
        </div>
    );
};

export default TextAreaField;
