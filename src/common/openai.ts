import OpenAI from 'openai';

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export const getEmbedding = async (text: string): Promise<number[]> => {
    try {
        const response = await openai.embeddings.create({
            input: text,
            model: process.env.TEXT_EMBEDDING_MODEL,
        });

        return response.data[0].embedding;
    } catch (e: unknown) {
        if (e instanceof Error) {
            throw Error(`error fetching embedding for message "${text}" with error: ${e.message}`);
        } else {
            throw Error(`error fetching embedding for message "${text}" with unknown error`);
        }
    }
};
