
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

export async function getEmbeddings(text: string): Promise<number[]> {
    try {
        const response = await genAI.models.embedContent({
            model: "gemini-embedding-001",
            contents: text.replace(/\n/g, " "),
            config: {
                taskType: "RETRIEVAL_DOCUMENT",
            },
        });

        const embedding = response.embeddings?.[0]?.values;

        if (!embedding) {
            throw new Error("No embedding returned from Gemini API");
        }

        return embedding;
    } catch (error) {
        console.error("Error calling Gemini embeddings API:", error);
        throw error;
    }
}
