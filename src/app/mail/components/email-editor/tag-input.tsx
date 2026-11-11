import React, { useState } from 'react';
import Avatar from 'react-avatar';
import Select from 'react-select';
import { cn } from '@/lib/utils';

type TagInputProps = {
    suggestions: string[];
    defaultValues?: { label: string, value: string }[];
    placeholder: string;
    label: string;

    onChange: (values: { label: string, value: string }[]) => void;
    value: { label: string, value: string }[];
};

const TagInput: React.FC<TagInputProps> = ({ suggestions, defaultValues = [], label, onChange, value }) => {
    const [input, setInput] = useState('');

    const options = suggestions.map(suggestion => ({
        label: suggestion,
        value: suggestion,
    }));

    return (
        <div className="border rounded-md flex items-center bg-background">
            <span className='ml-3 text-sm text-muted-foreground'>{label}</span>
            <Select
                value={value}
                onChange={(values) => onChange(values as { label: string, value: string }[])}
                className='w-full flex-1'
                isMulti
                onInputChange={setInput}
                defaultValue={defaultValues}
                placeholder={''}
                options={input ? options.concat({ label: input, value: input }) : options}
                formatOptionLabel={(option) => (
                    <span className='flex items-center gap-2'>
                        <Avatar name={option.value} size='25' textSizeRatio={2} round={true} />
                        {option.label}
                    </span>
                )}
                classNames={{
                    control: () => {
                        return '!border-none !outline-none !ring-0 !shadow-none focus:border-none focus:outline-none focus:ring-0 focus:shadow-none dark:!bg-transparent'
                    },
                    menu: () => '!bg-popover dark:!bg-zinc-800 !border !border-border !shadow-lg',
                    menuList: () => '!bg-popover dark:!bg-zinc-800',
                    option: (state) => cn(
                        '!cursor-pointer',
                        state.isFocused && '!bg-accent',
                        state.isSelected && '!bg-accent',
                    ),
                    singleValue: () => 'dark:!text-zinc-100',
                    input: () => 'dark:!text-zinc-100',
                    placeholder: () => 'dark:!text-zinc-500',
                    multiValue: () => {
                        return 'dark:!bg-zinc-700'
                    },
                    multiValueLabel: () => {
                        return 'dark:text-white dark:bg-zinc-700 rounded-md'
                    },
                    multiValueRemove: () => 'dark:!text-zinc-300 dark:hover:!bg-zinc-600',
                    dropdownIndicator: () => 'dark:!text-zinc-400',
                    clearIndicator: () => 'dark:!text-zinc-400',
                    indicatorSeparator: () => 'dark:!bg-zinc-600',
                }}
                classNamePrefix="select"
            />
        </div>
    );
};

export default TagInput;
