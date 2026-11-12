'use client'
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react'
import { Send, Loader2, RotateCcw } from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { LogoMark } from '@/components/logo';
import { toast } from 'sonner';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const markdownComponents: Components = {
    p: ({ children }) => (
        <p className="my-1 leading-relaxed first:mt-0 last:mb-0">{children}</p>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    a: ({ children, href }) => (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
        >
            {children}
        </a>
    ),
    ul: ({ children }) => (
        <ul className="my-1 list-disc space-y-0.5 pl-4">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="my-1 list-decimal space-y-0.5 pl-4">{children}</ol>
    ),
    li: ({ children }) => <li className="pl-0.5">{children}</li>,
    h1: ({ children }) => (
        <h1 className="mt-2 mb-1 text-sm font-semibold first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="mt-2 mb-1 text-sm font-semibold first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="mt-2 mb-1 text-xs font-semibold first:mt-0">{children}</h3>
    ),
    hr: () => <hr className="my-2 border-zinc-300 dark:border-zinc-600" />,
    blockquote: ({ children }) => (
        <blockquote className="my-1 border-l-2 border-zinc-400 pl-2 text-zinc-600 dark:border-zinc-500 dark:text-zinc-300">
            {children}
        </blockquote>
    ),
    code: ({ children, className }) => (
        <code
            className={cn(
                'rounded bg-zinc-300/60 px-1 py-0.5 font-mono text-[11px] dark:bg-zinc-700/60',
                className,
            )}
        >
            {children}
        </code>
    ),
    pre: ({ children }) => (
        <pre className="my-1.5 overflow-x-auto rounded-lg bg-zinc-300/40 p-2 font-mono text-[11px] dark:bg-zinc-900/70 [&_code]:bg-transparent [&_code]:p-0">
            {children}
        </pre>
    ),
    table: ({ children }) => (
        <div className="my-2 w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-[11px]">
                {children}
            </table>
        </div>
    ),
    th: ({ children }) => (
        <th className="border-b border-zinc-300 px-2 py-1 font-semibold dark:border-zinc-600">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="border-b border-zinc-200 px-2 py-1 align-top dark:border-zinc-700/60">
            {children}
        </td>
    ),
};

const AskAI = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const [accountId] = useLocalStorage('accountId', '')
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const messageContainer = document.getElementById("message-container");
        if (messageContainer) {
            messageContainer.scrollTo({
                top: messageContainer.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: trimmed,
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    accountId: accountId || undefined,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.error || `Request failed with status ${res.status}`);
            }

            if (!res.body) throw new Error("No response body received from server");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            const assistantMessageId = (Date.now() + 1).toString();
            let assistantContent = '';

            setMessages((prev) => [
                ...prev,
                { id: assistantMessageId, role: 'assistant', content: '' },
            ]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                assistantContent += chunk;
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: assistantContent }
                            : msg
                    )
                );
            }
        } catch (error: any) {
            console.error('AskAI error:', error);
            const msg = error?.message || 'Failed to get answer from AI';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (isCollapsed) return null;

    return (
        <div className='p-3 mb-4'>
            <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <LogoMark className="size-5" />
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            CerePost AI
                        </span>
                    </div>
                    {messages.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setMessages([])}
                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded transition-colors"
                            title="Clear conversation"
                        >
                            <RotateCcw className="size-3" />
                        </button>
                    )}
                </div>

                <div
                    className="max-h-[38vh] min-h-[60px] overflow-y-auto w-full flex flex-col gap-2 py-2 text-xs"
                    id='message-container'
                >
                    <AnimatePresence mode="popLayout">
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                layout="position"
                                className={cn(
                                    "max-w-[85%] break-words rounded-xl px-3 py-2 text-xs leading-relaxed",
                                    {
                                        'self-end bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm':
                                            message.role === 'user',
                                        'self-start bg-zinc-200/90 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700':
                                            message.role === 'assistant',
                                    }
                                )}
                                transition={{ duration: 0.15 }}
                            >
                                {message.content ? (
                                    message.role === 'assistant' ? (
                                        <div className="min-w-0">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={markdownComponents}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <span className="whitespace-pre-wrap">
                                            {message.content}
                                        </span>
                                    )
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-zinc-400">
                                        <Loader2 className="size-3 animate-spin" /> Thinking...
                                    </span>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {messages.length === 0 && (
                        <div className="py-2">
                            <p className="text-zinc-600 dark:text-zinc-400 text-xs">
                                Ask questions, search past emails, or summarize threads.
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {[
                                    'When is my next meeting?',
                                    'Summarize unread emails',
                                    'Find flight details',
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => setInput(suggestion)}
                                        className="px-2 py-1 bg-zinc-200/70 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-[11px] font-medium transition-colors text-left"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex items-center gap-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <input
                        type="text"
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                        disabled={isLoading}
                        className="h-8 flex-grow rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                        placeholder="Ask AI anything..."
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="h-8 w-8 flex items-center justify-center rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-40 transition-opacity hover:opacity-90"
                    >
                        {isLoading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Send className="size-3.5" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AskAI
