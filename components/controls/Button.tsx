import { CSSProperties, ReactNode } from "react";

const Button = ({
    className,
    children,
    onClick,
    disabled,
    style = {},
}: {
    className?: string;
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    style?: CSSProperties;
}): JSX.Element => {
    return (
        <button
            disabled={disabled}
            className={`${disabled ? "btn-disabled" : "btn"} ${className || ""}`}
            onClick={onClick}
            style={style}
        >
            {children}
        </button>
    );
};

export default Button;
