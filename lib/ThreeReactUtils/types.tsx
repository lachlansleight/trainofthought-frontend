import SceneTemplate from "./SceneTemplate";

export type DisplayMode =
    | "div"
    | "content"
    | "fixedContent"
    | "wideContent"
    | "fixedWideContent"
    | "fullpage";

export interface ThreeSceneProps {
    scene?: SceneTemplate;
    displayMode?: DisplayMode;
    headerHeight?: number;
    footerHeight?: number;
    contentWidth?: number;
    divHeight?: number;
    className?: string;
}
