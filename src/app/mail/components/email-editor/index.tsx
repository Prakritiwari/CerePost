"use client";
import GhostExtension from "./extension";
import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import TipTapMenuBar from "./menu-bar";
import Text from "@tiptap/extension-text";
import { Button } from "@/components/ui/button";

import { Separator } from "@/components/ui/separator";
import { api } from "@/trpc/react";
import { Input } from "@/components/ui/input";
import TagInput from "./tag-input";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useLocalStorage } from "usehooks-ts";
import { Loader2, Sparkles } from "lucide-react";
import AIComposeButton from "./ai-compose-button";
import { toast } from "sonner";

type EmailEditorProps = {
    toValues: { label: string, value: string }[];
    ccValues: { label: string, value: string }[];

    subject: string;
    setSubject: (subject: string) => void;
    to: string[]
    handleSend: (value: string) => void;
    isSending: boolean;

    onToChange: (values: { label: string, value: string }[]) => void;
    onCcChange: (values: { label: string, value: string }[]) => void;

    defaultToolbarExpand?: boolean;
    isComposing?: boolean;
    initialBody?: string;
}

const EmailEditor = ({ toValues, ccValues, subject, setSubject, to, handleSend, isSending, onToChange, onCcChange, defaultToolbarExpand, isComposing, initialBody }: EmailEditorProps) => {

    const [ref] = useAutoAnimate();
    const [accountId] = useLocalStorage('accountId', '');
    const { data: suggestions } = api.mail.getEmailSuggestions.useQuery({ accountId: accountId, query: '' }, { enabled: !!accountId });


    const [expanded, setExpanded] = React.useState(defaultToolbarExpand ?? false);
    const [isAutocompleting, setIsAutocompleting] = React.useState(false);

    const aiGenerate = async () => {
        if (isAutocompleting) return;

        const input = editor?.getText().trim() ?? '';
        if (!input) {
            toast.info('Write a few words first, then press Ctrl/⌘ + J to autocomplete.');
            return;
        }

        setIsAutocompleting(true);
        try {
            const response = await fetch('/api/ai/autocomplete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input }),
            });

            if (!response.ok) {
                const data = (await response.json().catch(() => null)) as
                    | { error?: string }
                    | null;
                throw new Error(data?.error || 'AI autocomplete failed');
            }

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                if (chunk) editor?.commands.insertContent(chunk);
            }

            const tail = decoder.decode();
            if (tail) editor?.commands.insertContent(tail);
        } catch (error) {
            console.error('AI autocomplete error:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'AI autocomplete failed. Please try again.',
            );
        } finally {
            setIsAutocompleting(false);
        }
    };



    const editor = useEditor({
        autofocus: false,
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                // @ts-ignore
                text: false,
            }),
            Text,
            GhostExtension,
        ],
        editorProps: {
            attributes: {
                placeholder: "Write your email here...",
                class: "focus:outline-none min-h-[90px] max-h-[250px] overflow-y-auto px-4 py-2 w-full sm:min-h-[120px]",
            }
        },
        onUpdate: ({ editor }) => {
            setValue(editor.getHTML())
        }
    });

    const aiGenerateRef = React.useRef(aiGenerate);
    aiGenerateRef.current = aiGenerate;

    React.useEffect(() => {
        if (!editor || !initialBody) return;
        editor.commands.setContent(initialBody, { emitUpdate: true });
    }, [editor, initialBody]);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === 'j'
            ) {
                if (!editor?.isFocused) return;
                event.preventDefault();
                event.stopPropagation();
                void aiGenerateRef.current();
                return;
            }

            if (event.key === 'Enter' && editor && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
                editor.commands.focus();
            }
            if (event.key === 'Escape' && editor) {
                editor.commands.blur();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [editor]);

    const [value, setValue] = React.useState('');




    return (
        <div>
            <div className="flex p-4 py-2 border-b">
                {editor && <TipTapMenuBar editor={editor} />}
            </div>

            <div ref={ref} className="p-4 pb-0 space-y-2">
                {expanded && (
                    <>
                        <TagInput suggestions={suggestions?.map(s => s.address) || []} value={toValues} placeholder="Add tags" label="To" onChange={onToChange} />
                        <TagInput suggestions={suggestions?.map(s => s.address) || []} value={ccValues} placeholder="Add tags" label="Cc" onChange={onCcChange} />
                        <Input id="subject" className="w-full" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
                    </>
                )}
                <div className="flex items-center gap-2">
                    <div className="cursor-pointer" onClick={() => setExpanded(e => !e)}>
                        <span className="text-green-600 font-medium">
                            Draft{' '}
                        </span>
                        <span>
                            to {to.join(', ')}
                        </span>
                    </div>
                    <AIComposeButton
                        isComposing={isComposing ?? defaultToolbarExpand}
                        onGenerate={(token, isFirst) => {
                            if (isFirst) {
                                editor?.commands.setContent('');
                            }
                            editor?.commands.insertContent(token);
                        }}
                    />
                </div>
            </div>

            <div className="prose w-full px-4">
                <EditorContent value={value} editor={editor} placeholder="Write your email here..." />
            </div>
            <Separator />
            <div className="py-3 px-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void aiGenerate()}
                        disabled={isAutocompleting}
                        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        title="AI autocomplete (Ctrl/⌘ + J)"
                    >
                        {isAutocompleting ? (
                            <Loader2 className="size-3.5 animate-spin text-primary" />
                        ) : (
                            <Sparkles className="size-3.5 text-purple-500" />
                        )}
                        <span>
                            {isAutocompleting ? 'Completing…' : 'AI autocomplete'}
                        </span>
                    </Button>
                    <kbd className="hidden items-center gap-1 rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 sm:inline-flex dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        Ctrl/⌘ + J
                    </kbd>
                </div>
                <Button onClick={() => { editor?.commands.clearContent(); handleSend(value); }} isLoading={isSending}>
                    Send
                </Button>
            </div>
        </div>
    );
};

export default EmailEditor;
