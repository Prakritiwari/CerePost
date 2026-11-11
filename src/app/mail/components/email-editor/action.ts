
'use server';

import TurndownService from 'turndown';

import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { createStreamableValue } from '@ai-sdk/rsc';

export async function generateEmail(context: string, prompt: string) {
    console.log("context", context);

    const stream = createStreamableValue('');

    (async () => {
        try {
            const { textStream } = await streamText({
                model: google('gemini-3.5-flash'),
                prompt: `
            You are an AI email assistant embedded in an email client app. Your purpose is to help the user compose emails by providing thoughtful, natural, and accurate responses based on the context of their previous emails.

            THE TIME NOW IS ${new Date().toLocaleString()}

            START CONTEXT BLOCK
            ${context}
            END OF CONTEXT BLOCK

            USER INSTRUCTIONS / INTENT:
            ${prompt}

            When responding:
            - Write directly in natural, human email prose.
            - Greet the recipient by their first name if known from the previous email.
            - Directly address any questions, requests, or information from the latest email in the context.
            - Sign off naturally with the sender's name provided in context.
            - Never include meta commentary like "Here is your email draft:" or subject lines.
            - Never wrap the output in markdown code blocks like \`\`\`email. Output only the message body.
            `,
            });

            for await (const delta of textStream) {
                stream.update(delta);
            }

            stream.done();
        } catch (error) {
            console.error("Error in generateEmail:", error);
            stream.error(error);
        }
    })();

    return { output: stream.value };
}

export async function generate(input: string) {
    const stream = createStreamableValue('');

    console.log("input", input);

    (async () => {
        try {
            const { textStream } = await streamText({
                model: google('gemini-3.5-flash'),
                prompt: `
            ALWAYS RESPOND IN PLAIN TEXT, no html or markdown.

            You are a helpful AI embedded in an email client app that is used to autocomplete sentences, similar to Google Gmail autocomplete.

            The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
            AI is a well-behaved and well-mannered individual.
            AI is always friendly, kind, and inspiring.

            I am writing a piece of text in a notion text editor app.
            Help me complete my train of thought here: <input>${input}</input>

            Keep the tone of the text consistent with the rest of the text.
            Keep the response short and sweet.
            Act like a copilot, finish my sentence if need be, but don't try to generate a whole new paragraph.
            Do not add fluff like "I'm here to help you" or "I'm a helpful AI".

            Example:
            Dear Alice, I'm sorry to hear that you are feeling down.

            Output: Unfortunately, I can't help you with that.

            Your output is directly concatenated to the input, so do not add any new lines or formatting, just plain text.
            `,
            });

            for await (const delta of textStream) {
                stream.update(delta);
            }

            stream.done();
        } catch (error) {
            console.error("Error in generate autocomplete:", error);
            stream.error(error);
        }
    })();

    return { output: stream.value };
}
