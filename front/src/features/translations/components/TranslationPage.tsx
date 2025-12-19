import { Card } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Plus } from "lucide-react"

export function TranslationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Translations</h1>
                    <p className="text-muted-foreground mt-1">Manage translation projects and workflows</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Translation
                </Button>
            </div>

            <Card className="p-12 text-center">
                <div className="max-w-md mx-auto">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No translations yet</h3>
                    <p className="text-muted-foreground mb-6">Get started by creating your first translation project</p>
                    <Button>Create Translation Project</Button>
                </div>
            </Card>
        </div>
    )
}
