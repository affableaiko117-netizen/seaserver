"use client"
import { CustomLibraryBanner } from "@/app/(main)/(library)/_containers/custom-library-banner"
import { MediaEntryCard } from "@/app/(main)/_features/media/_components/media-entry-card"
import { MediaEntryPageLoadingDisplay } from "@/app/(main)/_features/media/_components/media-entry-page-loading-display"
import { MangaLibraryHeader } from "@/app/(main)/manga/_components/library-header"
import { useHandleMangaCollection } from "@/app/(main)/manga/_lib/handle-manga-collection"
import { useGetMangaDownloadsList } from "@/api/hooks/manga_download.hooks"
import { MangaLibraryView } from "@/app/(main)/manga/_screens/manga-library-view"
import { MangaCarousel } from "@/app/(main)/(library)/_home/home-screen"
import { MangaHomeSettingsButton, MangaHomeSettingsModal, DEFAULT_MANGA_HOME_ITEMS } from "@/app/(main)/manga/_components/manga-home-settings"
import { useGetMangaHomeItems } from "@/api/hooks/status.hooks"
import { cn } from "@/components/ui/core/styling"
import { ThemeLibraryScreenBannerType, useThemeSettings } from "@/lib/theme/hooks"
import { __isDesktop__ } from "@/types/constants"
import React from "react"

export const dynamic = "force-static"

