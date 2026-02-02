import { ReactNode, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    characterCount?: { current: number; max?: number; min?: number };
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, helperText, characterCount, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={cn(
                        'w-full px-4 py-2.5 rounded-lg border border-gray-300',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        'placeholder:text-gray-400',
                        'transition-colors',
                        'resize-y min-h-[100px]',
                        error && 'border-red-500 focus:ring-red-500',
                        className
                    )}
                    {...props}
                />
                <div className="flex justify-between items-center mt-1.5">
                    <div>
                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                        {!error && helperText && (
                            <p className="text-sm text-gray-500">{helperText}</p>
                        )}
                    </div>
                    {characterCount && (
                        <p className={cn(
                            "text-sm",
                            characterCount.min && characterCount.current < characterCount.min ? "text-red-600" :
                                characterCount.max && characterCount.current > characterCount.max ? "text-red-600" :
                                    "text-gray-500"
                        )}>
                            {characterCount.current}
                            {characterCount.min && ` / ${characterCount.min} min`}
                            {characterCount.max && ` / ${characterCount.max} max`}
                        </p>
                    )}
                </div>
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';


interface CheckboxGroupProps {
    label?: string;
    options: { value: string; label: string; description?: string }[];
    value: string[];
    onChange: (value: string[]) => void;
    name: string;
}

export function CheckboxGroup({ label, options, value, onChange, name }: CheckboxGroupProps) {
    const handleChange = (optionValue: string, checked: boolean) => {
        if (checked) {
            onChange([...value, optionValue]);
        } else {
            onChange(value.filter(v => v !== optionValue));
        }
    };

    return (
        <div className="space-y-3">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    {label}
                </label>
            )}
            {options.map((option) => (
                <label key={option.value} className="flex items-start gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        name={name}
                        value={option.value}
                        checked={value.includes(option.value)}
                        onChange={(e) => handleChange(option.value, e.target.checked)}
                        className="mt-1 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {option.label}
                        </div>
                        {option.description && (
                            <div className="text-sm text-gray-600 mt-0.5">{option.description}</div>
                        )}
                    </div>
                </label>
            ))}
        </div>
    );
}
