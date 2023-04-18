import { useMemo } from "react";

const DateField = ({
    className,
    label,
    value,
    onChange,
}: {
    className?: string;
    label: string;
    value: Date;
    onChange?: (value: Date) => void;
    type?: string;
}): JSX.Element => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = new Date();
        console.log(e.target.value);
        const pieces = e.target.value.split("-");
        date.setFullYear(Number(pieces[0]));
        date.setMonth(Number(pieces[1]) - 1);
        date.setDate(Number(pieces[2]));
        if (onChange) onChange(date);
    };

    const stringValue = useMemo(() => {
        const padZero = (val: number, targetLength = 2): string => {
            let output = String(val);
            while (output.length < targetLength) output = "0" + output;
            return output;
        };
        return `${padZero(value.getFullYear(), 4)}-${padZero(value.getMonth() + 1)}-${padZero(
            value.getDate()
        )}`;
    }, [value]);

    return (
        <div className={`w-full flex items-center ${className}`}>
            <label className="w-24">{label}</label>
            <input
                type="date"
                className="flex-grow bg-gray-700 rounded px-2 py-1"
                value={stringValue}
                onChange={handleChange}
            />
        </div>
    );
};

export default DateField;
