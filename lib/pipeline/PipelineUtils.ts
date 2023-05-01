import axios from "axios";
import { getCompletion } from "lib/openAi";

class PipelineUtils {
    static async doKeywordReduction(rawText: string): Promise<string> {
        const summaryCompletion = await getCompletion(
            "text-curie-001",
            `
    Sentence: The gently flowing river...bunched and 'heaved' around very beautiful bends.
    Key Words: gently flowing, river, bunched, heaved, around, very beautiful, bends
    
    Sentence: ${rawText}
    Key Words:`,
            {
                top_p: 1,
                temperature: 0.7,
            }
        );
        return summaryCompletion.choices[0].text;
    }

    static async getTextToImage(prompt: string, seed = -1): Promise<string> {
        const res = await axios.post(
            `${process.env.NEXT_PUBLIC_STABLE_DIFFUSION_URL}/sdapi/v1/txt2img`,
            {
                prompt: prompt,
                steps: 20,
                width: 512,
                height: 512,
                seed: seed,
            }
        );
        return res.data.images[0];

    }
}

export default PipelineUtils;