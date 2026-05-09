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
    stepValidation?: (step: number) => boolean
    stepError?: (step: number) => string | null
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
                                stepValidation,
    stepError
                            }: WizardModalProps) {

    const [currentStep, setCurrentStep] = React.useState(0)

    const stepArray = React.Children.toArray(children)

    const isLast = currentStep === stepArray.length - 1
    const isFirst = currentStep === 0

    const isStepValid = stepValidation ? stepValidation(currentStep) : true

    const next = () => {
        if (!isLast && isStepValid) setCurrentStep(prev => prev + 1)
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
                {/* Header with gradient background - compact version */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-xl font-semibold text-white">
                            {title}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Step Indicator - Compact horizontal steps */}
                    <div className="mt-3 flex items-center">
                        {steps.map((step, index) => (
                            <React.Fragment key={index}>
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className={cn(
                                            "relative flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300 text-xs",
                                            index <= currentStep
                                                ? "bg-white text-blue-600 shadow-sm"
                                                : "bg-blue-500/30 text-white backdrop-blur-sm"
                                        )}
                                    >
                                        {index < currentStep ? (
                                            <Check className="w-3.5 h-3.5" />
                                        ) : (
                                            <span className="text-xs font-medium">
                                                {index + 1}
                                            </span>
                                        )}
                                    </div>

                                    <span className={cn(
                                        "text-xs font-medium",
                                        index <= currentStep ? "text-white" : "text-blue-200"
                                    )}>
                                        {step.title}
                                    </span>
                                </div>

                                {index !== steps.length - 1 && (
                                    <ChevronRight className={cn(
                                        "w-3.5 h-3.5 mx-1.5",
                                        index < currentStep ? "text-white" : "text-blue-400"
                                    )} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Compact progress bar */}
                    <div className="mt-3 h-1 bg-blue-500/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step Content - Scrollable area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="max-w-2xl mx-auto">
                        {stepArray[currentStep]}
                    </div>
                </div>

                {/* Footer with modern buttons */}
                <div className="border-t bg-white px-6 py-3 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={back}
                        disabled={isFirst || isLoading}
                        size="sm"
                        className={cn(
                            "gap-1.5 px-3",
                            isFirst && "opacity-0 pointer-events-none"
                        )}
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Назад
                    </Button>

                    <div className="flex items-center gap-3">
                        {/* Помилка показується завжди поруч з кнопкою */}
                        {stepError && (
                            <span className="text-xs text-red-500">{stepError}</span>
                        )}

                        <span className="text-xs text-gray-500">
        Крок {currentStep + 1} з {steps.length}
    </span>

                        {!isLast ? (
                            <Button
                                onClick={next}
                                size="sm"
                                disabled={!isStepValid}
                                className="gap-1.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700
                       hover:from-blue-700 hover:to-blue-800
                       disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Далі
                                <ChevronRight className="w-3.5 h-3.5"/>
                            </Button>
                        ) : (
                            <Button
                                onClick={onSubmit}
                                disabled={isLoading}
                                size="sm"
                                className="gap-1.5 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin"/>
                                        Обробка...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-3.5 h-3.5"/>
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