import { useEffect, useState } from "react";
import Button from "components/controls/Button";
import Layout from "components/layout/Layout";
import AudioRecorderDual from "components/layout/audio/AudioRecorderDual";
import StableDiffusionFetcher from "components/ai/StableDiffusionFetcher";
import Foldout from "components/controls/Foldout";
import useInterval from "lib/hooks/useInterval";
import TranscriptionSummarizer from "components/ai/TranscriptionSummarizer";

const HomePage = (): JSX.Element => {
    const [transcription, setTranscription] = useState("");
    const [summaries, setSummaries] = useState<{
        overallSummary: string;
        paragraphSummaries: string[];
    }>({ overallSummary: "", paragraphSummaries: ["", "", ""] });
    const [entered, setEntered] = useState(false);
    const [lastImagesSize /*, setLastImagesSize*/] = useState(3);
    const [, setLastPrompts] = useState<string[]>(["", "", ""]);
    const [seed, setSeed] = useState(-1);

    const [lastSummary, setLastSummary] = useState("");
    const [curSummary, setCurSummary] = useState("");
    const [summaryInterpolant, setSummaryInterpolant] = useState(0);
    const [waiting, setWaiting] = useState(true);

    const [summaryInterval] = useState(10);
    const [interpolationInterval] = useState(2);
    const [mainImageMode] = useState<"overall" | "last-paragraph">("last-paragraph");

    useEffect(() => {
        setSeed(new Date().valueOf());
    }, []);

    useEffect(() => {
        const newLastPrompts: string[] = [];
        for (let i = 0; i < lastImagesSize; i++) {
            const index = summaries.paragraphSummaries.length - 1 - i;
            if (index < 0) newLastPrompts.push("");
            else newLastPrompts.push(summaries.paragraphSummaries[index]);
        }
        newLastPrompts.reverse();
        setLastPrompts(newLastPrompts);
    }, [summaries, lastImagesSize]);

    useInterval(() => {
        let sourceText = "";
        switch (mainImageMode) {
            case "overall":
                sourceText = summaries.overallSummary;
                break;
            case "last-paragraph":
                sourceText = ["", ...summaries.paragraphSummaries.filter(s => s !== "")].slice(
                    -1
                )[0];
                break;
        }
        if (sourceText === "") {
            if (transcription !== "") {
                setLastSummary(transcription);
                setCurSummary(transcription);
            }
            return;
        } else if (curSummary === "") {
            setLastSummary(sourceText);
            setCurSummary(sourceText);
            return;
        }

        if (waiting) return;

        const newInterpolant = summaryInterpolant + interpolationInterval;
        if (newInterpolant >= 10) {
            setLastSummary(curSummary);
            setCurSummary(sourceText);
            setSummaryInterpolant(0);
            setWaiting(true);
        } else {
            setSummaryInterpolant(newInterpolant);
        }
    }, 1000 * interpolationInterval);

    const buildInterpolationPrompt = (a: string, b: string, interpolant: number) => {
        return (
            a +
            " :" +
            (1 - interpolant / 10).toFixed(1) +
            " AND " +
            b +
            " :" +
            (interpolant / 10).toFixed(1)
        );
    };

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
                // <AudioRecorder onUploadSuccess={function (data: RecordingData): void {
                //     console.log("Got recording data", data);
                // } } />
                <div className="flex flex-col gap-4">
                    <AudioRecorderDual
                        duration={5}
                        overlap={1}
                        onTranscriptionChange={setTranscription}
                    />
                    <TranscriptionSummarizer
                        transcription={transcription}
                        summaryInterval={summaryInterval}
                        onSummaryChange={s => {
                            setSummaries(s);
                            setWaiting(false);
                        }}
                    />
                    <div className="absolute bottom-0 left-0 pb-4 pl-4">
                        <Foldout label="View Transcription" startsOut={false}>
                            <div>
                                <h1>Transcription:</h1>
                                <p>{transcription}</p>
                            </div>
                            <ul className="ml-4 pl-4 list-disc">
                                <li>Overall Summary: {summaries.overallSummary}</li>
                                {summaries.paragraphSummaries.map((summary, i) => (
                                    <li key={i}>{summary}</li>
                                ))}
                            </ul>
                        </Foldout>
                    </div>
                    {summaries.overallSummary && (
                        <>
                            <div className="flex h-screen w-screen justify-center gap-4">
                                <div className="flex flex-col justify-center w-[55%]">
                                    <StableDiffusionFetcher
                                        prompt={buildInterpolationPrompt(
                                            lastSummary,
                                            curSummary,
                                            summaryInterpolant
                                        )}
                                        seed={seed}
                                        size={2048}
                                    />
                                </div>
                                {/*                             
                            <div className="flex flex-col justify-center w-[18.35%]">
                                {lastPrompts[2] === "" ? (
                                    <div className="grid place-items-center border border-white border-opacity-20 rounded" style={{height: 512}}>...</div>
                                ) : (
                                    <StableDiffusionFetcher prompt={lastPrompts[2]} seed={seed} size={512} />
                                )}
                                {lastPrompts[1] === "" ? (
                                    <div className="grid place-items-center border border-white border-opacity-20 rounded" style={{height: 512}}>...</div>
                                ) : (
                                    <StableDiffusionFetcher prompt={lastPrompts[1]} seed={seed} size={512} />
                                )}
                                {lastPrompts[0] === "" ? (
                                    <div className="grid place-items-center border border-white border-opacity-20 rounded" style={{height: 512}}>...</div>
                                ) : (
                                    <StableDiffusionFetcher prompt={lastPrompts[0]} seed={seed} size={512} />
                                )}
                            </div> */}
                            </div>
                        </>
                    )}
                </div>
            )}
        </Layout>
    );
};

export default HomePage;

/*
//Leaving this here so that I don't have to keep looking up the syntax...
import { GetServerSidePropsContext } from "next/types";
export async function getServerSideProps(ctx: GetServerSidePropsContext): Promise<{ props: any }> {
    return {
        props: {  },
    };
}
*/
