import { useEffect, useState } from "react";
import { FaSync } from "react-icons/fa";
import Button from "components/controls/Button";
import Layout from "components/layout/Layout";
import { TrainOfThoughtData, TrainOfThoughtMethods } from "lib/pipeline/TrainOfThought";
import TextField from "components/controls/TextField";
import SliderField from "components/controls/SliderField";
import Foldout from "components/controls/Foldout";
import useInterval from "lib/hooks/useInterval";
import CheckboxField from "components/controls/CheckboxField";
import ProgressBar from "components/controls/ProgressBar";

const PipelineTest = (): JSX.Element => {
    const [entered, setEntered] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    const [trainOfThought, setTrainOfThought] = useState<TrainOfThoughtData>({
        seed: -1,
        liveInterpolant: 0,
        paragraphInterpolant: 0,
        prompt: "",
        fromPrompt: "",
        toPrompt: "",
        image: "",
        liveTranscript: {
            id: -1,
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
        interpolationIds: [],
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

    // useInterval(() => {
    //     if (!entered) return;
    //     if (!methods) return;
    //     if (trainOfThought.liveTranscript.text.split(" ").length < 5) return;
    //     const doRun = async () => {
    //         await methods.runLiveRoutine();
    //         await methods.runRoutine();
    //     };
    //     doRun();
    // }, 5000);

    const ips = 8; //stable diffusion iterations per second (should be conservative in this estimate)
    const offset = 0.25; //interpolation offset per step
    useInterval(() => {
        if(!entered) return;
        if(!methods) return;
        if(trainOfThought.liveTranscript.status !== "running") return;

        if(trainOfThought.transcripts.length < 2) {
            methods.setInterpolants(0, 0);
            methods.runRoutine();
            return;
        }

        console.log(trainOfThought.interpolationIds, trainOfThought.transcripts.length, trainOfThought.paragraphInterpolant);

        if(trainOfThought.paragraphInterpolant >= 0.95) {
            if(trainOfThought.interpolationIds[1] == trainOfThought.transcripts.length - 1) return;
            trainOfThought.paragraphInterpolant = 0;
            methods.setNewInterpolationTarget();
            methods.setInterpolants(trainOfThought.liveInterpolant, 0);
            methods.runRoutine();
        } else {
            const newValue = Math.round(((trainOfThought.paragraphInterpolant + offset) * 100)) / 100;
            methods.setInterpolants(trainOfThought.liveInterpolant, Math.min(1, newValue));
            methods.runRoutine();
        }
    }, Math.round(1000 * 20 / ips));

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
                        <div className="flex justify-between gap-4 absolute" style={{width: "calc(100vw - 8rem)"}}>
                            <div className="flex gap-4 items-center">
                                <span className={`${trainOfThought.liveTranscript.status === "inactive" ? "text-neutral-500" : trainOfThought.liveTranscript.status === "running" ? "text-red-500" : "text-yellow-500"}`}>Mic: {trainOfThought.liveTranscript?.status || "inactive"}</span>
                                {trainOfThought.liveTranscript.status === "inactive" ? (
                                    <Button
                                        className="bg-green-600 text-xl px-2 py-1 rounded"
                                        onClick={() => methods?.start()}
                                    >
                                        Start Mic
                                    </Button>
                                ): (
                                    <Button
                                        className="bg-red-600 text-xl px-2 py-1 rounded"
                                        onClick={() => methods?.stop()}
                                    >
                                        Stop Mic
                                    </Button>
                                )}
                            </div>
                            <CheckboxField label="Show Debug" value={showDebug} onChange={setShowDebug} />
                        </div>
                        {showDebug && <TextField
                            value={trainOfThought.liveTranscript.text}
                            onChange={t => methods?.manuallySetLiveTranscriptText(t)}
                            label={"Live Debug Value"}
                            className="mt-12"
                        />}
                        <div className="flex gap-4">
                            {showDebug && (
                                <>
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
                                        onClick={() => {
                                            methods?.setNewInterpolationTarget();
                                            methods?.setInterpolants(trainOfThought.liveInterpolant, 0);
                                            methods?.runRoutine();
                                        }}
                                    >
                                        NextTranscript
                                    </Button>
                                </>
                            )}
                        </div>
                        {showDebug && (
                            <>
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
                            </>
                        )}
                    </div>
                    {showDebug ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-2">
                                {/* <TextField label="Seed" value={trainOfThought.seed.toString()} /> */}
                                <TextField label="Prompt" value={trainOfThought.prompt} />
                                {trainOfThought.image ? (
                                    <img
                                        src={`data:image/png;base64,${trainOfThought.image}`}
                                        width={256}
                                        height={256}
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
                                            width={256}
                                            height={256}
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
                                        className={`${trainOfThought.liveTranscript.status === "inactive" ? "text-red-500" : trainOfThought.liveTranscript.status === "running" ? "text-green-500" : "text-yellow-500"}`}
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
                                        <TextField label="ID" value={t.id.toString()} />
                                        <TextField label="Text" value={t.text} />
                                        <TextField label="Prompt" value={t.prompt} />
                                        {t.image ? (
                                            <img
                                                src={`data:image/png;base64,${t.image}`}
                                                width={256}
                                                height={256}
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
                    ) : (
                        <div className="grid place-items-center width-full">
                            <div className="flex gap-2 flex-col items-center">
                                {trainOfThought.image 
                                    ? <img className="" width={900} height={900} src={`data:image/png;base64,${trainOfThought.image}`} />
                                    : trainOfThought.liveTranscript.status === "running" ? <FaSync className="animate-spin text-xl" /> : <div/>
                                }
                                {trainOfThought.image && (
                                    <div className="grid grid-cols-3 place-items-center gap-4">
                                        <span>{trainOfThought.fromPrompt}</span>
                                        <ProgressBar 
                                            color="#AC25A5" 
                                            progress={trainOfThought.paragraphInterpolant} 
                                            containerClassName="w-full text-center h-8 border border-white"
                                            className="w-full h-full grid place-items-center"
                                        >
                                            {Math.round(trainOfThought.paragraphInterpolant * 100)}%
                                        </ProgressBar>
                                        <span>{trainOfThought.toPrompt}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
};

export default PipelineTest;