export default function Page() {
    const { data: mangaHomeItems } = useGetMangaHomeItems()
    const {
        mangaCollection,
        filteredMangaCollection,
        mangaCollectionLoading,
        storedFilters,
        storedProviders,
        mangaCollectionGenres,
        hasManga,
    } = useHandleMangaCollection()

    const ts = useThemeSettings()

    // Hero background image state (hover-driven)
    const [hoverImage, setHoverImage] = React.useState<string | null>(null)
    const activeHero = React.useMemo(() => hoverImage, [hoverImage])
    const [scrolled, setScrolled] = React.useState(false)

    React.useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 60)
        handler()
        window.addEventListener("scroll", handler)
        return () => window.removeEventListener("scroll", handler)
    }, [])

    const { data: downloadedList, isLoading: downloadsLoading, isError: downloadsError } = useGetMangaDownloadsList()
    const downloadedWithMedia = downloadedList?.filter(d => !!d.media) || []
    const downloadedChaptersTotal = downloadedList?.reduce((acc, d) => acc + Object.values(d.downloadData).flatMap(n => n).length, 0) || 0

    if (!mangaCollection || mangaCollectionLoading) return <MediaEntryPageLoadingDisplay />

    const homeItems = mangaHomeItems || DEFAULT_MANGA_HOME_ITEMS

    return (
        <div
            data-manga-page-container
            data-stored-filters={JSON.stringify(storedFilters)}
            data-stored-providers={JSON.stringify(storedProviders)}
        >
            {/* Dynamic blurred background hero */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div
                    className={cn(
                        "absolute inset-0 transition-opacity duration-500",
                        activeHero ? "opacity-100" : "opacity-0",
                    )}
                    style={{
                        backgroundImage: activeHero ? `url(${activeHero})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: "blur(22px) saturate(120%)",
                        transform: "scale(1.05)",
                    }}
                />
                <div
                    className={cn(
                        "absolute inset-0 bg-gradient-to-b from-black/85 via-black/90 to-black/95 transition-opacity duration-400",
                        scrolled ? "opacity-90" : "opacity-70",
                    )}
                />
            </div>

            <div className="relative z-[10] pt-16 md:pt-20 lg:pt-24">
                <div className="flex justify-end px-4 pt-4 sticky top-0 z-50 bg-transparent">
                    <MangaHomeSettingsButton />
                </div>

                {(
                    (!!ts.libraryScreenCustomBannerImage && ts.libraryScreenBannerType === ThemeLibraryScreenBannerType.Custom)
                ) && (
                    <>
                        <CustomLibraryBanner isLibraryScreen />
                        <div
                            data-manga-page-custom-banner-spacer
                            className={cn("h-14")}
                        ></div>
                    </>
                )}
                {ts.libraryScreenBannerType === ThemeLibraryScreenBannerType.Dynamic && (
                    <>
                        <MangaLibraryHeader manga={mangaCollection?.lists?.flatMap(l => l.entries)?.flatMap(e => e?.media)?.filter(Boolean) || []} />
                        <div
                            data-manga-page-dynamic-banner-spacer
                            className={cn(
                                !__isDesktop__ && "h-28",
                                (!__isDesktop__ && ts.hideTopNavbar) && "h-40",
                                __isDesktop__ && "h-40",
                            )}
                        ></div>
                    </>
                )}

                {/* Render manga home items based on settings */}
                {homeItems.map((item, index) => {
                    // Centered title
                    if (item.type === "centered-title") {
                        return (
                            <div key={item.id} className="px-4 py-8 text-center">
                                <h2 className="text-2xl font-bold text-white">{item.options?.text || "Title"}</h2>
                            </div>
                        )
                    }

                    // Manga Library
                    if (item.type === "manga-library") {
                        return (
                            <MangaLibraryView
                                key={item.id}
                                genres={mangaCollectionGenres}
                                collection={mangaCollection}
                                filteredCollection={filteredMangaCollection}
                                storedProviders={storedProviders}
                                hasManga={hasManga}
                                onHoverImage={setHoverImage}
                            />
                        )
                    }

                    // Manga Carousel
                    if (item.type === "manga-carousel") {
                        return (
                            <MangaCarousel
                                key={item.id}
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
                                onHoverImage={setHoverImage}
                            />
                        )
                    }

                    // My Lists
                    if (item.type === "my-lists") {
                        return (
                            <div key={item.id} className="px-4 py-8">
                                <h2 className="text-xl font-semibold text-white mb-4">My Lists</h2>
                                <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <p className="text-gray-400">My Lists - Coming Soon</p>
                                    <p className="text-sm text-gray-500 mt-2">Display media from your custom lists</p>
                                </div>
                            </div>
                        )
                    }

                    // Manga Continue Reading
                    if (item.type === "manga-continue-reading" || item.type === "manga-continue-reading-header") {
                        return (
                            <div key={item.id} className="px-4 py-8">
                                <h2 className="text-xl font-semibold text-white mb-4">Continue Reading</h2>
                                <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <p className="text-gray-400">Manga Continue Reading - Coming Soon</p>
                                    <p className="text-sm text-gray-500 mt-2">Display manga you're currently reading</p>
                                </div>
                            </div>
                        )
                    }

                    // Local Manga Library (downloads only)
                    if (item.type === "local-manga-library") {
                        return (
                            <div key={item.id} className="px-4 py-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-white">Local Downloads</h2>
                                    {downloadsLoading && <span className="text-sm text-[--muted]">Loading…</span>}
                                    {downloadsError && <span className="text-sm text-red-400">Failed to load downloads</span>}
                                </div>

                                {!downloadsLoading && !downloadsError && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {downloadedWithMedia.map(item => {
                                            const chapters = Object.values(item.downloadData).flatMap(n => n).length
                                            return (
                                                <MediaEntryCard
                                                    key={item.media?.id}
                                                    media={item.media!}
                                                    type="manga"
                                                    hideUnseenCountBadge
                                                    hideAnilistEntryEditButton
                                                    overlay={<p className="font-semibold text-white bg-gray-950 bg-opacity-90 absolute right-0 px-3 py-1 text-xs rounded-bl-lg">{chapters} chapter{chapters === 1 ? "" : "s"}</p>}
                                                    onHoverImage={setHoverImage}
                                                />
                                            )
                                        })}
                                    </div>
                                )}

                                {!downloadsLoading && !downloadsError && !downloadedWithMedia.length && (
                                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-sm text-gray-300">
                                        No downloaded series found. Use Manga Downloads to add offline chapters.
                                    </div>
                                )}
                            </div>
                        )
                    }

                    // Local Manga Library Stats (downloads only)
                    if (item.type === "local-manga-library-stats") {
                        const totalSeries = downloadedList?.length || 0
                        return (
                            <div key={item.id} className="px-4 py-8">
                                <h2 className="text-xl font-semibold text-white mb-4">Downloads Statistics</h2>
                                <div className="grid gap-4 md:grid-cols-3 bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-sm text-gray-100">
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400">Total Series</p>
                                        <p className="text-lg font-semibold">{totalSeries}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400">Total Chapters</p>
                                        <p className="text-lg font-semibold">{downloadedChaptersTotal}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400">With Metadata</p>
                                        <p className="text-lg font-semibold">{downloadedWithMedia.length}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    // Upcoming Chapters
                    if (item.type === "manga-upcoming-chapters") {
                        return (
                            <div key={item.id} className="px-4 py-8">
                                <h2 className="text-xl font-semibold text-white mb-4">Upcoming Chapters</h2>
                                <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <p className="text-gray-400">Upcoming Manga Chapters - Coming Soon</p>
                                    <p className="text-sm text-gray-500 mt-2">Display upcoming chapters from your library</p>
                                </div>
                            </div>
                        )
                    }

                    // Recently Released
                    if (item.type === "manga-aired-recently") {
                        return (
                            <div key={item.id} className="px-4 py-8">
                                <h2 className="text-xl font-semibold text-white mb-4">Recently Released</h2>
                                <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <p className="text-gray-400">Recently Released Manga - Coming Soon</p>
                                    <p className="text-sm text-gray-500 mt-2">Display recently released manga chapters</p>
                                </div>
                            </div>
                        )
                    }

                    // Missed Sequels
                    if (item.type === "manga-missed-sequels") {
                        return (
                            <div key={item.id} className="px-4 py-8">
                                <h2 className="text-xl font-semibold text-white mb-4">Missed Sequels</h2>
                                <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <p className="text-gray-400">Missed Manga Sequels - Coming Soon</p>
                                    <p className="text-sm text-gray-500 mt-2">Display sequels you might have missed</p>
                                </div>
                            </div>
                        )
                    }

                    // Schedule Calendar
                    if (item.type === "manga-schedule-calendar") {
                        return (
                            <div key={item.id} className="px-4 py-8">
                                <h2 className="text-xl font-semibold text-white mb-4">Release Calendar</h2>
                                <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <p className="text-gray-400">Manga Release Calendar - Coming Soon</p>
                                    <p className="text-sm text-gray-500 mt-2">Display manga release schedule</p>
                                </div>
                            </div>
                        )
                    }

                    // Discover Header
                    if (item.type === "manga-discover-header") {
                        return (
                            <div key={item.id} className="px-4 py-8">
                                <h2 className="text-xl font-semibold text-white mb-4">Discover Manga</h2>
                                <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <p className="text-gray-400">Manga Discover Header - Coming Soon</p>
                                    <p className="text-sm text-gray-500 mt-2">Display trending manga</p>
                                </div>
                            </div>
                        )
                    }

                    // Fallback for unknown types
                    return (
                        <div key={item.id} className="px-4 py-8">
                            <div className="text-center py-12 bg-red-900/20 rounded-lg border border-red-700">
                                <p className="text-red-400">Unknown item type: {item.type}</p>
                            </div>
                        </div>
                    )
                })}

                <MangaHomeSettingsModal />
            </div>
        </div>
    )
}
