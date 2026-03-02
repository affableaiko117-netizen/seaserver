import { useServerMutation, useServerQuery } from "@/api/client/requests"

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Synthetic Anime Types
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface SyntheticAnime {
    id: number
    syntheticId: number
    title: string
    titleEnglish: string
    coverImage: string
    thumbnail: string
    type: string // TV, MOVIE, OVA, ONA, SPECIAL
    episodes: number
    status: string // FINISHED, ONGOING, UPCOMING
    season: string // SPRING, SUMMER, FALL, WINTER
    seasonYear: number
    description: string
    synonyms: string // JSON array
    tags: string // JSON array
    studios: string // JSON array
    sources: string // JSON array
    anilistId: number
    malId: number
}

export interface GlobalEnMasseDownloaderStatus {
    isRunning: boolean
    isPaused: boolean
    currentAnime: string
    currentAnimeId: number
    processedCount: number
    totalCount: number
    downloadedAnime: string[]
    failedAnime: string[]
    status: string
    hasSavedProgress: boolean
    databaseCount: number
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Synthetic Anime Endpoints
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const SYNTHETIC_ANIME_ENDPOINTS = {
    Search: {
        key: "synthetic-anime-search",
        endpoint: "/api/v1/anime/synthetic/search",
        methods: ["POST"] as const,
    },
    GetDetails: {
        key: "synthetic-anime-details",
        endpoint: "/api/v1/anime/synthetic",
        methods: ["GET"] as const,
    },
    GetAll: {
        key: "synthetic-anime-all",
        endpoint: "/api/v1/anime/synthetic/all",
        methods: ["GET"] as const,
    },
}

const GLOBAL_ENMASSE_ENDPOINTS = {
    GetStatus: {
        key: "global-enmasse-status",
        endpoint: "/api/v1/enmasse/global/status",
        methods: ["GET"] as const,
    },
    Start: {
        key: "global-enmasse-start",
        endpoint: "/api/v1/enmasse/global/start",
        methods: ["POST"] as const,
    },
    Stop: {
        key: "global-enmasse-stop",
        endpoint: "/api/v1/enmasse/global/stop",
        methods: ["POST"] as const,
    },
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Synthetic Anime Hooks
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useSearchSyntheticAnime(query: string, enabled: boolean = true) {
    return useServerQuery<SyntheticAnime[], { query: string; limit: number }>({
        endpoint: SYNTHETIC_ANIME_ENDPOINTS.Search.endpoint,
        method: SYNTHETIC_ANIME_ENDPOINTS.Search.methods[0],
        queryKey: [SYNTHETIC_ANIME_ENDPOINTS.Search.key, query],
        data: { query, limit: 20 },
        enabled: enabled && query.length >= 2,
    })
}

export function useGetSyntheticAnimeDetails(id: number | string | null | undefined) {
    return useServerQuery<SyntheticAnime>({
        endpoint: `${SYNTHETIC_ANIME_ENDPOINTS.GetDetails.endpoint}/${id}`,
        method: SYNTHETIC_ANIME_ENDPOINTS.GetDetails.methods[0],
        queryKey: [SYNTHETIC_ANIME_ENDPOINTS.GetDetails.key, String(id)],
        enabled: !!id && Number(id) < 0, // Only enabled for synthetic IDs (negative)
    })
}

export function useGetAllSyntheticAnime() {
    return useServerQuery<SyntheticAnime[]>({
        endpoint: SYNTHETIC_ANIME_ENDPOINTS.GetAll.endpoint,
        method: SYNTHETIC_ANIME_ENDPOINTS.GetAll.methods[0],
        queryKey: [SYNTHETIC_ANIME_ENDPOINTS.GetAll.key],
        enabled: true,
    })
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Global En Masse Downloader Hooks
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useGetGlobalEnMasseStatus() {
    return useServerQuery<GlobalEnMasseDownloaderStatus>({
        endpoint: GLOBAL_ENMASSE_ENDPOINTS.GetStatus.endpoint,
        method: GLOBAL_ENMASSE_ENDPOINTS.GetStatus.methods[0],
        queryKey: [GLOBAL_ENMASSE_ENDPOINTS.GetStatus.key],
        enabled: true,
        refetchInterval: 2000, // Poll every 2 seconds when active
    })
}

export function useStartGlobalEnMasse() {
    return useServerMutation<boolean, { resume: boolean }>({
        endpoint: GLOBAL_ENMASSE_ENDPOINTS.Start.endpoint,
        method: GLOBAL_ENMASSE_ENDPOINTS.Start.methods[0],
        mutationKey: [GLOBAL_ENMASSE_ENDPOINTS.Start.key],
    })
}

export function useStopGlobalEnMasse() {
    return useServerMutation<boolean, { saveProgress: boolean }>({
        endpoint: GLOBAL_ENMASSE_ENDPOINTS.Stop.endpoint,
        method: GLOBAL_ENMASSE_ENDPOINTS.Stop.methods[0],
        mutationKey: [GLOBAL_ENMASSE_ENDPOINTS.Stop.key],
    })
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Helper functions
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function parseSyntheticAnimeArray(jsonString: string): string[] {
    try {
        const parsed = JSON.parse(jsonString)
        if (Array.isArray(parsed)) {
            return parsed.filter((item): item is string => typeof item === "string")
        }
        return []
    } catch {
        return []
    }
}

export function getSyntheticAnimeSynonyms(anime: SyntheticAnime): string[] {
    return parseSyntheticAnimeArray(anime.synonyms)
}

export function getSyntheticAnimeTags(anime: SyntheticAnime): string[] {
    return parseSyntheticAnimeArray(anime.tags)
}

export function getSyntheticAnimeStudios(anime: SyntheticAnime): string[] {
    return parseSyntheticAnimeArray(anime.studios)
}

export function getSyntheticAnimeSources(anime: SyntheticAnime): string[] {
    return parseSyntheticAnimeArray(anime.sources)
}
