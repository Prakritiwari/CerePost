"use client"

import * as React from "react"
import { useClerk } from "@clerk/nextjs"
import { useLocalStorage } from "usehooks-ts"
import { LogOut, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/trpc/react"

interface AccountSwitcherProps {
  isCollapsed: boolean
}

export function AccountSwitcher({ isCollapsed }: AccountSwitcherProps) {
  const { signOut } = useClerk()
  const utils = api.useUtils()
  const { data: accounts } = api.account.getAccounts.useQuery()
  const [accountId, setAccountId] = useLocalStorage("accountId", "")
  const [ready, setReady] = React.useState(false)
  const manualRefresh = React.useRef(false)
  const lastSyncedAt = React.useRef(0)
  const syncCooldownUntil = React.useRef(0)
  const autoErrorShown = React.useRef(false)

  const selectedAccount = accounts?.find((account) => account.id === accountId)
  const selectedEmail = selectedAccount?.emailAddress ?? ""

  const invalidateMail = React.useCallback(() => {
    void utils.account.getAccounts.invalidate()
    void utils.mail.getAccounts.invalidate()
    void utils.mail.getThreads.invalidate()
    void utils.mail.getNumThreads.invalidate()
    void utils.mail.getThreadById.invalidate()
  }, [utils])

  // Merge rows that were created by repeated Aurinko links.
  const consolidate = api.account.consolidateAccounts.useMutation({
    onSuccess: () => {
      invalidateMail()
      setReady(true)
    },
    onError: () => setReady(true),
  })
  const consolidateRef = React.useRef(consolidate)
  consolidateRef.current = consolidate
  React.useEffect(() => {
    consolidateRef.current.mutate()
  }, [])

  const syncEmails = api.mail.syncEmails.useMutation({
    onSuccess: (data) => {
      if (data?.accountId) setAccountId(data.accountId)
      if (manualRefresh.current) toast.success("Inbox refreshed")
      manualRefresh.current = false
      autoErrorShown.current = false
      syncCooldownUntil.current = 0
      invalidateMail()
    },
    onError: (error) => {
      const wasManual = manualRefresh.current
      manualRefresh.current = false
      const message = error.message || "Could not refresh your inbox"
      const billingIssue = /billing|payment/i.test(message)
      syncCooldownUntil.current =
        Date.now() + (billingIssue ? 10 * 60_000 : 2 * 60_000)

      invalidateMail()

      if (wasManual) {
        toast.error(message, { duration: 10_000 })
      } else if (!autoErrorShown.current) {
        autoErrorShown.current = true
        toast.error(message, { duration: 10_000 })
      }
    },
  })
  const syncRef = React.useRef(syncEmails)
  syncRef.current = syncEmails

  // Keep the chosen account pointed at a real (deduplicated) row.
  React.useEffect(() => {
    if (!accounts) return
    if (accounts.length === 0) {
      toast("Link an account to continue", {
        action: {
          label: "Add account",
          onClick: () => {
            window.location.href = "/api/aurinko/authorize?service=Google"
          },
        },
      })
      return
    }
    if (!accounts.some((account) => account.id === accountId)) {
      setAccountId(accounts[0]!.id)
    }
  }, [accounts, accountId, setAccountId])

  // Pull new mail when the mailbox is opened, when the tab regains focus,
  // and periodically while it stays open.
  React.useEffect(() => {
    if (!accountId || !ready) return

    const maybeSync = () => {
      if (document.hidden) return
      if (Date.now() < syncCooldownUntil.current) return
      if (Date.now() - lastSyncedAt.current < 60_000) return
      lastSyncedAt.current = Date.now()
      syncRef.current.mutate({ accountId })
    }

    maybeSync()
    window.addEventListener("focus", maybeSync)
    const interval = window.setInterval(maybeSync, 3 * 60_000)
    return () => {
      window.removeEventListener("focus", maybeSync)
      window.clearInterval(interval)
    }
  }, [accountId, ready])

  const handleRefresh = () => {
    if (!accountId || syncEmails.isPending) return
    manualRefresh.current = true
    lastSyncedAt.current = Date.now()
    syncCooldownUntil.current = 0
    invalidateMail()
    syncEmails.mutate({ accountId })
  }

  const handleAddAccount = () => {
    window.location.href = "/api/aurinko/authorize?service=Google"
  }

  if (!accounts) return <></>

  return (
    <div className="flex w-full items-center gap-1">
      <Select
        value={accountId}
        onValueChange={(value) => value && setAccountId(value)}
      >
        <SelectTrigger
          className={cn(
            "flex w-full flex-1 items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
            isCollapsed &&
              "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
          )}
          aria-label="Select account"
        >
          {isCollapsed ? (
            <span className="text-xs font-semibold">
              {selectedEmail[0]?.toUpperCase() ?? "A"}
            </span>
          ) : (
            <SelectValue placeholder="Select an account">
              <span className="truncate">{selectedEmail}</span>
            </SelectValue>
          )}
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500/80" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate">{account.emailAddress}</span>
                  {account.name && (
                    <span className="truncate text-[10px] text-muted-foreground">
                      {account.name}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
          <div className="my-1 h-px bg-border" />
          <div
            onClick={handleAddAccount}
            className="relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none hover:bg-accent focus:bg-accent focus:text-accent-foreground"
          >
            <Plus className="mr-1 size-4" />
            Add account
          </div>
          <div
            onClick={handleRefresh}
            className="relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none hover:bg-accent focus:bg-accent focus:text-accent-foreground"
          >
            <RefreshCw
              className={cn("mr-1 size-4", syncEmails.isPending && "animate-spin")}
            />
            Refresh inbox
          </div>
          <div
            onClick={() => void signOut({ redirectUrl: "/" })}
            className="relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-sm text-red-600 outline-none hover:bg-red-500/10 focus:bg-red-500/10 dark:text-red-400"
          >
            <LogOut className="mr-1 size-4" />
            Sign out
          </div>
        </SelectContent>
      </Select>

      {!isCollapsed && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={!accountId || syncEmails.isPending}
            title="Refresh inbox"
            aria-label="Refresh inbox"
          >
            <RefreshCw
              className={cn("size-4", syncEmails.isPending && "animate-spin")}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void signOut({ redirectUrl: "/" })}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </>
      )}
    </div>
  )
}
