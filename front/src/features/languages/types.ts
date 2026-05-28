export interface Language {
    id: number;
    name: string;
    slug: string;
}

export interface LanguagePair {
    id: number;
    source_language: number;
    target_language: number;
    pair_name: string;
}

export interface LanguageListResponse {
    count: number       // загальна кількість (було total — не те)
    next: string | null
    previous: string | null
    results: Language[]
}