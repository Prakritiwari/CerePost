import { api } from "@/trpc/react"
import { useLocalStorage } from "usehooks-ts"

export const useThreads = () => {
    const { data: accounts } = api.account.getAccounts.useQuery()
    const [accountId] = useLocalStorage('accountId', '')
    const [tab] = useLocalStorage('cerepost-tab', 'inbox')
    const [done] = useLocalStorage('cerepost-done', false)

    const { data: threads, isFetching, refetch } = api.account.getThreads.useQuery({
        accountId,
        tab,
        done
    }, {
        enabled: !!accountId && !!tab, placeholderData: e => e, refetchInterval: 5000

    })

    return {
        threads,
        isFetching,
        refetch,
        accountId,
        account: accounts?.find(e => e.id === accountId)
    }


}

