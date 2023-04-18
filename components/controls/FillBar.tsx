import { ReactNode } from "react";

const FillBar = ({
    progress,
    className,
    color,
    children,
    manualColor,
}: {
    progress: number;
    className?: string;
    color?: string;
    children?: ReactNode;
    manualColor?: string;
}): JSX.Element => {
    return (
        <div className={`relative h-8 flex-grow rounded border ${className || ""}`}>
            <div
                className={`absolute left-0 top-0 h-full grid place-items-center ${
                    color || "bg-blue-500"
                }`}
                style={{
                    width: `${Math.min(1.0, Math.max(0.0, progress)) * 100}%`,
                    backgroundColor: manualColor || undefined,
                }}
            ></div>
            <div className={`absolute w-full h-full grid place-items-center z-10`}>
                {children || null}
            </div>
        </div>
    );
};

export default FillBar;
