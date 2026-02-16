export function WizardStep({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            {children}
        </div>
    )
}
