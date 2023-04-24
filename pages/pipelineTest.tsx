import { useEffect, useState } from "react";
import { FaSync } from "react-icons/fa";
import Button from "components/controls/Button";
import Layout from "components/layout/Layout";
import { TrainOfThoughtData, TrainOfThoughtMethods } from "lib/pipeline/TrainOfThought";
import TextField from "components/controls/TextField";
import SliderField from "components/controls/SliderField";
import Foldout from "components/controls/Foldout";
import useInterval from "lib/hooks/useInterval";

const PipelineTest = (): JSX.Element => {
    const [entered, setEntered] = useState(false);

    const [trainOfThought, setTrainOfThought] = useState<TrainOfThoughtData>({
        seed: -1,
        liveInterpolant: 0,
        paragraphInterpolant: 0,
        prompt: "",
        image: "",
        liveTranscript: {
            text: "",
            prompt: "",
            image: "",
            status: "inactive",
            summarizedText: "",
            word: "",
            lastWord: "",
        },
        transcripts: [],
        transcriptBuffer: "",
    });
    const [methods, setMethods] = useState<TrainOfThoughtMethods | null>(null);

    useEffect(() => {
        if (!entered) return;
        const setup = async () => {
            const TrainOfThought = (await import("lib/pipeline/TrainOfThought")).default;
            const tot = new TrainOfThought();
            setMethods(tot.getMethods());
            tot.onDataChanged = setTrainOfThought;
        };
        setup();
    }, [entered]);

    useInterval(() => {
        if (!entered) return;
        if (!methods) return;
        if (trainOfThought.liveTranscript.text.split(" ").length < 5) return;
        const doRun = async () => {
            await methods.runLiveRoutine();
            await methods.runRoutine();
        };
        doRun();
    }, 5000);

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
                <div className="py-4 px-16">
                    <div className="flex flex-col gap-4">
                        <TextField
                            value={trainOfThought.liveTranscript.text}
                            onChange={t => methods?.manuallySetLiveTranscriptText(t)}
                            label={"Live Debug Value"}
                        />
                        <div className="flex gap-4">
                            <Button
                                className="bg-primary-600 text-xl px-2 py-1 rounded"
                                onClick={() => methods?.manuallyFinishLiveTranscript()}
                            >
                                Finish
                            </Button>
                            <Button
                                className="bg-primary-600 text-xl px-2 py-1 rounded"
                                onClick={() => methods?.pushTranscriptBuffer()}
                            >
                                SubmitBuffer
                            </Button>
                            <Button
                                className="bg-primary-600 text-xl px-2 py-1 rounded"
                                onClick={() => methods?.runLiveRoutine()}
                            >
                                SubmitLivePrompt
                            </Button>
                            <Button
                                className="bg-primary-600 text-xl px-2 py-1 rounded"
                                onClick={() => methods?.runRoutine()}
                            >
                                SubmitPrompt
                            </Button>
                            <Button
                                className="bg-primary-600 text-xl px-2 py-1 rounded"
                                onClick={() => methods?.start()}
                            >
                                Start Mic
                            </Button>
                            <Button
                                className="bg-primary-600 text-xl px-2 py-1 rounded"
                                onClick={() => methods?.stop()}
                            >
                                Stop Mic
                            </Button>
                        </div>
                        <SliderField
                            label="Live Interpolant"
                            value={trainOfThought.liveInterpolant}
                            onChange={v =>
                                methods?.setInterpolants(
                                    Math.round(v * 100) / 100,
                                    trainOfThought.paragraphInterpolant
                                )
                            }
                            min={0}
                            max={1}
                        />
                        <SliderField
                            label="Live Interpolant"
                            value={trainOfThought.paragraphInterpolant}
                            onChange={v =>
                                methods?.setInterpolants(
                                    trainOfThought.liveInterpolant,
                                    Math.round(v * 100) / 100
                                )
                            }
                            min={0}
                            max={1}
                        />
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            {/* <TextField label="Seed" value={trainOfThought.seed.toString()} /> */}
                            <TextField label="Prompt" value={trainOfThought.prompt} />
                            {trainOfThought.image ? (
                                <img
                                    src={`data:image/png;base64,${trainOfThought.image}`}
                                    width={64}
                                    height={64}
                                />
                            ) : (
                                <div
                                    style={{ width: 64, height: 64 }}
                                    className="grid place-items-center"
                                >
                                    <FaSync className="animate-spin text-xl" />
                                </div>
                            )}
                        </div>
                        <Foldout startsOut={true} label="Live Transcript">
                            <div className="flex gap-4">
                                <TextField
                                    label="Text"
                                    value={trainOfThought.liveTranscript.text}
                                />
                                <TextField
                                    label="Prompt"
                                    value={trainOfThought.liveTranscript.prompt}
                                />
                                {trainOfThought.liveTranscript.image ? (
                                    <img
                                        src={`data:image/png;base64,${trainOfThought.liveTranscript.image}`}
                                        width={64}
                                        height={64}
                                    />
                                ) : (
                                    <div
                                        style={{ width: 64, height: 64 }}
                                        className="grid place-items-center"
                                    >
                                        <FaSync className="animate-spin text-xl" />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <TextField
                                    label="Status"
                                    value={trainOfThought.liveTranscript.status}
                                />
                                <TextField
                                    label="Summarized Text"
                                    value={trainOfThought.liveTranscript.summarizedText}
                                />
                                <TextField
                                    label="Word"
                                    value={trainOfThought.liveTranscript.word}
                                />
                                <TextField
                                    label="Last Word"
                                    value={trainOfThought.liveTranscript.lastWord}
                                />
                            </div>
                        </Foldout>
                        <TextField
                            label="Transcript Buffer"
                            value={trainOfThought.transcriptBuffer}
                        />
                        <Foldout startsOut={true} label="Transcripts">
                            {trainOfThought.transcripts.map((t, i) => (
                                <div key={i} className="flex gap-4">
                                    <TextField label="Text" value={t.text} />
                                    <TextField label="Prompt" value={t.prompt} />
                                    {t.image ? (
                                        <img
                                            src={`data:image/png;base64,${t.image}`}
                                            width={64}
                                            height={64}
                                        />
                                    ) : (
                                        <div
                                            style={{ width: 64, height: 64 }}
                                            className="grid place-items-center"
                                        >
                                            <FaSync className="animate-spin text-xl" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </Foldout>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default PipelineTest;
