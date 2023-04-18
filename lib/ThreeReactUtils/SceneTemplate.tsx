import * as THREE from "three";

class SceneTemplate {
    public renderer: THREE.WebGLRenderer;
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public container: HTMLElement | null = null;

    public isAttached = false;
    public isSetup = false;

    constructor() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1.333, 0.1, 1000);
    }

    lastTime = 0;

    doAnimate = (time: number) => {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        requestAnimationFrame(this.doAnimate);
        this.update(time / 1000.0, deltaTime / 1000.0);
        this.renderer.render(this.scene, this.camera);
    };

    //for overriding
    public attach(container: HTMLElement) {
        console.log("Attaching to ", container);
        if (!container) return;
        this.container = container;

        const width = (this.container as HTMLDivElement).offsetWidth;
        const height = (container as HTMLDivElement).offsetHeight;

        this.container.appendChild(this.renderer.domElement);

        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.isAttached = true;
        this.doAnimate(0);

        if (!this.isSetup) {
            this.setup();
        }
    }
    public setup() {
        throw new Error("Scene template setup called");
    }
    public update(time: number, deltaTime: number) {
        console.error({ time, deltaTime });
        throw new Error("Scene template update called");
    }
}

export default SceneTemplate;
