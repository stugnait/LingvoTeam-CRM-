import { ArrowLeftRight } from "lucide-react"

export function SwapButton({ source, target, setSource, setTarget }) {

    const canSwap = source && target && source !== target

    const handleSwap = () => {
        if (!canSwap) return

        setSource(target)
        setTarget(source)
    }

    return (
        <button
            onClick={handleSwap}
            disabled={!canSwap}
            className={`
                h-14 w-14
                rounded-full
                flex items-center justify-center
                border-2
                transition-all duration-200
                ${canSwap
                ? "hover:scale-110 hover:border-blue-600 hover:shadow-md"
                : "opacity-40 cursor-not-allowed"
            }
            `}
        >
            <ArrowLeftRight className="h-5 w-5" />
        </button>
    )
}
