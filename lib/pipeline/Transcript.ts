import PipelineUtils from "./PipelineUtils";

export interface TranscriptData {
    id: number;
    text: string;
    prompt: string;
    image: string;
}

class Transcript implements TranscriptData {
    id = -1;
    seed = -1;
    text = "";
    prompt = "";
    image = "";

    onDataChanged: ((data: TranscriptData) => void) | null = null;

    constructor(id: number, text: string, seed = -1) {
        this.id = id;
        this.text = text.replace(/[^a-zA-Z, ]/g, "");
        this.seed = seed;

        this.runRoutine();
    }

    async runRoutine() {
        if (!this.text) return;

        this.prompt = await PipelineUtils.doKeywordReduction(this.text);
        if (this.onDataChanged) this.onDataChanged(this.getData());

        //get image from stable diffusion
        //this.image = await PipelineUtils.getTextToImage(this.prompt, this.seed);

        if (this.onDataChanged) this.onDataChanged(this.getData());
    }

    getData() {
        return {
            id: this.id,
            seed: this.seed,
            text: this.text,
            prompt: this.prompt,
            image: this.image,
        };
    }
}

export default Transcript;