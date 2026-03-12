"use client"

import { useMangaMatchHistory, useScanMangaCollection, useAutoMatchSyntheticManga, MangaMatchRecord } from "@/api/hooks/enmasse.hooks"
import { MangaMatchCard } from "@/app/(main)/manga-validation/_components/manga-match-card"
import { MangaMatchReviewModal } from "@/app/(main)/manga-validation/_components/manga-match-review-modal"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { atom, useAtom } from "jotai"
import React from "react"
import { LuClipboardCheck } from "react-icons/lu"

export const selectedMangaMatchRecordAtom = atom<MangaMatchRecord | null>(null)

export function MangaValidationPage() {
    const { data: matchHistory, isLoading, refetch, error, isError, isFetching } = useMangaMatchHistory()
    const [selectedRecord, setSelectedRecord] = useAtom(selectedMangaMatchRecordAtom)
    const { mutate: scanCollection, isPending: isScanning } = useScanMangaCollection()
    const { mutate: autoMatchSynthetic, isPending: isAutoMatching } = useAutoMatchSyntheticManga()

    if (isLoading || isFetching) {
        return (
            <PageWrapper className="p-4 sm:p-8 space-y-4">
                <div className="flex items-center gap-3">
                    <LuClipboardCheck className="text-3xl text-brand-200" />
                    <h2 className="text-2xl font-bold">Manga Validation</h2>
                </div>
                <div className="flex justify-center py-10">
                    <LoadingSpinner />
                </div>
            </PageWrapper>
        )
    }

    const handleRetry = () => {
        refetch()
    }

    const hasRecords = matchHistory && matchHistory.length > 0

    return (
        <PageWrapper className="p-4 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <LuClipboardCheck className="text-3xl text-brand-200" />
                    <h2 className="text-2xl font-bold">Manga Validation</h2>
                </div>
                <div className="flex gap-2">
                    <Button
                        intent="primary-outline"
                        onClick={() => scanCollection()}
                        loading={isScanning}
                    >
                        Scan Collection
                    </Button>
                    <Button
                        intent="primary"
                        onClick={() => autoMatchSynthetic()}
                        loading={isAutoMatching}
                    >
                        Auto-Match Synthetic
                    </Button>
                </div>
            </div>

            <p className="text-[--muted]">
                Downloaded manga that may need validation. Review matches and correct any that are incorrect.
            </p>

            {isError && (
                <div className="flex flex-col gap-3 border rounded-md p-4 bg-amber-950/40 text-amber-100">
                    <p className="font-semibold">Failed to load manga matches.</p>
                    <p className="text-sm opacity-80">{String((error as Error)?.message || "Unknown error")}</p>
                    <div>
                        <Button intent="primary" size="sm" onClick={handleRetry}>Retry</Button>
                    </div>
                </div>
            )}

            {!isError && !hasRecords ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <LuClipboardCheck className="text-6xl text-[--muted] mb-4" />
                    <p className="text-lg text-[--muted]">No manga matches found</p>
                    <p className="text-sm text-[--muted]">
                        Click "Scan Collection" to validate your existing manga library
                    </p>
                </div>
            ) : (!isError && hasRecords ? (
                <AppLayoutStack>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {matchHistory.map((record) => (
                            <MangaMatchCard
                                key={record.providerId}
                                record={record}
                                onSelect={() => setSelectedRecord(record)}
                            />
                        ))}
                    </div>
                </AppLayoutStack>
            ) : null)}

            <MangaMatchReviewModal
                record={selectedRecord}
                onClose={() => setSelectedRecord(null)}
                onSuccess={() => {
                    setSelectedRecord(null)
                    refetch()
                }}
            />
        </PageWrapper>
    )
}
