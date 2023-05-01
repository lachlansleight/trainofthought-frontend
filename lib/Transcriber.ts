export type TranscriberState = "inactive" | "starting" | "running" | "stopping";
export interface TranscriberInterface {
    state: TranscriberState;
    start(): void;
    stop(): void;
    addInterimListener(onInterimReceived: (transcript: string) => void): void;
    addTranscriptListener(onTranscriptReceived: (transcript: string) => void): void;
    addStateChangeListener(onStateChange: (state: TranscriberState) => void): void;
}