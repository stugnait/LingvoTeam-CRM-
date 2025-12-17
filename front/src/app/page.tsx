import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Home() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
            <div className="max-w-2xl mx-auto px-6 text-center">
                {/* Logo/Brand */}
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                            />
                        </svg>
                    </div>
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">Translation Management CRM</h1>

                {/* Description */}
                <p className="text-xl text-muted-foreground mb-12 text-balance leading-relaxed">
                    A professional system used by companies and internal teams to manage users, translation workflows, and project
                    coordination in one secure platform.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button asChild size="lg" className="w-full sm:w-auto min-w-40">
                        <Link href="/signup">
                            Create account
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="w-full sm:w-auto min-w-40 bg-transparent">
                        <Link href="/login">Log in</Link>
                    </Button>
                </div>

                {/* Trust indicator */}
                <div className="mt-16 pt-8 border-t border-border/40">
                    <p className="text-sm text-muted-foreground">Secure enterprise-grade translation management</p>
                </div>
            </div>
        </div>
    )
}
