import Toggle from "./Toggle";

const ToggleField = ({
    className,
    label,
    value,
    onChange,
}: {
    className?: string;
    label: string;
    value: boolean;
    onChange?: (value: boolean) => void;
}): JSX.Element => {
    return (
        <div className={`w-full flex items-center ${className}`}>
            <label className="w-24">{label}</label>
            <Toggle value={value} onChange={onChange} />
        </div>
    );
};

export default ToggleField;
