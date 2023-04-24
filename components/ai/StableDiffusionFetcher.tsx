import axios from "axios";
import { useEffect, useState } from "react";

const StableDiffusionFetcher = ({
    className = "",
    size = 512,
    prompt,
    seed,
    onImgChange,
}: {
    className?: string;
    size?: number;
    prompt: string;
    seed: number;
    onImgChange?: (imgData: string) => void;
}): JSX.Element => {
    const [fetchedPrompt, setFetchedPrompt] = useState("");
    const [img, setImg] = useState("");
    useEffect(() => {
        if (!prompt) return;
        if (prompt === fetchedPrompt) return;

        //return;

        const doFetch = async () => {
            console.log("Fetching prompt: ", prompt);
            setFetchedPrompt(prompt);
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_STABLE_DIFFUSION_URL}/sdapi/v1/txt2img`,
                {
                    prompt: prompt,
                    steps: 20,
                    width: 512,
                    height: 512,
                    seed,
                }
            );
            setImg(res.data.images[0]);
            if (onImgChange) onImgChange(res.data.images[0]);
        };

        doFetch();
    }, [prompt, fetchedPrompt, seed]);

    if (!prompt)
        return (
            <div
                className="grid place-items-center border border-white border-opacity-20 rounded"
                style={{ height: size }}
            >
                ...
            </div>
        );
    else if (!img)
        return (
            <div
                className="grid place-items-center border border-white border-opacity-20 rounded"
                style={{ height: size }}
            >
                {prompt}
            </div>
        );

    return (
        <div className="flex flex-col relative" title={prompt}>
            <img
                src={`data:image/png;base64, ${img}`}
                width={size}
                height={size}
                className={className}
            />
            {/* <span className="absolute w-full left-0 bottom-0 flex text-center font-bold" style={{textShadow: "2px 2px black"}}>{prompt}</span> */}
        </div>
    );
};

export default StableDiffusionFetcher;
