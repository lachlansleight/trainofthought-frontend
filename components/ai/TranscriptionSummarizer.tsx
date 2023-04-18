import { useCallback, useEffect, useState } from "react";
import useInterval from "lib/hooks/useInterval";
import { getChatCompletion } from "lib/openAi";

export type SummaryData = { overallSummary: string; paragraphSummaries: string[] };

const TranscriptionSummarizer = ({
    transcription,
    summaryInterval,
    onSummaryChange,
}: {
    transcription: string;
    summaryInterval: number;
    onSummaryChange: (newData: SummaryData) => void;
}): JSX.Element => {
    const [first, setFirst] = useState(true);

    const runPrompt = useCallback(
        (tr: string) => {
            const doPrompt = async () => {
                console.log("Getting summaries...");
                const response = await getChatCompletion(
                    "gpt-4",
                    [
                        { role: "system", content: "You are a helpful assistant" },
                        { role: "user", content: prompt },
                    ],
                    { max_tokens: 1024 }
                );
                const data = JSON.parse(response.choices[0].message.content);
                while (data.paragraphSummaries.length < 3) data.paragraphSummaries.push("");
                onSummaryChange(data);
                console.log("Got summaries");
            };

            if (!tr) return;

            const prompt = `Please perform operations on the following transcribed text to produce a JSON object with the following format:
{ "overallSummary": "", "paragraphSummaries": [] }
overallSummary should be a single-sentence summary of the entire text. The paragraph summaries array should be generated by first separating the text into sensible paragraphs, and then producing one-sentence summaries of each paragraph. All summaries should be written from a first-person perspective.
Respond only in JSON.

"${tr}"`;

            doPrompt();
        },
        [onSummaryChange]
    );

    useInterval(() => {
        runPrompt(transcription);
    }, summaryInterval * 1000);

    useEffect(() => {
        if (transcription && first) {
            runPrompt(transcription);
            setFirst(false);
        }
    }, [first, transcription, runPrompt]);

    return <></>;
};

export default TranscriptionSummarizer;