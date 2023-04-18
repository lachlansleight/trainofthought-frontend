import { ReactNode, useMemo, useRef } from "react";
import useElementDimensions from "lib/hooks/useElementDimensions";

const ProgressContainer = ({
    children,
    progress,
    className = "",
    thickness = 2,
    color = "black",
}: {
    children: ReactNode;
    progress: number;
    className?: string;
    thickness?: number;
    color?: string;
}): JSX.Element => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { width, height } = useElementDimensions(containerRef);

    const backgroundPosition = useMemo<string>(() => {
        const totalLength = width * 2 + height * 2;
        const borderLen = progress * totalLength;
        if (borderLen <= width) {
            return `${-width + borderLen}px 0px, ${width - thickness}px -${height}px, ${width}px ${
                height - thickness
            }px, 0px ${height}px`;
        } else if (borderLen <= width + height) {
            return `0px 0px, ${width - thickness}px ${-height + borderLen - width}px, ${width}px ${
                height - thickness
            }px, 0px ${height}px`;
        } else if (borderLen <= width * 2 + height) {
            return `0px 0px, ${width - thickness}px 0px, ${width - borderLen + width + height}px ${
                height - thickness
            }px, 0px ${height}px`;
        } else {
            return `0px 0px, ${width - thickness}px 0px, 0px ${height - thickness}px, 0px ${
                height - (borderLen - width * 2 - height)
            }px`;
        }
    }, [progress, width, height, thickness]);

    const background = useMemo<string>(() => {
        const backgrounds: string[] = [
            `linear-gradient(to right, ${color} 99.99%, transparent)`,
            `linear-gradient(to bottom, ${color} 99.99%, transparent)`,
            `linear-gradient(to right, ${color} 99.99%, transparent)`,
            `linear-gradient(to bottom, ${color} 99.99%, transparent)`,
        ];
        return backgrounds.join(", ");
    }, [color]);

    const backgroundSize = useMemo<string>(() => {
        const sizes: string[] = [
            `100% ${thickness}px`,
            `${thickness}px 100%`,
            `100% ${thickness}px`,
            `${thickness}px 100%`,
        ];
        return sizes.join(", ");
    }, [thickness]);

    return (
        <div
            style={{
                background,
                backgroundSize,
                backgroundPosition,
                backgroundRepeat: "no-repeat",
            }}
            ref={containerRef}
            className={className || ""}
        >
            {children}
        </div>
    );
};

export default ProgressContainer;
