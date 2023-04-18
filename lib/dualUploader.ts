import audioBufferToWav from "audiobuffer-to-wav";
import { getSpeechToText } from "./openAi";

export type DualUploaderState = {
    recorder: "inactive" | "recording";
    nextChange: number;
};

class DualUploader {
    ctx: AudioContext | null = null;

    recorderA: MediaRecorder | null = null;
    recorderB: MediaRecorder | null = null;

    segmentDuration = 5;
    segmentOverlap = 1;

    state: "uninitialized" | "inactive" | "starting" | "recording" = "uninitialized";
    timeoutA: NodeJS.Timeout | null = null;
    timeoutB: NodeJS.Timeout | null = null;

    onReceiveTranscription: (text: string) => void;
    onStateChangeA: ((state: DualUploaderState) => void) | null;
    onStateChangeB: ((state: DualUploaderState) => void) | null;
    lastTranscription = "";

    constructor(
        ctx: AudioContext,
        stream: MediaStream,
        callback: (text: string) => void,
        segmentDuration = 5,
        segmentOverlap = 0.2,
        stateCallbackA: ((state: DualUploaderState) => void) | null = null,
        stateCallbackB: ((state: DualUploaderState) => void) | null = null
    ) {
        this.segmentDuration = segmentDuration;
        this.segmentOverlap = Math.max(0, Math.min(segmentOverlap, segmentDuration / 2));
        if (segmentOverlap < 0 || segmentOverlap > segmentDuration / 2) {
            console.warn(
                "Segment overlap must be between zero and half the segment duration - its value has been clamped"
            );
        }

        this.ctx = ctx;
        this.recorderA = new MediaRecorder(stream);
        this.recorderB = new MediaRecorder(stream);

        this.recorderA.ondataavailable = e => {
            this.doUpload([e.data]);
            this.timeoutA = setTimeout(() => {
                this.recorderA?.start();
                this.timeoutA = setTimeout(
                    () => this.recorderA?.stop(),
                    this.segmentDuration * 1000
                );
                if (this.onStateChangeA)
                    this.onStateChangeA({
                        recorder: "recording",
                        nextChange: new Date().valueOf() + this.segmentDuration * 1000,
                    });
            }, (this.segmentDuration - this.segmentOverlap * 2) * 1000);
            if (this.onStateChangeA)
                this.onStateChangeA({
                    recorder: "inactive",
                    nextChange:
                        new Date().valueOf() +
                        (this.segmentDuration - this.segmentOverlap * 2) * 1000,
                });
        };

        this.recorderB.ondataavailable = e => {
            this.doUpload([e.data]);
            this.timeoutB = setTimeout(() => {
                this.recorderB?.start();
                this.timeoutB = setTimeout(
                    () => this.recorderB?.stop(),
                    this.segmentDuration * 1000
                );
                if (this.onStateChangeB)
                    this.onStateChangeB({
                        recorder: "recording",
                        nextChange: new Date().valueOf() + this.segmentDuration * 1000,
                    });
            }, (this.segmentDuration - this.segmentOverlap * 2) * 1000);
            if (this.onStateChangeB)
                this.onStateChangeB({
                    recorder: "inactive",
                    nextChange:
                        new Date().valueOf() +
                        (this.segmentDuration - this.segmentOverlap * 2) * 1000,
                });
        };

        this.state = "inactive";

        this.onReceiveTranscription = callback;
        this.onStateChangeA = stateCallbackA;
        this.onStateChangeB = stateCallbackB;

        if (this.onStateChangeA)
            this.onStateChangeA({ recorder: "inactive", nextChange: new Date().valueOf() });
        if (this.onStateChangeB)
            this.onStateChangeB({ recorder: "inactive", nextChange: new Date().valueOf() });
    }

    start() {
        if (!this.recorderA || !this.recorderB) throw new Error("Recorders not initialized!");

        this.state = "starting";

        this.recorderA.start();
        this.timeoutA = setTimeout(() => this.recorderA?.stop(), this.segmentDuration * 1000);
        if (this.onStateChangeA)
            this.onStateChangeA({
                recorder: "recording",
                nextChange: new Date().valueOf() + this.segmentDuration * 1000,
            });

        this.timeoutB = setTimeout(() => {
            this.recorderB?.start();
            this.timeoutB = setTimeout(() => this.recorderB?.stop(), this.segmentDuration * 1000);
            if (this.onStateChangeB)
                this.onStateChangeB({
                    recorder: "recording",
                    nextChange: new Date().valueOf() + this.segmentDuration * 1000,
                });

            this.state = "recording";
        }, (this.segmentDuration - this.segmentOverlap) * 1000);
    }

    stop() {
        if (this.timeoutA) clearTimeout(this.timeoutA);
        if (this.timeoutB) clearTimeout(this.timeoutB);
        this.state = "inactive";
        this.recorderA?.stop();
        this.recorderB?.stop();
    }

    // private pushA(uploader: DualUploader) {
    //     uploader.recorderA?.requestData();
    //     console.log(uploader.chunksA.length);
    //     this.doUpload(uploader.chunksA);
    //     uploader.recorderA?.stop();
    //     uploader.chunksA = [];
    //     uploader.recorderA?.start();
    // }

    // private pushB(uploader: DualUploader) {
    //     console.log(uploader.chunksB.length);
    //     this.doUpload(uploader.chunksB);
    //     uploader.recorderB?.stop();
    //     uploader.chunksB = [];
    //     uploader.recorderB?.start();
    // }

    private async decodeAudioDataAsync(buffer: ArrayBuffer): Promise<AudioBuffer> {
        return new Promise((resolve, reject) => {
            this.ctx?.decodeAudioData(buffer, resolve, reject);
        });
    }

    private async doUpload(chunks: Blob[]) {
        if (this.state !== "recording") return;

        const rawBuffer = await new Blob(chunks).arrayBuffer();
        const audioBuffer = await this.decodeAudioDataAsync(rawBuffer);
        const wavBuffer = audioBufferToWav(audioBuffer);
        const file = new File([new Blob([wavBuffer], { type: "audio/wav" })], "recording.wav");
        const speechToText = await getSpeechToText(file, this.lastTranscription);
        this.onReceiveTranscription(speechToText.text);
        const words = speechToText.text.split(" ");
        if (words.length < 3) this.lastTranscription = "";
        else this.lastTranscription = words.slice(1, -1).join(" ");
    }
}

export default DualUploader;
