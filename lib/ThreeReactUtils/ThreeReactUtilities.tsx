import { CSSProperties } from "react";
import { ThreeSceneProps } from "./types";

export const getDisplayModeStyles = (props: ThreeSceneProps) => {
    const wrapperStyle: CSSProperties = {};
    const containerStyle: CSSProperties = {};

    switch (props.displayMode ?? "div") {
        case "div":
            containerStyle.height = props.divHeight ?? "100%";
            break;
        case "content":
            //wrapperStyle.position = "absolute";
            wrapperStyle.top = props.headerHeight + "px";
            wrapperStyle.left = (window.innerWidth - (props.contentWidth ?? 1000)) / 2 + "px";
            wrapperStyle.width = (props.contentWidth ?? 1000) + "px";
            wrapperStyle.height =
                window.innerHeight - ((props.footerHeight ?? 0) + (props.headerHeight ?? 0)) + "px";
            wrapperStyle.minHeight = document.body.offsetHeight;

            containerStyle.height = "100%";
            break;
        case "wideContent":
            wrapperStyle.position = "absolute";
            wrapperStyle.top = props.headerHeight + "px";
            wrapperStyle.left = "0px";
            wrapperStyle.width = window.innerWidth + "px";
            wrapperStyle.height =
                window.innerHeight - ((props.footerHeight ?? 0) + (props.headerHeight ?? 0)) + "px";
            wrapperStyle.minHeight =
                window.innerHeight - ((props.footerHeight ?? 0) + (props.headerHeight ?? 0)) + "px";

            containerStyle.height = "100%";
            break;
        case "fixedContent":
            //todo
            break;
        case "fixedWideContent":
            //todo
            break;
        case "fullpage":
            wrapperStyle.position = "absolute";
            wrapperStyle.top = "0px";
            wrapperStyle.left = "0px";
            wrapperStyle.width = window.innerWidth + "px";
            wrapperStyle.height = window.innerHeight + "px";
            wrapperStyle.minHeight = document.body.offsetHeight;

            containerStyle.height = "100%";
            break;
    }

    return {
        wrapperStyle,
        containerStyle,
    };
};
