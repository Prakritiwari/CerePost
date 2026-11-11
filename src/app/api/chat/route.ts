import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { OramaManager } from "@/lib/orama";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

const genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY!
);

const CANDIDATE_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
];

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { messages, accountId } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "No messages provided" },
                { status: 400 }
            );
        }

        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || !lastMessage.content) {
            return NextResponse.json(
                { error: "Empty message content" },
                { status: 400 }
            );
        }

        let contextHits = "";

        if (accountId) {
            // 1. Try vector / keyword search with Orama
            try {
                const oramaManager = new OramaManager(accountId);
                await oramaManager.initialize();

                try {
                    const context = await oramaManager.vectorSearch({
                        prompt: lastMessage.content,
                    });
                    if (context?.hits?.length) {
                        contextHits = context.hits
                            .slice(0, 5)
                            .map((hit) => JSON.stringify(hit.document))
                            .join("\n");
                    }
                } catch {
                    const context = await oramaManager.search({
                        term: lastMessage.content,
                    });
                    if (context?.hits?.length) {
                        contextHits = context.hits
                            .slice(0, 5)
                            .map((hit) => JSON.stringify(hit.document))
                            .join("\n");
                    }
                }
            } catch (oramaErr) {
                console.warn("Orama search unavailable, falling back to database:", oramaErr);
            }

            // 2. Fallback to database emails if Orama returned no hits
            if (!contextHits) {
                try {
                    const recentEmails = await db.email.findMany({
                        where: {
                            thread: {
                                accountId: accountId,
                            },
                        },
                        select: {
                            subject: true,
                            bodySnippet: true,
                            from: { select: { name: true, address: true } },
                            to: { select: { name: true, address: true } },
                            sentAt: true,
                        },
                        orderBy: { sentAt: "desc" },
                        take: 8,
                    });

                    if (recentEmails.length > 0) {
                        contextHits = recentEmails
                            .map((e) =>
                                JSON.stringify({
                                    subject: e.subject,
                                    from: e.from?.address,
                                    to: e.to.map((t) => t.address),
                                    snippet: e.bodySnippet,
                                    date: e.sentAt,
                                })
                            )
                            .join("\n");
                    }
                } catch (dbErr) {
                    console.warn("Database email context fallback error:", dbErr);
                }
            }
        }

        const systemPrompt = `You are CerePost AI, an intelligent email assistant embedded in the CerePost email client.
Help the user manage, summarize, query, and compose emails.

Current time: ${new Date().toLocaleString()}

${contextHits ? `RELEVANT EMAIL CONTEXT:\n${contextHits}\n` : "Note: No specific email context was found for this query; answer using general helpful knowledge."}

Guidelines:
- Provide clear, direct, and concise answers without unnecessary fluff.
- If email context contains the answer, cite the sender and key details accurately.
- Maintain a helpful, professional tone.
- Format with Markdown: short paragraphs, bullet or numbered lists, and **bold** for key names and subjects when it improves scanability.
- For email summaries, use one compact bullet per email with the sender and the key takeaway.
- Never wrap an entire answer in a code block.`;

        // Format conversation history for Gemini:
        // Must alternate user/model, start with user, and have non-empty text
        const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

        for (const msg of messages as ChatMessage[]) {
            if (!msg.content || typeof msg.content !== "string") continue;
            const role = msg.role === "assistant" ? "model" : "user";

            // If same role as previous, merge parts
            if (contents.length > 0 && contents[contents.length - 1]!.role === role) {
                contents[contents.length - 1]!.parts[0]!.text += `\n${msg.content}`;
            } else {
                contents.push({
                    role,
                    parts: [{ text: msg.content }],
                });
            }
        }

        // Ensure first message is user
        if (contents.length === 0 || contents[0]!.role !== "user") {
            contents.unshift({
                role: "user",
                parts: [{ text: "Hello" }],
            });
        }

        // Try candidate models in order
        let streamResult: any = null;
        let lastError: any = null;

        for (const modelName of CANDIDATE_MODELS) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemPrompt,
                });
                streamResult = await model.generateContentStream({ contents });
                if (streamResult) break;
            } catch (err: any) {
                console.warn(`Model ${modelName} failed, trying next:`, err?.message || err);
                lastError = err;
            }
        }

        if (!streamResult) {
            throw lastError || new Error("All AI models failed to respond");
        }

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of streamResult.stream) {
                        const text = chunk.text();
                        if (text) {
                            controller.enqueue(encoder.encode(text));
                        }
                    }
                    controller.close();
                } catch (error) {
                    console.error("Gemini stream read error:", error);
                    controller.error(error);
                }
            },
        });

        return new Response(readable, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
            },
        });
    } catch (error: any) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}
