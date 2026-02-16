import { Select, SelectContent, SelectItem, SelectTrigger } from "@radix-ui/react-select";
import { Globe, ChevronDown, Languages } from "lucide-react";

export function LanguageSelectorCard({
                                         label,
                                         value,
                                         onChange,
                                         languages
                                     }) {
    const selected = languages.find(l => String(l.id) === value);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Languages className="w-4 h-4" />
                <span>{label}</span>
            </div>

            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="
                    w-full
                    group
                    relative
                    overflow-hidden
                    bg-white
                    border-2
                    border-gray-200
                    rounded-2xl
                    px-5
                    py-4
                    text-left
                    transition-all
                    duration-200
                    hover:border-blue-400
                    hover:shadow-lg
                    hover:shadow-blue-100
                    focus:outline-none
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-100
                    cursor-pointer
                ">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`
                                flex items-center justify-center
                                w-12 h-12
                                rounded-xl
                                transition-colors
                                duration-200
                                ${selected
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                            }
                            `}>
                                <Globe className="w-6 h-6" />
                            </div>

                            <div className="flex flex-col">
                                <span className={`
                                    text-lg font-semibold
                                    transition-colors
                                    duration-200
                                    ${selected ? 'text-gray-900' : 'text-gray-400'}
                                `}>
                                    {selected?.name || "Оберіть мову"}
                                </span>

                                {selected && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                            ID: {selected.id}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            • активна мова
                                        </span>
                                    </div>
                                )}

                                {!selected && (
                                    <span className="text-xs text-gray-400 mt-1">
                                        Натисніть щоб вибрати мову
                                    </span>
                                )}
                            </div>
                        </div>

                        <ChevronDown className={`
                            w-5 h-5
                            transition-all
                            duration-200
                            ${selected ? 'text-gray-400' : 'text-gray-300'}
                            group-hover:translate-y-0.5
                            group-hover:text-blue-500
                        `} />
                    </div>
                </SelectTrigger>

                <SelectContent
                    className="
                        bg-white
                        border
                        border-gray-200
                        rounded-xl
                        shadow-xl
                        overflow-hidden
                        min-w-[300px]
                        max-h-[320px]
                        z-[9999]
                    "
                    position="popper"
                    sideOffset={5}
                    align="start"
                    avoidCollisions={true}
                    collisionBoundary="viewport"
                >
                    <div className="p-2">
                        <div className="text-xs font-medium text-gray-400 px-3 py-2">
                            Доступні мови ({languages.length})
                        </div>

                        <div className="space-y-1">
                            {languages.map(lang => (
                                <SelectItem
                                    key={lang.id}
                                    value={String(lang.id)}
                                    className="
                                        relative
                                        flex
                                        items-center
                                        px-3
                                        py-3
                                        text-base
                                        rounded-lg
                                        cursor-pointer
                                        transition-all
                                        duration-150
                                        hover:bg-blue-50
                                        hover:text-blue-700
                                        focus:outline-none
                                        focus:bg-blue-50
                                        focus:text-blue-700
                                        data-[state=checked]:bg-blue-500
                                        data-[state=checked]:text-white
                                        data-[state=checked]:font-medium
                                    "
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-4 h-4 opacity-60" />
                                            <span>{lang.name}</span>
                                        </div>
                                        <span className="text-xs opacity-60">
                                            ID: {lang.id}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </div>
                    </div>
                </SelectContent>
            </Select>
        </div>
    );
}