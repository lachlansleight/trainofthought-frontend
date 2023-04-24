import { Deepgram } from "@deepgram/sdk/browser";

class DeepgramTranscriber {
    recorder: MediaRecorder | null = null;

    constructor(stream: MediaStream) {
        //const sampleRate = stream.getAudioTracks()[0].getSettings().sampleRate;
        this.recorder = new MediaRecorder(stream, {
            mimeType: "audio/webm",
        });

        const deepgram = new Deepgram(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || "");

        const deepgramSocket = deepgram.transcription.live({
            punctuate: true,
        });

        deepgramSocket.addEventListener("open", () => {
            this.recorder?.addEventListener("dataavailable", async event => {
                if (event.data.size > 0 && deepgramSocket.readyState == 1) {
                    deepgramSocket.send(event.data);
                }
            });
            this.recorder?.start(1000);
        });
        deepgramSocket.addEventListener("message", (message: any) => {
            const received = JSON.parse(message.data);
            const transcript = received.channel.alternatives[0].transcript;
            if (transcript && received.is_final) {
                console.log(transcript);
            }
        });
    }

    start() {
        console.log("!");
    }

    stop() {
        console.log("!");
    }
}

export default DeepgramTranscriber;

// import socketIOClient, { Socket } from "socket.io-client";

// class DeepgramTranscriber {
//     recorder: MediaRecorder | null = null;
//     socket: Socket | null = null;

//     constructor(stream: MediaStream) {
//         const sampleRate = stream.getAudioTracks()[0].getSettings().sampleRate;
//         this.recorder = new MediaRecorder(stream);
//         this.socket = socketIOClient(process.env.NEXT_PUBLIC_TRANSCRIPTION_URL || "", {
//             query: {
//                 sampleRate
//             }
//         });
//     }

//     start() {
//         if(!this.socket) throw new Error("Socket is null");
//         if(!this.recorder) throw new Error("Recorder is null");

//         this.recorder?.addEventListener("dataavailable", e => {
//             if(e.data.size <= 0 || !this.socket?.connected) return;
//             this.socket?.emit("audio", e.data);
//         });

//         console.log("Starting deepgram transcription");
//         this.recorder.start(250);

//         this.socket.on("transcription", message => {
//             const data = JSON.parse(message.data);
//             console.log(data);
//         });
//     }

//     stop() {
//         if(!this.socket) throw new Error("Socket is null");
//         if(!this.recorder) throw new Error("Recorder is null");

//         this.socket.disconnect();
//         this.recorder.stop();
//     }
// }
