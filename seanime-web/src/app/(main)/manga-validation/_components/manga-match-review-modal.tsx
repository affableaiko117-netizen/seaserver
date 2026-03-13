"use client"

import { useCorrectMangaMatch, useConvertMangaToSynthetic, type MangaMatchRecord } from "@/api/hooks/enmasse.hooks"
import { useAnilistListManga } from "@/api/hooks/manga.hooks"
import { AL_BaseManga } from "@/api/generated/types"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/components/ui/core/styling"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Modal } from "@/components/ui/modal"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TextInput } from "@/components/ui/text-input"
import React, { useState, useMemo, useCallback, useEffect } from "react"
import { BiCheck, BiSearch } from "react-icons/bi"
import Image from "next/image"

interface MangaMatchReviewModalProps {
    record: MangaMatchRecord | null
    onClose: () => void
    onSuccess: () => void
}

export function MangaMatchReviewModal({ record, onClose, onSuccess }: MangaMatchReviewModalProps) {
    const [selectedManga, setSelectedManga] = useState<AL_BaseManga | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [hasAutoSelectedManga, setHasAutoSelectedManga] = useState(false)

    const { mutate: correctMatch, isPending: isCorrecting } = useCorrectMangaMatch(() => {
        onSuccess()
        resetState()
    })
    const { mutate: convertToSynthetic, isPending: isConverting } = useConvertMangaToSynthetic(() => {
        onSuccess()
        resetState()
    })

    // Auto-search query: use the original title if no manga is selected yet
    const autoSearchQuery = useMemo(() => {
        if (selectedManga || hasAutoSelectedManga) return null
        return record?.originalTitle || null
    }, [selectedManga, hasAutoSelectedManga, record?.originalTitle])

    // Use either manual search query or auto-search query
    const effectiveSearchQuery = searchQuery || autoSearchQuery || ""

    const { data: searchResults, isLoading: isSearching } = useAnilistListManga({
        search: effectiveSearchQuery,
        page: 1,
        perPage: 20,
    }, !!effectiveSearchQuery && effectiveSearchQuery.length >= 2)

    // Auto-select the current match or first search result
    useEffect(() => {
        if (!record || hasAutoSelectedManga || selectedManga) return

        // If we have search results from the record, try to find the current match
        if (record.searchResults && record.searchResults.length > 0 && !record.isSynthetic) {
            const currentMatch = record.searchResults.find((r: any) => r.id === record.matchedId)
            if (currentMatch) {
                setSelectedManga(currentMatch as AL_BaseManga)
                setHasAutoSelectedManga(true)
                return
            }
        }

        // Otherwise auto-select first result from auto-search
        if (autoSearchQuery && searchResults?.Page?.media?.length) {
            const firstResult = searchResults.Page.media[0]
            if (firstResult) {
                setSelectedManga(firstResult as AL_BaseManga)
                setHasAutoSelectedManga(true)
            }
        }
    }, [record, autoSearchQuery, searchResults, selectedManga, hasAutoSelectedManga])

    const resetState = useCallback(() => {
        setSelectedManga(null)
        setSearchQuery("")
        setHasAutoSelectedManga(false)
    }, [])

    const handleClose = useCallback(() => {
        resetState()
        onClose()
    }, [onClose, resetState])

    const handleCorrectMatch = useCallback(() => {
        if (!record || !selectedManga) return
        correctMatch({
            providerId: record.providerId,
            newAnilistId: selectedManga.id,
        })
    }, [record, selectedManga, correctMatch])

    const handleConvertToSynthetic = () => {
        if (!record) return
        convertToSynthetic({
            providerId: record.providerId,
        })
    }

    if (!record) return null

    // Use search results from API if searching, otherwise use stored results
    const displayResults = searchResults?.Page?.media || record.searchResults || []

    return (
        <Modal
            open={!!record}
            onOpenChange={(open) => !open && handleClose()}
            contentClass="max-w-4xl"
            title="Review Manga Match"
        >
            <AppLayoutStack className="space-y-4">
                {/* Current Match Info Banner */}
                {selectedManga && (
                    <div className="p-3 border rounded-md bg-brand-900/20 flex items-center gap-3">
                        {selectedManga.coverImage?.medium && (
                            <Image
                                src={selectedManga.coverImage.medium}
                                alt={selectedManga.title?.romaji || ""}
                                width={40}
                                height={56}
                                className="rounded object-cover"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-[--muted]">Selected Match:</p>
                            <p className="font-semibold text-brand-200 line-clamp-1">
                                {selectedManga.title?.romaji || selectedManga.title?.english || selectedManga.title?.native}
                            </p>
                            {selectedManga.title?.english && selectedManga.title.english !== selectedManga.title?.romaji && (
                                <p className="text-xs text-[--muted] line-clamp-1">{selectedManga.title.english}</p>
                            )}
                        </div>
                        <Button
                            size="sm"
                            intent="gray-outline"
                            onClick={() => {
                                setSelectedManga(null)
                                setHasAutoSelectedManga(true)
                            }}
                        >
                            Change
                        </Button>
                    </div>
                )}

                {/* Original Title Info */}
                <div className="bg-[--subtle] rounded-lg p-3">
                    <p className="text-xs text-[--muted]">Original Title:</p>
                    <p className="font-semibold">{record.originalTitle}</p>
                    {!record.isSynthetic && (
                        <div className="mt-2">
                            <Badge 
                                intent={record.confidenceScore >= 0.8 ? "success" : record.confidenceScore >= 0.5 ? "warning" : "alert"}
                                size="sm"
                            >
                                Current: {(record.confidenceScore * 100).toFixed(0)}% match
                            </Badge>
                        </div>
                    )}
                    {record.isSynthetic && (
                        <Badge intent="gray" size="sm" className="mt-2">Currently Synthetic</Badge>
                    )}
                </div>

                {/* Manual Search */}
                <TextInput
                    leftIcon={<BiSearch />}
                    placeholder="Search for manga on AniList..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Search Results */}
                <ScrollArea className="h-[400px] border rounded-md">
                    {isSearching ? (
                        <div className="flex justify-center py-10">
                            <LoadingSpinner />
                        </div>
                    ) : displayResults && displayResults.length > 0 ? (
                        <div className="p-2 space-y-2">
                            {displayResults.map((manga: any) => (
                                <MangaSearchItem
                                    key={manga?.id}
                                    manga={manga as AL_BaseManga}
                                    selected={selectedManga?.id === manga?.id}
                                    onSelect={() => setSelectedManga(manga as AL_BaseManga)}
                                />
                            ))}
                        </div>
                    ) : effectiveSearchQuery.length >= 2 ? (
                        <div className="flex justify-center py-10 text-[--muted]">
                            No results found
                        </div>
                    ) : (
                        <div className="flex justify-center py-10 text-[--muted]">
                            Type at least 2 characters to search
                        </div>
                    )}
                </ScrollArea>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4">
                    <div>
                        {!record.isSynthetic && (
                            <Button
                                intent="warning-outline"
                                onClick={handleConvertToSynthetic}
                                loading={isConverting}
                            >
                                Convert to Synthetic
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button intent="gray-outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            intent="primary"
                            onClick={handleCorrectMatch}
                            disabled={!selectedManga || isCorrecting}
                            loading={isCorrecting}
                            leftIcon={<BiCheck />}
                        >
                            Confirm Match
                        </Button>
                    </div>
                </div>
            </AppLayoutStack>
        </Modal>
    )
}

function MangaSearchItem({ manga, selected, onSelect }: { manga: AL_BaseManga; selected: boolean; onSelect: () => void }) {
    return (
        <div
            className={cn(
                "flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-800/50",
                selected && "bg-brand-900/30 border border-brand-500"
            )}
            onClick={onSelect}
        >
            {manga.coverImage?.medium && (
                <Image
                    src={manga.coverImage.medium}
                    alt={manga.title?.romaji || ""}
                    width={50}
                    height={70}
                    className="rounded object-cover"
                />
            )}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">
                    {manga.title?.romaji || manga.title?.english || manga.title?.native}
                </p>
                {manga.title?.english && manga.title.english !== manga.title?.romaji && (
                    <p className="text-xs text-[--muted] line-clamp-1">
                        {manga.title.english}
                    </p>
                )}
                <p className="text-xs text-[--muted]">
                    {manga.format} • {manga.chapters ? `${manga.chapters} chapters` : "Unknown chapters"}
                </p>
            </div>
            {selected && <BiCheck className="text-2xl text-brand-200" />}
        </div>
    )
}
