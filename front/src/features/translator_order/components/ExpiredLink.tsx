import { AlertCircle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/src/components/ui/button"

export function ExpiredLink() {
    const handleRefresh = () => {
        window.location.reload()
    }

    const handleHome = () => {
        window.location.href = "/"
    }

    return (
        <div className="max-w-md mx-auto mt-24 p-8 rounded-xl border bg-card shadow-lg text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6">
                <AlertCircle className="h-10 w-10 text-destructive" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-3">
                Посилання недійсне
            </h1>

            <p className="text-muted-foreground mb-2">
                Термін дії посилання закінчився
            </p>
            <p className="text-sm text-muted-foreground mb-8">
                Будь ласка, зверніться до відповідальної особи для отримання нового доступу
            </p>

            <div className="space-y-3">
                <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="w-full gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Спробувати знову
                </Button>

                <Button
                    onClick={handleHome}
                    className="w-full gap-2"
                >
                    <Home className="h-4 w-4" />
                    На головну
                </Button>
            </div>

            <div className="mt-8 pt-6 border-t">
                <p className="text-xs text-muted-foreground">
                    Якщо проблема повторюється, зв'яжіться з нашою підтримкою
                </p>
            </div>
        </div>
    )
}