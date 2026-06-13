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
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface StepConfig {
    title: string
    description?: string
    icon?: React.ReactNode
}

interface WizardModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void

    step: number
    onStepChange: (step: number) => void
    title: string

    steps: StepConfig[]
    onSubmit: () => void
    children: React.ReactNode
    isLoading?: boolean
    onClose?: (open: boolean) => void
    stepValidation?: (step: number) => boolean
    stepError?: (step: number) => string | null
}

export function WizardModal({
                                open,
                                onOpenChange,
                                title,
                                step,
                                onStepChange,
                                steps,
                                onSubmit,
                                children,
                                isLoading,
                                onClose,
                                stepValidation,
                                stepError
                            }: WizardModalProps) {
    const { t } = useI18n()

    // Ми більше не тримаємо внутрішній стейт currentStep,
    // а використовуємо пропси `step` та `onStepChange`, які приходять зверху (контрольований компонент).
    const currentStep = step;
    const setCurrentStep = onStepChange;

    const stepArray = React.Children.toArray(children)

    const isLast = currentStep === stepArray.length - 1
    const isFirst = currentStep === 0

    const isStepValid = stepValidation ? stepValidation(currentStep) : true

    const next = () => {
        if (!isLast && isStepValid) {setCurrentStep(currentStep + 1)}
    }

    const back = () => {
        if (!isFirst) {setCurrentStep(currentStep - 1)}
    }

    const handleClose = () => {
        setCurrentStep(0)
        onOpenChange(false)
        onClose?.(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[calc(100vw-16px)] sm:w-auto sm:max-w-3xl max-h-[95svh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0 sm:p-0 gap-0">
                {/* Header with gradient background - compact version */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-base sm:text-xl font-semibold text-white">
                            {title}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Step Indicator - Compact horizontal steps, scrollable on mobile */}
                    <div className="mt-2 sm:mt-3 flex items-center overflow-x-auto scrollbar-none gap-0">
                        {steps.map((stepConfig, index) => (
                            <React.Fragment key={index}>
                                <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                    <div
                                        className={cn(
                                            "relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-all duration-300 text-xs",
                                            index <= currentStep
                                                ? "bg-white text-blue-600 shadow-sm"
                                                : "bg-blue-500/30 text-white backdrop-blur-sm"
                                        )}
                                    >
                                        {index < currentStep ? (
                                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        ) : (
                                            <span className="text-xs font-medium">
                                                {index + 1}
                                            </span>
                                        )}
                                    </div>

                                    <span className={cn(
                                        "text-[11px] sm:text-xs font-medium whitespace-nowrap",
                                        index <= currentStep ? "text-white" : "text-blue-200"
                                    )}>
                                        {stepConfig.title}
                                    </span>
                                </div>

                                {index !== steps.length - 1 && (
                                    <ChevronRight className={cn(
                                        "w-3 h-3 sm:w-3.5 sm:h-3.5 mx-1 sm:mx-1.5 flex-shrink-0",
                                        index < currentStep ? "text-white" : "text-blue-400"
                                    )} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Compact progress bar */}
                    <div className="mt-2 sm:mt-3 h-1 bg-blue-500/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step Content - Scrollable area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
                    <div className="max-w-2xl mx-auto">
                        {stepArray[currentStep]}
                    </div>
                </div>

                {/* Footer with modern buttons */}
                <div className="border-t bg-white px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
                    <Button
                        variant="ghost"
                        onClick={back}
                        disabled={isFirst || isLoading}
                        size="sm"
                        className={cn(
                            "gap-1.5 px-2 sm:px-3",
                            isFirst && "opacity-0 pointer-events-none"
                        )}
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline sm:inline">{t("common.back")}</span>
                    </Button>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Помилка показується завжди поруч з кнопкою */}
                        {stepError && stepError(currentStep) && (
                            <span className="text-xs text-red-500 hidden sm:inline">{stepError(currentStep)}</span>
                        )}

                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            {t("wizard.stepProgress", { current: currentStep + 1, total: steps.length })}
                        </span>

                        {!isLast ? (
                            <Button
                                onClick={next}
                                size="sm"
                                disabled={!isStepValid}
                                className="gap-1 sm:gap-1.5 px-3 sm:px-4 bg-gradient-to-r from-blue-600 to-blue-700
                       hover:from-blue-700 hover:to-blue-800
                       disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t("common.next")}
                                <ChevronRight className="w-3.5 h-3.5"/>
                            </Button>
                        ) : (
                            <Button
                                onClick={onSubmit}
                                disabled={isLoading}
                                size="sm"
                                className="gap-1 sm:gap-1.5 px-3 sm:px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin"/>
                                        <span className="hidden sm:inline">{t("common.processing")}</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-3.5 h-3.5"/>
                                        {t("common.finish")}
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
