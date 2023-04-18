import { useEffect, useState } from "react";
import DualUploader from "lib/dualUploader";

const AudioRecorderDual = ({
    duration,
    overlap,
    onTranscriptionChange,
}: {
    duration: number;
    overlap: number;
    onTranscriptionChange: (text: string) => void;
}): JSX.Element => {
    const [recorder, setRecorder] = useState<DualUploader | null>(null);
    const [transcriptions, setTranscriptions] = useState<string[]>([]);
    const [fullTranscription, setFullTranscription] = useState("");
    const [, setA] = useState<any>(null);
    const [, setB] = useState<any>(null);

    useEffect(() => {
        const setupRecorder = async () => {
            const ctx = new (window["AudioContext"] || window["webkitAudioContext" as any])();
            const devices = await navigator.mediaDevices.enumerateDevices();
            console.log(devices);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setRecorder(
                new DualUploader(
                    ctx,
                    stream,
                    text => setTranscriptions(cur => [...cur, text]),
                    duration,
                    overlap,
                    s => setA(s),
                    s => setB(s)
                )
            );
        };
        setupRecorder();
    }, []);

    useEffect(() => {
        if (transcriptions.length === 0) {
            return;
        }
        if (transcriptions.length === 1) {
            setFullTranscription(transcriptions[0]);
            return;
        }

        const curTranscription = transcriptions.slice(-1)[0];
        const curTranscriptionWords = curTranscription.split(" ");

        const lastTranscription = transcriptions.slice(-2)[0];
        const lastTranscriptionWords = lastTranscription.split(" ");

        let wordsToTrim = 0;
        for (
            let i = 0;
            i < Math.min(lastTranscriptionWords.length, curTranscriptionWords.length);
            i++
        ) {
            if (
                lastTranscriptionWords[lastTranscriptionWords.length - 1 - i] ===
                curTranscriptionWords[i]
            ) {
                wordsToTrim++;
            }
        }
        console.log("trimming " + wordsToTrim + " words");
        if (wordsToTrim > 0) curTranscriptionWords.splice(0, wordsToTrim);
        setFullTranscription(cur => cur + " " + curTranscriptionWords.join(" "));
    }, [transcriptions]);

    useEffect(() => {
        if (!fullTranscription) return;
        onTranscriptionChange(fullTranscription);
    }, [fullTranscription, onTranscriptionChange]);

    useEffect(() => {
        if (!recorder) return;
        recorder.start();
        return () => {
            if (recorder) recorder.stop();
        };
    }, [recorder]);

    return <></>;
};

export default AudioRecorderDual;
