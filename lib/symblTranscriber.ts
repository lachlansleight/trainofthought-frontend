import { StreamingAPIConnection, Symbl } from "@symblai/symbl-web-sdk";

export type TranscriberState = "inactive" | "starting" | "running" | "stopping";
export interface TranscriberInterface {
    state: TranscriberState;
    start(): void;
    stop(): void;
    addInterimListener(onInterimReceived: (transcript: string) => void): void;
    addTranscriptListener(onTranscriptReceived: (transcript: string) => void): void;
    addStateChangeListener(onStateChange: (state: TranscriberState) => void): void;
}

class SymblTranscriber {
    symbl: Symbl | null = null;
    connection: StreamingAPIConnection | null = null;

    state: TranscriberState = "inactive";

    onInterimReceived: ((data: string) => void) | null = null;
    onTranscriptReceived: ((data: string) => void) | null = null;
    onStateChange: ((state: TranscriberState) => void) | null = null;

    constructor() {
        this.symbl = new Symbl({
            appId: process.env.NEXT_PUBLIC_SYMBL_APP_ID || "",
            appSecret: process.env.NEXT_PUBLIC_SYMBL_APP_SECRET || "",
        });
    }

    start() {
        if (this.state !== "inactive") return;
        this.startAsync();
    }

    stop() {
        if (this.state !== "running") return;
        this.stopAsync();
    }

    addInterimListener(onInterimReceived: (data: string) => void) {
        this.onInterimReceived = onInterimReceived;
    }

    addTranscriptListener(onTranscriptReceived: (data: string) => void) {
        this.onTranscriptReceived = onTranscriptReceived;
    }

    addStateChangeListener(onStateChange: (state: TranscriberState) => void) {
        this.onStateChange = onStateChange;
    }

    private async startAsync() {
        if (!this.symbl) return;

        this.setState("starting");
        this.connection = await this.symbl.createAndStartNewConnection();

        // Retrieve real-time transcription from the conversation.
        this.connection.on("speech_recognition", data => {
            if (this.onInterimReceived) this.onInterimReceived(data.punctuated.transcript);
        });
        this.connection.on("message", data => {
            console.log(data);
            const fullMessage = data.map((m: any) => m.payload.content).join(" ");
            if (this.onTranscriptReceived) this.onTranscriptReceived(fullMessage);
        });

        this.setState("running");
    }

    private async stopAsync() {
        if (!this.connection) return;

        this.setState("stopping");

        await this.connection.stopProcessing();
        this.connection.disconnect();
        this.connection = null;

        this.setState("inactive");
    }

    private setState(state: TranscriberState) {
        this.state = state;
        if (this.onStateChange) this.onStateChange(this.state);
    }
}

export default SymblTranscriber;
