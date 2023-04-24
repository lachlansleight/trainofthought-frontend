import axios from "axios";
import { getCompletion } from "lib/openAi";
import SymblTranscriber, { TranscriberState } from "lib/symblTranscriber";

const doKeywordReduction = async (rawText: string): Promise<string> => {
    const summaryCompletion = await getCompletion(
        "text-curie-001",
        `
Sentence: The gently flowing river...bunched and 'heaved' around very beautiful bends.
Key Words: gently flowing, river, bunched, heaved, around, very beautiful, bends

Sentence: ${rawText}
Key Words:`,
        {
            top_p: 1,
            temperature: 0.7,
        }
    );
    return summaryCompletion.choices[0].text;
};

export interface TranscriptData {
    text: string;
    prompt: string;
    image: string;
}

export interface LiveTranscriptData extends TranscriptData {
    status: TranscriberState;
    summarizedText: string;
    word: string;
    lastWord: string;
}

export interface TrainOfThoughtData {
    seed: number;
    liveInterpolant: number;
    paragraphInterpolant: number;
    prompt: string;
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
    prompt = "";
    image: string | null = null;
    seed = -1;
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
        const newTranscript = new Transcript(this.transcriptBuffer, this.seed);
        newTranscript.onDataChanged = () => this.reportChange();
        this.transcripts.push(newTranscript);
        this.transcriptBuffer = "";
        this.lastBufferSubmitTime = new Date().valueOf();
        this.reportChange();
    }

    private setInterpolants(liveInterpolant: number, paragraphInterpolant: number) {
        const getPrompt = () => {
            if (!this.liveTranscript) return "";
            if (this.transcripts.length === 0) return this.liveTranscript.prompt;
            const liveInterpolator = `([${this.liveTranscript.lastWord}:${this.liveTranscript.word}:${liveInterpolant}]:1.1)`;
            if (this.transcripts.length === 1) {
                return `${this.transcripts[0].prompt}, ${liveInterpolator}`;
            }
            const lastTranscript = this.transcripts[this.transcripts.length - 1];
            const secondLastTranscript = this.transcripts[this.transcripts.length - 2];
            return `${secondLastTranscript.prompt}, ${liveInterpolator} AND ${lastTranscript.prompt}, ${liveInterpolator} :${paragraphInterpolant}`;
        };
        this.liveInterpolant = liveInterpolant;
        this.paragraphInterpolant = paragraphInterpolant;
        this.prompt = getPrompt();
        if (this.onDataChanged) this.onDataChanged(this.getData());
    }

    private async runRoutine() {
        this.setInterpolants(this.liveInterpolant, this.paragraphInterpolant);

        const res = await axios.post(
            `${process.env.NEXT_PUBLIC_STABLE_DIFFUSION_URL}/sdapi/v1/txt2img`,
            {
                prompt: this.prompt,
                steps: 20,
                width: 512,
                height: 512,
                seed: this.seed,
            }
        );
        this.image = res.data.images[0];
        this.reportChange();
    }

    private getData(): TrainOfThoughtData {
        return {
            seed: this.seed,
            image: this.image,
            liveInterpolant: this.liveInterpolant,
            paragraphInterpolant: this.paragraphInterpolant,
            prompt: this.prompt,
            liveTranscript: this.liveTranscript?.getData() || {
                status: "inactive",
                text: "",
                summarizedText: "",
                word: "",
                lastWord: "",
                prompt: "",
                image: "",
            },
            transcripts: this.transcripts.map(t => t.getData()),
            transcriptBuffer: this.transcriptBuffer,
        };
    }

    private reportChange() {
        if (this.onDataChanged) this.onDataChanged(this.getData());
    }
}

class LiveTranscript implements LiveTranscriptData {
    status: TranscriberState = "inactive";
    seed = -1;
    text = "";
    summarizedText = "";
    word = "abstract";
    lastWord = "abstract";
    prompt = "";
    image = "";

    transcriber: SymblTranscriber | null = null;

    onTranscriptReceived: ((text: string) => void) | null = null;
    onDataChanged: ((data: LiveTranscriptData) => void) | null = null;

    constructor(seed = -1) {
        this.transcriber = new SymblTranscriber();
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

        this.prompt = await doKeywordReduction(this.summarizedText);
        if (this.onDataChanged) this.onDataChanged(this.getData());

        this.lastWord = this.word;
        this.word = this.prompt.split(",")[0].trim();
        if (this.onDataChanged) this.onDataChanged(this.getData());

        //get image from stable diffusion
        const res = await axios.post(
            `${process.env.NEXT_PUBLIC_STABLE_DIFFUSION_URL}/sdapi/v1/txt2img`,
            {
                prompt: this.prompt,
                steps: 20,
                width: 512,
                height: 512,
                seed: this.seed,
            }
        );
        this.image = res.data.images[0];
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
}

class Transcript implements TranscriptData {
    seed = -1;
    text = "";
    prompt = "";
    image = "";

    onDataChanged: ((data: TranscriptData) => void) | null = null;

    constructor(text: string, seed = -1) {
        this.text = text;
        this.seed = seed;

        this.runRoutine();
    }

    async runRoutine() {
        if (!this.text) return;

        this.prompt = await doKeywordReduction(this.text);
        if (this.onDataChanged) this.onDataChanged(this.getData());

        //get image from stable diffusion
        const res = await axios.post(
            `${process.env.NEXT_PUBLIC_STABLE_DIFFUSION_URL}/sdapi/v1/txt2img`,
            {
                prompt: this.prompt,
                steps: 20,
                width: 512,
                height: 512,
                seed: this.seed,
            }
        );
        this.image = res.data.images[0];
        if (this.onDataChanged) this.onDataChanged(this.getData());
    }

    getData() {
        return {
            seed: this.seed,
            text: this.text,
            prompt: this.prompt,
            image: this.image,
        };
    }
}

export default TrainOfThought;
