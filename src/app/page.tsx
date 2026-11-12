import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingBackground } from "@/components/landing-background";
import { AuthGate } from "@/components/auth-gate";
import { LogoMark } from "@/components/logo";
import {
    Sparkles,
    Zap,
    Search,
    Command,
    Mail,
    CheckCircle2,
    Shield,
    Inbox,
    ArrowRight,
    Keyboard,
    Layers,
    Bot,
} from "lucide-react";

export default function Home() {
    return (
        <div className="relative min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900 overflow-x-hidden">
            <LandingBackground />

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col min-h-screen bg-transparent">
                {/* Header / Navbar */}
                <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3" aria-label="CerePost home">
                            <LogoMark className="size-10" />
                            <div className="flex flex-col">
                                <span className="font-bold text-base tracking-tight">CerePost</span>
                                <span className="text-[10px] text-zinc-500 font-mono -mt-1 tracking-wider uppercase">AI Email Client</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <AuthGate
                                fallback={
                                    <div className="h-9 w-28 animate-pulse rounded-md bg-zinc-200/60 dark:bg-zinc-800/60" />
                                }
                                signedIn={
                                    <div className="flex items-center gap-3">
                                        <Link href="/mail">
                                            <Button className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs sm:text-sm font-medium h-9 px-4">
                                                Open Inbox <ArrowRight className="size-3.5 ml-1.5" />
                                            </Button>
                                        </Link>
                                        <UserButton />
                                    </div>
                                }
                                signedOut={
                                    <div className="flex items-center gap-2">
                                        <SignInButton mode="modal">
                                            <Button variant="ghost" className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 text-xs sm:text-sm h-9 px-3">
                                                Sign In
                                            </Button>
                                        </SignInButton>
                                        <SignUpButton mode="modal">
                                            <Button className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs sm:text-sm font-medium h-9 px-4 shadow-sm">
                                                Sign Up Free
                                            </Button>
                                        </SignUpButton>
                                    </div>
                                }
                            />
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative py-20 sm:py-28 px-4 sm:px-6 max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200/90 dark:border-zinc-800/90 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-6 shadow-sm">
                        <Sparkles className="size-3.5 text-zinc-900 dark:text-zinc-100" />
                        <span>Powered by Gemini AI &amp; Keyboard-First Velocity</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 max-w-4xl mx-auto leading-tight sm:leading-none">
                        Email rebuilt for speed, intelligence, and zero clutter.
                    </h1>

                    <p className="mt-6 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        CerePost is the modern AI-assisted inbox. Natural language search, instant drafting, automated thread triage, and command palette navigation.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <AuthGate
                            fallback={
                                <div className="h-11 w-56 animate-pulse rounded-md bg-zinc-200/60 dark:bg-zinc-800/60" />
                            }
                            signedIn={
                                <Link href="/mail">
                                    <Button size="lg" className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold px-6 h-11 shadow-sm">
                                        Launch CerePost Inbox <ArrowRight className="size-4 ml-2" />
                                    </Button>
                                </Link>
                            }
                            signedOut={
                                <>
                                    <SignUpButton mode="modal">
                                        <Button size="lg" className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold px-6 h-11 shadow-sm">
                                            Get Started Free <ArrowRight className="size-4 ml-2" />
                                        </Button>
                                    </SignUpButton>
                                    <SignInButton mode="modal">
                                        <Button size="lg" variant="outline" className="border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-medium px-6 h-11 backdrop-blur-sm">
                                            Sign In to Account
                                        </Button>
                                    </SignInButton>
                                </>
                            }
                        />
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-zinc-700 dark:text-zinc-300" /> Free to get started</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-zinc-700 dark:text-zinc-300" /> Google &amp; IMAP Sync</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-zinc-700 dark:text-zinc-300" /> No credit card required</span>
                    </div>
                </section>

                {/* UI Mockup Preview (Clean Solid Design, No Gradients) */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 w-full">
                    <div className="border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-2 sm:p-4 shadow-xl">
                        {/* Mock Window Header */}
                        <div className="flex items-center justify-between pb-3 px-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                <div className="size-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                <div className="size-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-white/80 dark:bg-zinc-800/80 px-3 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                                <Search className="size-3 text-zinc-400" />
                                <span>cerepost.app/mail — inbox (3 unread)</span>
                            </div>
                            <div className="text-[11px] font-mono text-zinc-400">Ctrl + K</div>
                        </div>

                        {/* Mock App 3-Pane Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mt-3 min-h-[380px]">
                            {/* Sidebar Mock */}
                            <div className="hidden md:flex md:col-span-3 flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/90 dark:bg-zinc-950/90 p-3">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 font-medium text-xs">
                                    <span className="flex items-center gap-2"><Inbox className="size-3.5" /> Inbox</span>
                                    <span className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-1.5 py-0.5 rounded text-[10px] font-bold">12</span>
                                </div>
                                <div className="flex items-center justify-between p-2 text-zinc-500 text-xs mt-1">
                                    <span className="flex items-center gap-2"><CheckCircle2 className="size-3.5" /> Done</span>
                                    <span className="text-[10px]">48</span>
                                </div>
                                <div className="flex items-center justify-between p-2 text-zinc-500 text-xs">
                                    <span className="flex items-center gap-2"><Mail className="size-3.5" /> Sent</span>
                                    <span className="text-[10px]">19</span>
                                </div>
                                <div className="mt-auto p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                        <Bot className="size-3.5" /> Ask AI Anything
                                    </div>
                                    <p className="text-[11px] text-zinc-500 mt-1">
                                        &quot;When is the next client review?&quot;
                                    </p>
                                </div>
                            </div>

                            {/* Thread List Mock */}
                            <div className="col-span-1 md:col-span-4 flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/90 dark:bg-zinc-950/90 p-2 space-y-2">
                                <div className="p-3 rounded-lg border border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">Sarah Jenkins</span>
                                        <span className="text-[10px] text-zinc-400">10:42 AM</span>
                                    </div>
                                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-1">Q4 Strategy &amp; Roadmaps</p>
                                    <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">Please find attached the updated deck for tomorrow...</p>
                                </div>

                                <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 opacity-85">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">Stripe Invoices</span>
                                        <span className="text-[10px] text-zinc-400">Yesterday</span>
                                    </div>
                                    <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">Payment successful #INV-2026-9</p>
                                    <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">Your receipt has been generated...</p>
                                </div>

                                <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 opacity-85">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">GitHub Notifications</span>
                                        <span className="text-[10px] text-zinc-400">Nov 8</span>
                                    </div>
                                    <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">PR #42 merged into main</p>
                                    <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">All CI checks completed successfully...</p>
                                </div>
                            </div>

                            {/* Thread Detail Mock */}
                            <div className="hidden md:flex md:col-span-5 flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/90 dark:bg-zinc-950/90 p-4">
                                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                                    <div>
                                        <h4 className="text-sm font-bold">Q4 Strategy &amp; Roadmaps</h4>
                                        <p className="text-[11px] text-zinc-500">Sarah Jenkins &lt;sarah@acme.inc&gt;</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs">
                                            <CheckCircle2 className="size-4 text-emerald-600" />
                                        </span>
                                    </div>
                                </div>

                                <div className="py-3 text-xs text-zinc-700 dark:text-zinc-300 space-y-2 leading-relaxed">
                                    <p>Hi Team,</p>
                                    <p>We&apos;ve synthesized all feedback from customer success and engineering into the Q4 priority roadmap.</p>
                                    <p>Looking forward to our sync tomorrow morning.</p>
                                </div>

                                <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800 pt-3">
                                    <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs flex items-center justify-between">
                                        <span className="text-zinc-500 font-mono text-[11px]">Draft reply... (Press Cmd+J for AI autocomplete)</span>
                                        <span className="px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-medium">Send</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Features Grid */}
                <section className="py-20 border-y border-zinc-200/80 dark:border-zinc-800/80 px-4 sm:px-6 w-full">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                                Engineered for high-output email productivity.
                            </h2>
                            <p className="mt-3 text-zinc-600 dark:text-zinc-400 text-sm">
                                Everything you need to reach inbox zero in seconds every single day.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Feature 1 */}
                            <div className="border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-6 bg-white/75 dark:bg-zinc-900/75 shadow-sm backdrop-blur-md">
                                <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-4">
                                    <Sparkles className="size-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Ask AI Email Assistant</h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                                    Chat directly with your inbox using Gemini AI. Summarize unread threads, extract flight numbers, find meeting details, and retrieve information instantly.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-6 bg-white/75 dark:bg-zinc-900/75 shadow-sm backdrop-blur-md">
                                <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-4">
                                    <Zap className="size-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Smart Compose &amp; Autocomplete</h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                                    Complete your thoughts naturally. Press <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px] border border-zinc-300 dark:border-zinc-700">Cmd + J</kbd> for inline copilot suggestions tailored to the email thread context.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-6 bg-white/75 dark:bg-zinc-900/75 shadow-sm backdrop-blur-md">
                                <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-4">
                                    <Command className="size-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">KBar Command Palette</h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                                    Press <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px] border border-zinc-300 dark:border-zinc-700">Ctrl + K</kbd> to jump between inboxes, switch accounts, toggle dark mode, or execute triage actions without touching your mouse.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-6 bg-white/75 dark:bg-zinc-900/75 shadow-sm backdrop-blur-md">
                                <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-4">
                                    <Search className="size-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Full-Text &amp; Semantic Search</h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                                    Find any message by sender, domain, subject, or keyword. Searches across all indexed content with database and vector fallbacks.
                                </p>
                            </div>

                            {/* Feature 5 */}
                            <div className="border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-6 bg-white/75 dark:bg-zinc-900/75 shadow-sm backdrop-blur-md">
                                <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-4">
                                    <CheckCircle2 className="size-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">One-Click Triage Workflow</h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                                    Mark emails as Done with a single tap. Keep your pending queue pristine while preserving full searchability in your archive.
                                </p>
                            </div>

                            {/* Feature 6 */}
                            <div className="border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-6 bg-white/75 dark:bg-zinc-900/75 shadow-sm backdrop-blur-md">
                                <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-4">
                                    <Layers className="size-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Multi-Account Switching</h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                                    Seamlessly connect and toggle between personal, work, and client accounts with dedicated shortcuts (<kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px] border border-zinc-300 dark:border-zinc-700">Cmd + 1..9</kbd>).
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bottom CTA Section */}
                <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center w-full">
                    <div className="border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-8 sm:p-12 shadow-sm">
                        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                            Ready for a faster, smarter inbox?
                        </h2>
                        <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
                            Sign in or create your account in seconds to start experiencing CerePost.
                        </p>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <AuthGate
                                fallback={
                                    <div className="h-11 w-56 animate-pulse rounded-md bg-zinc-200/60 dark:bg-zinc-800/60" />
                                }
                                signedIn={
                                    <Link href="/mail">
                                        <Button size="lg" className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold px-6 h-11 shadow-sm">
                                            Open CerePost Mailbox <ArrowRight className="size-4 ml-2" />
                                        </Button>
                                    </Link>
                                }
                                signedOut={
                                    <>
                                        <SignUpButton mode="modal">
                                            <Button size="lg" className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold px-6 h-11 shadow-sm">
                                                Get Started Free <ArrowRight className="size-4 ml-2" />
                                            </Button>
                                        </SignUpButton>
                                        <SignInButton mode="modal">
                                            <Button size="lg" variant="outline" className="border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-6 h-11 font-medium backdrop-blur-sm">
                                                Sign In
                                            </Button>
                                        </SignInButton>
                                    </>
                                }
                            />
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-auto border-t border-zinc-200/80 dark:border-zinc-800/80 py-8 px-4 sm:px-6 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md">
                    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                            <LogoMark className="size-5" />
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">CerePost</span>
                            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/mail" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                Mailbox
                            </Link>
                            <span>•</span>
                            <span>Privacy-conscious &amp; AI-native</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
