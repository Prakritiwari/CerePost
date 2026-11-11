// ResultItem.tsx
import { motion } from 'framer-motion'
import * as React from "react";
import type { ActionImpl, ActionId } from "kbar";

interface ResultItemProps {
    action: ActionImpl;
    active: boolean;
    currentRootActionId: ActionId;
}

const ResultItem = React.forwardRef<HTMLDivElement, ResultItemProps>(
    (
        {
            action,
            active,
            currentRootActionId,
        },
        ref
    ) => {
        const ancestors = React.useMemo(() => {
            if (!currentRootActionId) return action.ancestors;
            const index = action.ancestors.findIndex(
                (ancestor) => ancestor.id === currentRootActionId
            );
            return action.ancestors.slice(index + 1);
        }, [action.ancestors, currentRootActionId]);

        return (
            <div
                ref={ref}
                className="px-4 py-3 flex items-center justify-between cursor-pointer relative z-10 select-none"
            >
                {active && (
                    <motion.div
                        layoutId='kbar-result-item'
                        className='bg-zinc-200 dark:bg-zinc-700 border-l-4 border-zinc-900 dark:border-zinc-100 absolute inset-0 !z-[-1]'
                        transition={{
                            duration: 0.14,
                            type: 'spring',
                            ease: 'easeInOut',
                        }}
                    />
                )}
                <div className="flex gap-2 items-center relative z-10">
                    {action.icon && action.icon}
                    <div className="flex flex-col">
                        <div className="text-sm font-medium">
                            {ancestors.length > 0 &&
                                ancestors.map((ancestor) => (
                                    <React.Fragment key={ancestor.id}>
                                        <span className="opacity-50 mr-2">{ancestor.name}</span>
                                        <span className="mr-2">&rsaquo;</span>
                                    </React.Fragment>
                                ))}
                            <span>{action.name}</span>
                        </div>
                        {action.subtitle && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{action.subtitle}</span>
                        )}
                    </div>
                </div>
                {action.shortcut?.length ? (
                    <div className="grid grid-flow-col gap-1 relative z-10">
                        {action.shortcut.map((sc, i) => {
                            const label = typeof sc === 'string' ? sc : String(sc);
                            return (
                                <kbd
                                    key={`${label}-${i}`}
                                    className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 border border-zinc-300 dark:border-zinc-700 shadow-sm font-mono text-[11px] rounded flex items-center justify-center min-w-[18px]"
                                >
                                    {label}
                                </kbd>
                            );
                        })}
                    </div>
                ) : null}
            </div>
        );
    }
);

ResultItem.displayName = "ResultItem";

export default ResultItem;