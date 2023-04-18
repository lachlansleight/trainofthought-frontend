import Slider from "./Slider";

const SliderField = ({
    label,
    value,
    min,
    max,
    onChange,
    displayLabel = (val: number) => String(val),
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (val: number) => void;
    displayLabel?: (val: number) => string;
}): JSX.Element => {
    return (
        <div className="flex flex-col">
            <div className="flex justify-between text-sm">
                <p>{label}</p>
                <p>{displayLabel(value)}</p>
            </div>
            <Slider value={value} min={min} max={max} onChange={onChange} />
        </div>
    );
};

export default SliderField;
