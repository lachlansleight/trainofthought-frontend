import LiveTranscript, { LiveTranscriptData } from "./LiveTranscript";
import Transcript, { TranscriptData } from "./Transcript";
import PipelineUtils from "./PipelineUtils";

export interface TrainOfThoughtData {
    seed: number;
    liveInterpolant: number;
    paragraphInterpolant: number;
    interpolationIds: number[];
    prompt: string;
    fromPrompt: string;
    toPrompt: string;
    image: string | null;
    liveTranscript: LiveTranscriptData;
    transcripts: TranscriptData[];
    transcriptBuffer: string;
}

export interface TrainOfThoughtMethods {
    start: () => void;
    stop: () => void;
    manuallySetLiveTranscriptText: (text: string) => void;
    manuallyFinishLiveTranscript: () => void;
    setInterpolants: (liveInterpolant: number, paragraphInterpolant: number) => void;
    setNewInterpolationTarget: () => void;
    runRoutine: () => Promise<void>;
    runLiveRoutine: () => Promise<void>;
    pushTranscriptBuffer: () => void;
}

export interface TrainOfThoughtInterface extends TrainOfThoughtData {
    start: () => void;
    getMethods: () => TrainOfThoughtMethods;
}

class TrainOfThought implements TrainOfThoughtInterface {
    liveTranscript: LiveTranscript;
    transcripts: Transcript[] = [];
    transcriptBuffer = "";
    liveInterpolant = 0;
    paragraphInterpolant = 0;
    fromPrompt = "";
    toPrompt = "";
    prompt = "";
    image: string | null = null;
    seed = -1;
    nextTranscriptId = 0;
    interpolationIds: number[] = [];
    onDataChanged: ((data: TrainOfThoughtData) => void) | null = null;

    lastBufferSubmitTime = 0;

    constructor(seed = -1) {
        if (seed !== -1) this.seed = seed;
        else this.seed = new Date().valueOf();

        this.liveTranscript = new LiveTranscript(this.seed);
        this.liveTranscript.onTranscriptReceived = (text: string) => {
            if (this.transcriptBuffer.length > 0) this.transcriptBuffer += " ";
            this.transcriptBuffer += text;
            this.reportChange();

            if (new Date().valueOf() - this.lastBufferSubmitTime > 5000) {
                this.pushTranscriptBuffer();
            }
        };
        this.liveTranscript.onDataChanged = () => this.reportChange();
    }

    public start() {
        if (!this.liveTranscript) return;
        if (this.liveTranscript.status !== "inactive") return;
        this.liveTranscript.start();
    }

    public stop() {
        if (!this.liveTranscript) return;
        if (this.liveTranscript.status !== "running") return;
        this.liveTranscript.stop();
    }

    public getMethods() {
        return {
            start: () => this.start(),
            stop: () => this.stop(),
            manuallySetLiveTranscriptText: (t: string) => this.manuallySetLiveTranscriptText(t),
            manuallyFinishLiveTranscript: () => this.manuallyFinishLiveTranscript(),
            setInterpolants: (l: number, p: number) => this.setInterpolants(l, p),
            setNewInterpolationTarget: () => this.setNewInterpolationTarget(),
            runRoutine: () => this.runRoutine(),
            runLiveRoutine: () => this.liveTranscript.runRoutine(),
            pushTranscriptBuffer: () => this.pushTranscriptBuffer(),
        };
    }

    private manuallySetLiveTranscriptText(text: string) {
        this.liveTranscript.text = text;
        if (this.liveTranscript.onDataChanged)
            this.liveTranscript.onDataChanged(this.liveTranscript.getData());
    }

    private manuallyFinishLiveTranscript() {
        if (this.liveTranscript.onTranscriptReceived)
            this.liveTranscript.onTranscriptReceived(this.liveTranscript.text);
        this.liveTranscript.text = "";
        if (this.liveTranscript.onDataChanged)
            this.liveTranscript.onDataChanged(this.liveTranscript.getData());
    }

    private pushTranscriptBuffer() {
        if (!this.transcriptBuffer) return;
        const newTranscript = new Transcript(++this.nextTranscriptId, this.transcriptBuffer, this.seed);
        newTranscript.onDataChanged = () => this.reportChange();
        this.transcripts.push(newTranscript);
        this.transcriptBuffer = "";
        this.lastBufferSubmitTime = new Date().valueOf();
        this.reportChange();
    }

    private setInterpolants(liveInterpolant: number, paragraphInterpolant: number) {
        const getPrompt = () => {
            if (!this.liveTranscript) return "";
            if (this.transcripts.length === 0) {
                this.fromPrompt = this.liveTranscript.prompt;
                this.toPrompt = this.liveTranscript.prompt;
                return this.liveTranscript.prompt;
            }
            //const liveInterpolator = `, ([${this.liveTranscript.lastWord}:${this.liveTranscript.word}:${liveInterpolant}]:1.1)`;
            const liveInterpolator = "";
            if (this.transcripts.length === 1) {
                this.fromPrompt = this.transcripts[0].prompt;
                this.toPrompt = this.transcripts[0].prompt;
                return `${this.transcripts[0].prompt}${liveInterpolator}`;
            }
            if(this.interpolationIds.length === 0) {
                this.interpolationIds = [0, 1];
            }
            const lastTranscript = this.transcripts[this.interpolationIds[1]];
            const secondLastTranscript = this.transcripts[this.interpolationIds[0]];
            this.fromPrompt = secondLastTranscript.prompt;
            this.toPrompt = lastTranscript.prompt;
            return `${secondLastTranscript.prompt}${liveInterpolator} : ${1 - paragraphInterpolant} AND ${lastTranscript.prompt}${liveInterpolator} : ${paragraphInterpolant}`;
        };
        this.liveInterpolant = liveInterpolant;
        this.paragraphInterpolant = paragraphInterpolant;
        this.prompt = getPrompt();
        if (this.onDataChanged) this.onDataChanged(this.getData());
    }

    private setNewInterpolationTarget() {
        if(this.interpolationIds.length < 2) return;
        this.interpolationIds[0] = this.interpolationIds[1];
        this.interpolationIds[1] = this.transcripts.length - 1;
    }

    private async runRoutine() {
        this.setInterpolants(this.liveInterpolant, this.paragraphInterpolant);
        if(this.prompt === "") return;
        this.image = await PipelineUtils.getTextToImage(this.prompt, this.seed);
        this.reportChange();
    }

    private getData(): TrainOfThoughtData {
        return {
            seed: this.seed,
            image: this.image,
            liveInterpolant: this.liveInterpolant,
            paragraphInterpolant: this.paragraphInterpolant,
            prompt: this.prompt,
            fromPrompt: this.fromPrompt,
            toPrompt: this.toPrompt,
            liveTranscript: this.liveTranscript?.getData() || LiveTranscript.getDefaultData(),
            transcripts: this.transcripts.map(t => t.getData()),
            transcriptBuffer: this.transcriptBuffer,
            interpolationIds: this.interpolationIds,
        };
    }

    private reportChange() {
        if (this.onDataChanged) this.onDataChanged(this.getData());
    }
}

export default TrainOfThought;
