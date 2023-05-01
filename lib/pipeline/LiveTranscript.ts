import { TranscriberState, TranscriberInterface } from "lib/Transcriber";
import DeepgramTranscriber from "lib/deepgramTranscriber";
import { TranscriptData } from "./Transcript";
import PipelineUtils from "./PipelineUtils";

export interface LiveTranscriptData extends TranscriptData {
    status: TranscriberState;
    summarizedText: string;
    word: string;
    lastWord: string;
}

class LiveTranscript implements LiveTranscriptData {
    id = -1;
    status: TranscriberState = "inactive";
    seed = -1;
    text = "";
    summarizedText = "";
    word = "abstract";
    lastWord = "abstract";
    prompt = "";
    image = "";

    transcriber: TranscriberInterface | null = null;

    onTranscriptReceived: ((text: string) => void) | null = null;
    onDataChanged: ((data: LiveTranscriptData) => void) | null = null;

    constructor(seed = -1) {
        this.transcriber = new DeepgramTranscriber();
        this.transcriber.addStateChangeListener(s => {
            this.status = s;
            if (this.onDataChanged) this.onDataChanged(this.getData());
        });
        this.transcriber.addInterimListener(t => {
            this.text = t;
            if (this.onDataChanged) this.onDataChanged(this.getData());
        });
        this.transcriber.addTranscriptListener(t => {
            this.text = t;
            if (this.onTranscriptReceived) this.onTranscriptReceived(t);
            if (this.onDataChanged) this.onDataChanged(this.getData());
        });
        this.seed = seed;
    }

    async runRoutine() {
        this.summarizedText = this.text; //todo: actually get a useful summary from GPT-3
        if (this.onDataChanged) this.onDataChanged(this.getData());

        this.prompt = await PipelineUtils.doKeywordReduction(this.summarizedText);
        if (this.onDataChanged) this.onDataChanged(this.getData());

        this.lastWord = this.word;
        this.word = this.prompt.split(",")[0].trim();
        if (this.onDataChanged) this.onDataChanged(this.getData());

        //get image from stable diffusion
        //this.image = await PipelineUtils.getTextToImage(this.prompt, this.seed);
        if (this.onDataChanged) this.onDataChanged(this.getData());
    }

    start() {
        if (!this.transcriber) return;
        this.transcriber.start();
    }

    stop() {
        if (!this.transcriber) return;
        this.transcriber.stop();
    }

    getData() {
        return {
            id: this.id,
            status: this.status,
            seed: this.seed,
            text: this.text,
            summarizedText: this.summarizedText,
            word: this.word,
            lastWord: this.lastWord,
            prompt: this.prompt,
            image: this.image,
        };
    }

    static getDefaultData(): LiveTranscriptData {
        return {
            id: -1,
            status: "inactive",
            text: "",
            summarizedText: "",
            word: "",
            lastWord: "",
            prompt: "",
            image: "",
        }
    }
}

export default LiveTranscript;