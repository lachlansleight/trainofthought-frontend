import React, { useEffect, useRef } from "react";
import { getDisplayModeStyles } from "./ThreeReactUtilities";
import { ThreeSceneProps } from "./types";

const ThreeScene = (props: ThreeSceneProps) => {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!container.current) return;
    }, [container]);

    useEffect(() => {
        if (!container.current) return;
        if (!props.scene) return;
        if (!props.scene.isAttached) props.scene.attach(container.current);
    }, [props.scene, container]);

    //HERE!
    const { wrapperStyle, containerStyle } = getDisplayModeStyles(props);

    return (
        <div style={wrapperStyle} className={props.className}>
            <div ref={container} style={containerStyle}></div>
        </div>
    );
};

export default ThreeScene;
