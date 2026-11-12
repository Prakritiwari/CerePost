"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AccountSwitcher } from "@/app/mail/components/account-switcher"
import { ThreadDisplay } from "./components/thread-display"
import { ThreadList } from "./components/thread-list"
import { useLocalStorage, useMediaQuery } from "usehooks-ts"
import SideBar from "./components/sidebar"
import SearchBar, { isSearchingAtom } from "./components/search-bar"
import SearchDisplay from "./components/search-display"
import { useAtom } from "jotai"
import AskAI from "./components/ask-ai"
import ComposeButton from "./components/compose-button"
import { useThread } from "./components/use-thread"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, Sparkles } from "lucide-react"

interface MailProps {
    defaultLayout: number[] | undefined
    defaultCollapsed?: boolean
    navCollapsedSize: number
}

function MailTabs({
    isMobile,
    done,
    onDoneChange,
    tab,
}: {
    isMobile: boolean
    done: boolean
    onDoneChange: (done: boolean) => void
    tab: string
}) {
    const [isSearching] = useAtom(isSearchingAtom)

    return (
        <Tabs
            defaultValue="inbox"
            value={done ? "done" : "inbox"}
            onValueChange={(value) => onDoneChange(value === "done")}
            className={cn(
                "flex min-h-0 flex-col",
                isMobile && "flex-1",
            )}
        >
            <div
                className={cn(
                    "flex items-center",
                    isMobile
                        ? "justify-between gap-3 px-4 pt-4 pb-1"
                        : "px-4 py-2",
                )}
            >
                <h1
                    className={cn(
                        "font-bold capitalize",
                        isMobile ? "text-2xl" : "text-xl",
                    )}
                >
                    {tab}
                </h1>
                <TabsList className="ml-auto shrink-0">
                    <TabsTrigger
                        value="inbox"
                        className="text-zinc-600 dark:text-zinc-200"
                    >
                        Inbox
                    </TabsTrigger>
                    <TabsTrigger
                        value="done"
                        className="text-zinc-600 dark:text-zinc-200"
                    >
                        Done
                    </TabsTrigger>
                </TabsList>
            </div>
            <Separator />
            <SearchBar />
            <div className={cn(isMobile && "min-h-0 flex-1 overflow-hidden")}>
                {isSearching ? (
                    <SearchDisplay />
                ) : (
                    <>
                        <TabsContent
                            value="inbox"
                            className={cn("m-0", isMobile && "h-full")}
                        >
                            <ThreadList mobile={isMobile} />
                        </TabsContent>
                        <TabsContent
                            value="done"
                            className={cn("m-0", isMobile && "h-full")}
                        >
                            <ThreadList mobile={isMobile} />
                        </TabsContent>
                    </>
                )}
            </div>
        </Tabs>
    )
}

export function Mail({
    defaultLayout = [20, 32, 48],
    defaultCollapsed = false,
    navCollapsedSize,
}: MailProps) {
    const [done, setDone] = useLocalStorage("normalhuman-done", false)
    const [tab] = useLocalStorage("cerepost-tab", "inbox")
    const [accountId] = useLocalStorage("accountId", "")
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
    const [menuOpen, setMenuOpen] = React.useState(false)
    const [askAiOpen, setAskAiOpen] = React.useState(false)
    const [threadId, setThreadId] = useThread()
    const isMobile = useMediaQuery("(max-width: 767px)")
    const { data: accounts } = api.account.getAccounts.useQuery()
    const accountEmail = accounts?.find((account) => account.id === accountId)
        ?.emailAddress

    if (isMobile) {
        return (
            <TooltipProvider delay={0}>
                <div className="flex h-dvh w-full flex-col overflow-hidden bg-background">
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetContent
                            side="left"
                            className="w-[88vw] max-w-sm border-r p-0"
                        >
                            <SheetHeader className="border-b px-4 py-3">
                                <SheetTitle className="flex items-center gap-2">
                                    CerePost
                                    <span className="text-xs font-normal text-muted-foreground">
                                        Mail
                                    </span>
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                                <div className="p-3">
                                    <AccountSwitcher isCollapsed={false} />
                                </div>
                                <Separator />
                                <SideBar
                                    isCollapsed={false}
                                    onNavigate={() => setMenuOpen(false)}
                                />
                                <Separator />
                                <AskAI isCollapsed={false} />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Sheet open={askAiOpen} onOpenChange={setAskAiOpen}>
                        <SheetContent
                            side="bottom"
                            className="max-h-[85dvh] p-0"
                        >
                            <SheetHeader className="sr-only">
                                <SheetTitle>Ask AI</SheetTitle>
                            </SheetHeader>
                            <div className="min-h-0 flex-1 overflow-y-auto">
                                <AskAI isCollapsed={false} />
                            </div>
                        </SheetContent>
                    </Sheet>

                    {threadId ? (
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                            <ThreadDisplay
                                mobile
                                onBack={() => setThreadId(null)}
                            />
                        </div>
                    ) : (
                        <>
                            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setMenuOpen(true)}
                                    aria-label="Open menu"
                                >
                                    <Menu className="size-5" />
                                </Button>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">
                                        {accountEmail ?? "CerePost Mail"}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        CerePost Mail
                                    </p>
                                </div>
                                <ThemeToggle />
                                <ComposeButton isCollapsed />
                            </header>

                            <MailTabs
                                isMobile
                                done={done}
                                onDoneChange={setDone}
                                tab={tab}
                            />

                            <div
                                className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-end p-4"
                                style={{
                                    paddingBottom:
                                        "calc(1rem + env(safe-area-inset-bottom))",
                                }}
                            >
                                <Button
                                    onClick={() => setAskAiOpen(true)}
                                    className="pointer-events-auto h-12 gap-2 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white shadow-xl transition-transform hover:bg-zinc-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    <Sparkles className="size-4" />
                                    Ask AI
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </TooltipProvider>
        )
    }

    return (
        <TooltipProvider delay={0}>
            <ResizablePanelGroup
                direction="horizontal"
                onLayout={(sizes: number[]) => {
                    document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
                        sizes
                    )}`
                }}
                className="h-full min-h-0 items-stretch"
            >
                <ResizablePanel
                    defaultSize={defaultLayout[0]}
                    collapsedSize={navCollapsedSize}
                    collapsible={true}
                    minSize={15}
                    maxSize={40}
                    onCollapse={() => {
                        setIsCollapsed(true)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                            true
                        )}`
                    }}
                    onResize={() => {
                        setIsCollapsed(false)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                            false
                        )}`
                    }}
                    className={cn(
                        isCollapsed &&
                        "min-w-[50px] transition-all duration-300 ease-in-out"
                    )}
                >
                    <div className="flex flex-col h-full flex-1">
                        <div
                            className={cn(
                                "flex h-[52px] items-center justify-center",
                                isCollapsed ? "h-[52px]" : "px-2"
                            )}
                        >
                            <AccountSwitcher isCollapsed={isCollapsed} />
                        </div>
                        <Separator />
                        <SideBar isCollapsed={isCollapsed} />
                        <div className="flex-1"></div>
                        <div className={cn("p-2", !isCollapsed && "p-4")}>
                            <ComposeButton isCollapsed={isCollapsed} />
                        </div>
                        <AskAI isCollapsed={isCollapsed} />
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
                    <MailTabs
                        isMobile={false}
                        done={done}
                        onDoneChange={setDone}
                        tab={tab}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
                    <ThreadDisplay />
                </ResizablePanel>
            </ResizablePanelGroup>
        </TooltipProvider>
    )
}
