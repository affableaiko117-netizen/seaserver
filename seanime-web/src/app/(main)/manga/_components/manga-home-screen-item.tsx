import { Models_HomeItem } from "@/api/generated/types"
import { useHandleMangaCollection } from "@/app/(main)/manga/_lib/handle-manga-collection"
import { MangaCarousel } from "@/app/(main)/(library)/_home/home-screen"
import { MangaLibrary } from "@/app/(main)/(library)/_home/home-screen"
import { ComingSoonPlaceholder } from "@/app/(main)/(library)/_home/home-screen"
import { PageWrapper } from "@/components/shared/page-wrapper"
import React from "react"

export type MangaHomeScreenItemProps = {
    item: Models_HomeItem
    index: number
}

export function MangaHomeScreenItem(props: MangaHomeScreenItemProps) {
    const { item: _item, index } = props
    const mangaCollectionProps = useHandleMangaCollection()

    const item = React.useMemo(() => {
        if (!_item) return _item
        if (!_item.schemaVersion || _item.schemaVersion < 1) {
            return {
                ..._item,
                schemaVersion: 1,
                options: undefined,
            }
        }
        return _item
    }, [_item])

    if (item.type === "centered-title") {
        return (
            <PageWrapper className="space-y-0 px-4">
                <h2 className="text-2xl font-bold text-center">{item.options?.text || "Title"}</h2>
            </PageWrapper>
        )
    }

    if (item.type === "manga-continue-reading") {
        return <ComingSoonPlaceholder title="Manga Continue Reading" />
    }

    if (item.type === "manga-continue-reading-header") {
        return <ComingSoonPlaceholder title="Manga Continue Reading Header" />
    }

    if (item.type === "manga-library") {
        return (
            <>
                <MangaLibrary 
                    libraryCollectionProps={{
                        libraryGenres: [],
                        isLoading: false,
                        libraryCollectionList: [],
                        filteredLibraryCollectionList: [],
                        continueWatchingList: [],
                        unmatchedLocalFiles: [],
                        ignoredLocalFiles: [],
                        unmatchedGroups: [],
                        unknownGroups: [],
                        streamingMediaIds: [],
                        hasEntries: false,
                        isStreamingOnly: false,
                        isNakamaLibrary: false,
                    }} 
                    item={item} 
                    index={index} 
                />
            </>
        )
    }

    if (item.type === "manga-carousel") {
        return (
            <>
                <MangaCarousel 
                    libraryCollectionProps={{
                        libraryGenres: [],
                        isLoading: false,
                        libraryCollectionList: [],
                        filteredLibraryCollectionList: [],
                        continueWatchingList: [],
                        unmatchedLocalFiles: [],
                        ignoredLocalFiles: [],
                        unmatchedGroups: [],
                        unknownGroups: [],
                        streamingMediaIds: [],
                        hasEntries: false,
                        isStreamingOnly: false,
                        isNakamaLibrary: false,
                    }} 
                    item={item} 
                />
            </>
        )
    }

    if (item.type === "local-manga-library") {
        return (
            <PageWrapper className="space-y-3 px-4 py-6">
                <h2 className="text-xl font-semibold text-white">Local Manga Library</h2>
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-sm text-gray-300">
                    Local manga library is not available in this build. Remove this item from settings or use cloud/Anilist manga sources.
                </div>
            </PageWrapper>
        )
    }

    if (item.type === "local-manga-library-stats") {
        return (
            <PageWrapper className="space-y-3 px-4 py-6">
                <h2 className="text-xl font-semibold text-white">Local Manga Library Stats</h2>
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-sm text-gray-300">
                    Statistics for a local manga library aren’t supported here. Remove this item from settings to hide this section.
                </div>
            </PageWrapper>
        )
    }

    if (item.type === "manga-upcoming-chapters") {
        return <ComingSoonPlaceholder title="Upcoming Manga Chapters" />
    }

    if (item.type === "manga-aired-recently") {
        return <ComingSoonPlaceholder title="Recently Released (Manga)" />
    }

    if (item.type === "manga-missed-sequels") {
        return <ComingSoonPlaceholder title="Missed Manga Sequels" />
    }

    if (item.type === "manga-schedule-calendar") {
        return <ComingSoonPlaceholder title="Manga Release Calendar" />
    }

    if (item.type === "manga-discover-header") {
        return <ComingSoonPlaceholder title="Manga Discover Header" />
    }

    if (item.type === "my-lists") {
        return <ComingSoonPlaceholder title="My Lists" />
    }

    return <div>
        Item not found ({item.type})
    </div>
}
