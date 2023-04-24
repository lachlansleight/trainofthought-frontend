import { useEffect, useState } from "react";
import Button from "components/controls/Button";
import Layout from "components/layout/Layout";
import { TranscriberInterface, TranscriberState } from "lib/symblTranscriber";

const transcribeTest = (): JSX.Element => {
    const [entered, setEntered] = useState(false);
    const [transcriber, setTranscriber] = useState<TranscriberInterface | null>(null);
    const [interim, setInterim] = useState<string>("");
    const [transcripts, setTranscripts] = useState<string[]>([]);
    const [transcriberState, setTranscriberState] = useState<TranscriberState>("inactive");

    useEffect(() => {
        if (!entered) return;

        const setup = async () => {
            const devices = await navigator.mediaDevices.enumerateDevices();
            console.log(devices);
            const SymblTranscriber = (await import("lib/symblTranscriber")).default;
            setTranscriber(new SymblTranscriber());
        };
        setup();
    }, [entered]);

    useEffect(() => {
        if (!transcriber) return;
        transcriber.addInterimListener(setInterim);
        transcriber.addStateChangeListener(setTranscriberState);
        transcriber.addTranscriptListener(t => setTranscripts(cur => [...cur, t]));
        transcriber.start();
    }, [transcriber]);

    return (
        <Layout>
            {!entered ? (
                <div className="grid w-full h-screen place-items-center">
                    <div className="flex flex-col gap-4">
                        <h1 className="text-6xl text-white text-opacity-30">Train of Thought</h1>
                        <Button
                            className="px-4 pt-2 pb-3 border border-white border-opacity-100 hover:border-opacity-50 rounded-lg text-3xl"
                            onClick={() => setEntered(true)}
                        >
                            Begin
                        </Button>
                    </div>
                </div>
            ) : (
                <div>
                    {transcriberState === "running" ? (
                        <>
                            <p className="text-xl">{interim}</p>
                            <div className="flex flex-col gap-2">
                                {transcripts.map((t, i) => (
                                    <p key={i}>{t}</p>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p>Transcriber State: {transcriberState}</p>
                    )}
                </div>
            )}
        </Layout>
    );
};

export default transcribeTest;
