'use server';

import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { createStreamableValue } from '@ai-sdk/rsc';

export async function generate(input: string) {
    const stream = createStreamableValue('');

    console.log('input', input);

    (async () => {
        try {
            const { textStream } = await streamText({
                model: google('gemini-3.8-flash'),
                prompt: `
                You are a helpful AI embedded in an email client app
                that is used to answer questions about the emails in the inbox.

                ${input}
            `,
            });

            for await (const delta of textStream) {
                stream.update(delta);
            }

            stream.done();
        } catch (error) {
            console.error("Error in generate action:", error);
            stream.error(error);
        }
    })();

    return { output: stream.value };
}