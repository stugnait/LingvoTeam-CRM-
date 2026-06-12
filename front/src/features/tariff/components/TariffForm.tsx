// TariffForm.tsx (фрагмент)
import { Plus } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"
import type {TariffsFormData} from "@/src/features/tariff/types";
import type {LanguagePair} from "@/src/features/orders/types";
import type { Language } from "@/src/features/orders/types"  // ← виправити імпорт
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface NewPairForm {
    source_language: number
    target_language: number
}

interface TariffFormProps {
    form: TariffsFormData
    setForm: React.Dispatch<React.SetStateAction<TariffsFormData>>
    errors: Partial<Record<keyof TariffsFormData, string>>
    languages: Language[]
    languagePairs: LanguagePair[]
    isNewPairModalOpen: boolean
    setIsNewPairModalOpen: (open: boolean) => void
    newPairForm: NewPairForm
    setNewPairForm: React.Dispatch<React.SetStateAction<NewPairForm>>
    newPairLoading: boolean
    createAndSelectPair: () => Promise<void>
}

export function TariffForm({
                               form,
                               setForm,
                               errors,
                               languages = [],
                               languagePairs = [],
                               isNewPairModalOpen,
                               setIsNewPairModalOpen,
                               newPairForm,
                               setNewPairForm,
                           newPairLoading,
                           createAndSelectPair,
                           }: TariffFormProps) {
    const { t } = useI18n()

    return (
        <>
            {/* Вибір існуючої мовної пари */}
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="text-sm font-medium">{t("common.languagePair")}</label>
                    <Select
                        value={form.language_pair_id ? String(form.language_pair_id) : ""}
                        onValueChange={(val) => {
                            setForm(prev => ({
                                ...prev,
                                language_pair_id: Number(val),
                            }))
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t("common.chooseLanguagePair")} />
                        </SelectTrigger>
                        <SelectContent searchable searchPlaceholder={t("common.searchLanguagePair")}>
                            {languagePairs.map(pair => (
                                <SelectItem key={pair.id} value={String(pair.id)}>
                                    {pair.pair_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.source_language && (
                        <p className="text-xs text-destructive mt-1">{errors.source_language}</p>
                    )}
                </div>

                {/* Кнопка створення нової пари */}
                <button
                    type="button"
                    onClick={() => setIsNewPairModalOpen(true)}
                    className="mb-0.5 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed
                               border-border hover:border-primary hover:text-primary
                               text-sm text-muted-foreground transition-all duration-200"
                >
                    <Plus className="h-4 w-4" />
                    {t("translators.newLanguagePair")}
                </button>
            </div>

            {/* Модал створення нової мовної пари */}
            {isNewPairModalOpen && (
                <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-background rounded-2xl border shadow-2xl p-6 w-full max-w-sm space-y-4">
                        <h3 className="text-lg font-semibold">{t("translators.newLanguagePair")}</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">{t("common.sourceLanguage")}</label>
                                <Select
                                    value={newPairForm.source_language ? String(newPairForm.source_language) : ""}
                                    onValueChange={(val) =>
                                        setNewPairForm(prev => ({ ...prev, source_language: Number(val) }))  // ← прибрати _id
                                    }
                                >
                                    <SelectTrigger><SelectValue placeholder={t("common.chooseLanguage")} /></SelectTrigger>
                                    <SelectContent searchable searchPlaceholder={t("common.searchLanguage")}>
                                        {languages.map(l => (
                                            <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">{t("common.targetLanguage")}</label>
                                <Select
                                    value={newPairForm.target_language ? String(newPairForm.target_language) : ""}
                                    onValueChange={(val) =>
                                        setNewPairForm(prev => ({ ...prev, target_language: Number(val) }))  // ← прибрати _id
                                    }
                                >
                                    <SelectTrigger><SelectValue placeholder={t("common.chooseLanguage")} /></SelectTrigger>
                                    <SelectContent searchable searchPlaceholder={t("common.searchLanguage")}>
                                        {languages
                                            .filter(l => l.id !== newPairForm.source_language)
                                            .map(l => (
                                                <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setIsNewPairModalOpen(false)}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl border text-sm hover:bg-accent/10 transition-all"
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                type="button"
                                onClick={createAndSelectPair}
                                disabled={newPairLoading}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm
                                           hover:bg-primary/90 disabled:opacity-50 transition-all"
                            >
                                {newPairLoading ? t("tariffs.creating") : t("tariffs.createAndSelect")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
