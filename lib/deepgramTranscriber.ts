import socketIOClient, { Socket } from "socket.io-client";
import { TranscriberInterface, TranscriberState } from "./Transcriber";

class DeepgramTranscriber implements TranscriberInterface {
    recorder: MediaRecorder | null = null;
    socket: Socket | null = null;
    
    state: TranscriberState = "inactive";

    onInterimReceived: ((data: string) => void) | null = null;
    onTranscriptReceived: ((data: string) => void) | null = null;
    onStateChange: ((state: TranscriberState) => void) | null = null;

    constructor() {
        this.setState("inactive");
        this.recorder = null;
        this.socket = null;
    }

    start() {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
            const sampleRate = stream.getAudioTracks()[0].getSettings().sampleRate;
            this.recorder = new MediaRecorder(stream);
            this.socket = socketIOClient(process.env.NEXT_PUBLIC_TRANSCRIPTION_URL || "", {
                query: {
                    sampleRate
                }
            });

            if(!this.socket) throw new Error("Socket is null");
            if(!this.recorder) throw new Error("Recorder is null");
            this.setState("starting");

            this.socket.on("ready", () => {
                this.recorder?.start(250);
                this.setState("running");
            })

            this.recorder?.addEventListener("dataavailable", e => {
                if(e.data.size <= 0 || !this.socket?.connected) return;
                this.socket?.emit("audio", e.data);
            });

            this.socket.on("transcription", (data: {
                duration: number;
                start: number;
                isFinal: boolean;
                speechFinal: boolean;
                text: string;
                confidence: number;
                words: {
                    word: string;
                    start: number;
                    end: number;
                    confidence: number;
                    punctuated_word: string;
                }[];
            }) => {
                if(data.text === "") return;
                if(data.isFinal) {
                    if(this.onTranscriptReceived) this.onTranscriptReceived(data.text);
                } else {
                    if(this.onInterimReceived) this.onInterimReceived(data.text);
                }
            });
        });
    }

    stop() {
        if(!this.socket) throw new Error("Socket is null");
        if(!this.recorder) throw new Error("Recorder is null");

        this.setState("stopping");

        this.socket.disconnect();
        this.recorder.stop();

        this.setState("inactive");
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

    private setState(state: TranscriberState) {
        this.state = state;
        if (this.onStateChange) this.onStateChange(this.state);
    }
}

export default DeepgramTranscriber