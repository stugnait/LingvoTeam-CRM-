"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import { cn } from "@/src/lib/utils"
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react"

interface StepConfig {
    title: string
    description?: string
    icon?: React.ReactNode
}

interface WizardModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    steps: StepConfig[]
    onSubmit: () => void
    children: React.ReactNode
    isLoading?: boolean
    onClose?: () => void
}

export function WizardModal({
                                open,
                                onOpenChange,
                                title,
                                steps,
                                onSubmit,
                                children,
                                isLoading,
                                onClose,
                            }: WizardModalProps) {

    const [currentStep, setCurrentStep] = React.useState(0)

    const stepArray = React.Children.toArray(children)

    const isLast = currentStep === stepArray.length - 1
    const isFirst = currentStep === 0

    const next = () => {
        if (!isLast) setCurrentStep(prev => prev + 1)
    }

    const back = () => {
        if (!isFirst) setCurrentStep(prev => prev - 1)
    }

    const handleClose = () => {
        setCurrentStep(0)
        onOpenChange(false)
        onClose?.()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-2xl font-semibold text-white">
                            {title}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Step Indicator - Modern vertical steps */}
                    <div className="mt-6 flex items-center gap-2">
                        {steps.map((step, index) => (
                            <React.Fragment key={index}>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                                            index <= currentStep
                                                ? "bg-white text-blue-600 shadow-lg scale-110"
                                                : "bg-blue-500/30 text-white backdrop-blur-sm"
                                        )}
                                    >
                                        {index < currentStep ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <span className="text-sm font-semibold">
                                                {index + 1}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-xs font-medium",
                                            index <= currentStep ? "text-blue-100" : "text-blue-300"
                                        )}>
                                            Крок {index + 1}
                                        </span>
                                        <span className={cn(
                                            "text-sm font-semibold",
                                            index <= currentStep ? "text-white" : "text-blue-200"
                                        )}>
                                            {step.title}
                                        </span>
                                        {step.description && index === currentStep && (
                                            <span className="text-xs text-blue-200 mt-0.5">
                                                {step.description}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {index !== steps.length - 1 && (
                                    <ChevronRight className={cn(
                                        "w-5 h-5 mx-2",
                                        index < currentStep ? "text-white" : "text-blue-400"
                                    )} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 h-1.5 bg-blue-500/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step Content - Scrollable area */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                    <div className="max-w-2xl mx-auto">
                        {stepArray[currentStep]}
                    </div>
                </div>

                {/* Footer with modern buttons */}
                <div className="border-t bg-white px-8 py-4 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={back}
                        disabled={isFirst || isLoading}
                        className={cn(
                            "gap-2 px-4",
                            isFirst && "opacity-0 pointer-events-none"
                        )}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Назад
                    </Button>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            Крок {currentStep + 1} з {steps.length}
                        </span>

                        {!isLast ? (
                            <Button
                                onClick={next}
                                className="gap-2 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                            >
                                Далі
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={onSubmit}
                                disabled={isLoading}
                                className="gap-2 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Обробка...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Завершити
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}