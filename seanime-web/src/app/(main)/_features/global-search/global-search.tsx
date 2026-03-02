"use client"
import { useAnilistListAnime } from "@/api/hooks/anilist.hooks"
import { useAnilistListManga, useSearchSyntheticManga } from "@/api/hooks/manga.hooks"
import { useSearchSyntheticAnime, SyntheticAnime } from "@/api/hooks/synthetic-anime.hooks"
import { SeaImage } from "@/components/shared/sea-image"
import { SeaLink } from "@/components/shared/sea-link"
import { Button } from "@/components/ui/button"
import { cn } from "@/components/ui/core/styling"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Select } from "@/components/ui/select"
import { useDebounce } from "@/hooks/use-debounce"
import { Combobox, Dialog, Transition } from "@headlessui/react"
import { atom } from "jotai"
import { useAtom } from "jotai/react"
import capitalize from "lodash/capitalize"
import { useRouter } from "next/navigation"
import React, { Fragment, useEffect, useRef } from "react"
import { BiChevronRight } from "react-icons/bi"
import { FiSearch } from "react-icons/fi"
import { LuSparkles } from "react-icons/lu"
import { Badge } from "@/components/ui/badge"

export const __globalSearch_isOpenAtom = atom(false)

export function GlobalSearch() {

    const [inputValue, setInputValue] = React.useState("")
    const debouncedQuery = useDebounce(inputValue, 500)
    const inputRef = useRef<HTMLInputElement>(null)

    const [type, setType] = React.useState<string>("anime")

    const router = useRouter()

    const [open, setOpen] = useAtom(__globalSearch_isOpenAtom)

    useEffect(() => {
        if(open) {
            setTimeout(() => {
                console.log("open", open, inputRef.current)
                console.log("focusing")
                inputRef.current?.focus()
            }, 300)
        }
    }, [open])

    const { data: animeData, isLoading: animeIsLoading, isFetching: animeIsFetching } = useAnilistListAnime({
        search: debouncedQuery,
        page: 1,
        perPage: 10,
        status: ["FINISHED", "CANCELLED", "NOT_YET_RELEASED", "RELEASING"],
        sort: ["SEARCH_MATCH"],
    }, debouncedQuery.length > 0 && type === "anime")

    const { data: mangaData, isLoading: mangaIsLoading, isFetching: mangaIsFetching } = useAnilistListManga({
        search: debouncedQuery,
        page: 1,
        perPage: 10,
        status: ["FINISHED", "CANCELLED", "NOT_YET_RELEASED", "RELEASING"],
        sort: ["SEARCH_MATCH"],
    }, debouncedQuery.length > 0 && type === "manga")

    // Search synthetic manga
    const { data: syntheticMangaData, isLoading: syntheticMangaIsLoading, isFetching: syntheticMangaIsFetching } = useSearchSyntheticManga(
        debouncedQuery,
        debouncedQuery.length >= 2 && type === "synthetic-manga"
    )

    // Search synthetic anime
    const { data: syntheticAnimeData, isLoading: syntheticAnimeIsLoading, isFetching: syntheticAnimeIsFetching } = useSearchSyntheticAnime(
        debouncedQuery,
        debouncedQuery.length >= 2 && (type === "anime" || type === "synthetic-anime")
    )

    const isLoading = type === "anime" ? (animeIsLoading || syntheticAnimeIsLoading) 
        : type === "manga" ? mangaIsLoading 
        : type === "synthetic-manga" ? syntheticMangaIsLoading 
        : type === "synthetic-anime" ? syntheticAnimeIsLoading 
        : false
    const isFetching = type === "anime" ? (animeIsFetching || syntheticAnimeIsFetching) 
        : type === "manga" ? mangaIsFetching 
        : type === "synthetic-manga" ? syntheticMangaIsFetching 
        : type === "synthetic-anime" ? syntheticAnimeIsFetching 
        : false

    // Unified result type for mixed anime results
    type MixedAnimeResult = {
        type: "anilist" | "synthetic"
        id: number
        title: string
        coverImage: string | undefined
        format?: string
        season?: string
        seasonYear?: number
        episodes?: number
        syntheticData?: SyntheticAnime
        anilistData?: any
    }

    const media = React.useMemo(() => {
        if (type === "manga") return mangaData?.Page?.media?.filter(Boolean)
        return null // Anime handled separately with mixed results
    }, [mangaData, type])

    // Mixed anime results (AniList + Synthetic)
    const mixedAnimeResults = React.useMemo((): MixedAnimeResult[] => {
        if (type !== "anime") return []
        
        const results: MixedAnimeResult[] = []
        
        // Add AniList results
        if (animeData?.Page?.media) {
            for (const item of animeData.Page.media.filter(Boolean)) {
                results.push({
                    type: "anilist",
                    id: item.id,
                    title: item.title?.userPreferred || "",
                    coverImage: item.coverImage?.medium,
                    format: item.format,
                    season: item.season,
                    seasonYear: item.seasonYear,
                    episodes: item.episodes,
                    anilistData: item,
                })
            }
        }
        
        // Add Synthetic anime results (that don't have AniList IDs or aren't in AniList results)
        if (syntheticAnimeData) {
            const anilistIds = new Set(results.map(r => r.id))
            for (const item of syntheticAnimeData) {
                // Skip if this synthetic anime has an AniList ID that's already in results
                if (item.anilistId > 0 && anilistIds.has(item.anilistId)) continue
                
                results.push({
                    type: "synthetic",
                    id: item.syntheticId,
                    title: item.title,
                    coverImage: item.coverImage || item.thumbnail,
                    format: item.type,
                    season: item.season,
                    seasonYear: item.seasonYear,
                    episodes: item.episodes,
                    syntheticData: item,
                })
            }
        }
        
        return results
    }, [animeData, syntheticAnimeData, type])

    return (
        <>
            <Transition.Root show={open} as={Fragment} afterLeave={() => setInputValue("")} appear>
                <Dialog as="div" className="relative z-50" onClose={setOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-70 transition-opacity backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className="mx-auto max-w-3xl transform space-y-4 transition-all"
                            >
                                <div className="absolute right-2 -top-7 z-10">
                                    <SeaLink
                                        href="/search"
                                        className="text-[--muted] hover:text-[--foreground] font-bold"
                                        onClick={() => setOpen(false)}
                                    >
                                        Advanced search &rarr;
                                    </SeaLink>
                                </div>
                                <Combobox>
                                    {({ activeOption }: any) => (
                                        <>
                                            <div
                                                className="relative border bg-gray-950 shadow-2xl ring-1 ring-black ring-opacity-5 w-full rounded-xl"
                                            >
                                                <FiSearch
                                                    className="pointer-events-none absolute top-4 left-4 h-6 w-6 text-[--muted]"
                                                    aria-hidden="true"
                                                />
                                                <Combobox.Input
                                                    ref={inputRef}
                                                    className="h-14 w-full border-0 bg-transparent pl-14 pr-4 text-white placeholder-[--muted] focus:ring-0 sm:text-md"
                                                    placeholder="Search..."
                                                    onChange={(event) => setInputValue(event.target.value)}
                                                />
                                                <div className="block fixed lg:absolute top-2 right-2 z-1">
                                                    <Select
                                                        fieldClass="w-fit"
                                                        value={type}
                                                        onValueChange={(value) => setType(value)}
                                                        options={[
                                                            { value: "anime", label: "Anime" },
                                                            { value: "manga", label: "Manga" },
                                                            { value: "synthetic-anime", label: "Synthetic Anime" },
                                                            { value: "synthetic-manga", label: "Synthetic Manga" },
                                                        ]}
                                                    />
                                                </div>
                                            </div>

                                            {/* Mixed Anime results (AniList + Synthetic) */}
                                            {type === "anime" && mixedAnimeResults.length > 0 && (
                                                <Combobox.Options
                                                    as="div" static hold
                                                    className="flex divide-[--border] bg-gray-950 shadow-2xl ring-1 ring-black ring-opacity-5 rounded-xl border"
                                                >
                                                    <div
                                                        className={cn(
                                                            "max-h-96 min-w-0 flex-auto scroll-py-2 overflow-y-auto px-6 py-2 my-2",
                                                            { "sm:h-96": activeOption },
                                                        )}
                                                    >
                                                        <div className="-mx-2 text-sm text-[--foreground]">
                                                            {mixedAnimeResults.map((item) => (
                                                                <Combobox.Option
                                                                    as="div"
                                                                    key={`${item.type}-${item.id}`}
                                                                    value={item}
                                                                    onClick={() => {
                                                                        if (item.type === "synthetic") {
                                                                            router.push(`/entry?id=${item.id}&synthetic=true`)
                                                                        } else {
                                                                            router.push(`/entry?id=${item.id}`)
                                                                        }
                                                                        setOpen(false)
                                                                    }}
                                                                    className={({ active }) =>
                                                                        cn(
                                                                            "flex select-none items-center rounded-[--radius-md] p-2 text-[--muted] cursor-pointer",
                                                                            active && "bg-gray-800 text-white",
                                                                        )
                                                                    }
                                                                >
                                                                    {({ active }) => (
                                                                        <>
                                                                            <div
                                                                                className="h-10 w-10 flex-none rounded-[--radius-md] object-cover object-center relative overflow-hidden"
                                                                            >
                                                                                {item.coverImage && <SeaImage
                                                                                    src={item.coverImage}
                                                                                    alt={""}
                                                                                    fill
                                                                                    quality={50}
                                                                                    priority
                                                                                    sizes="10rem"
                                                                                    className="object-cover object-center"
                                                                                />}
                                                                            </div>
                                                                            <span className="ml-3 flex-auto truncate">{item.title}</span>
                                                                            {item.type === "synthetic" && (
                                                                                <Badge intent="warning" size="sm" className="ml-2 gap-1">
                                                                                    <LuSparkles className="text-xs" />
                                                                                    Synthetic
                                                                                </Badge>
                                                                            )}
                                                                            {active && (
                                                                                <BiChevronRight
                                                                                    className="ml-3 h-7 w-7 flex-none text-gray-400"
                                                                                    aria-hidden="true"
                                                                                />
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </Combobox.Option>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {activeOption && (
                                                        <div
                                                            className="hidden min-h-96 w-1/2 flex-none flex-col overflow-y-auto sm:flex p-4"
                                                        >
                                                            <div className="flex-none p-6 text-center">
                                                                <div
                                                                    className="h-40 w-32 mx-auto flex-none rounded-[--radius-md] object-cover object-center relative overflow-hidden"
                                                                >
                                                                    {(activeOption.coverImage || activeOption.anilistData?.coverImage?.large) && <SeaImage
                                                                        src={activeOption.coverImage || activeOption.anilistData?.coverImage?.large}
                                                                        alt={""}
                                                                        fill
                                                                        quality={100}
                                                                        priority
                                                                        sizes="10rem"
                                                                        className="object-cover object-center"
                                                                    />}
                                                                </div>
                                                                <h4 className="mt-3 font-semibold text-[--foreground] line-clamp-3">{activeOption.title}</h4>
                                                                {activeOption.type === "synthetic" && (
                                                                    <Badge intent="warning" size="sm" className="mt-2 gap-1">
                                                                        <LuSparkles className="text-xs" />
                                                                        Synthetic Anime
                                                                    </Badge>
                                                                )}
                                                                <p className="text-sm leading-6 text-[--muted] mt-1">
                                                                    {activeOption.format}{activeOption.season
                                                                        ? ` - ${capitalize(activeOption.season)} `
                                                                        : " - "}{activeOption.seasonYear
                                                                            ? activeOption.seasonYear
                                                                            : "-"}
                                                                    {activeOption.episodes ? ` (${activeOption.episodes} eps)` : ""}
                                                                </p>
                                                            </div>
                                                            <SeaLink
                                                                href={activeOption.type === "synthetic"
                                                                    ? `/entry?id=${activeOption.id}&synthetic=true`
                                                                    : `/entry?id=${activeOption.id}`}
                                                                onClick={() => setOpen(false)}
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    className="w-full"
                                                                    intent="gray-subtle"
                                                                >
                                                                    Open
                                                                </Button>
                                                            </SeaLink>
                                                        </div>
                                                    )}
                                                </Combobox.Options>
                                            )}

                                            {/* Manga results */}
                                            {type === "manga" && !!media && media.length > 0 && (
                                                <Combobox.Options
                                                    as="div" static hold
                                                    className="flex divide-[--border] bg-gray-950 shadow-2xl ring-1 ring-black ring-opacity-5 rounded-xl border"
                                                >
                                                    <div
                                                        className={cn(
                                                            "max-h-96 min-w-0 flex-auto scroll-py-2 overflow-y-auto px-6 py-2 my-2",
                                                            { "sm:h-96": activeOption },
                                                        )}
                                                    >
                                                        <div className="-mx-2 text-sm text-[--foreground]">
                                                            {(media).map((item: any) => (
                                                                <Combobox.Option
                                                                    as="div"
                                                                    key={item.id}
                                                                    value={item}
                                                                    onClick={() => {
                                                                        router.push(`/manga/entry?id=${item.id}`)
                                                                        setOpen(false)
                                                                    }}
                                                                    className={({ active }) =>
                                                                        cn(
                                                                            "flex select-none items-center rounded-[--radius-md] p-2 text-[--muted] cursor-pointer",
                                                                            active && "bg-gray-800 text-white",
                                                                        )
                                                                    }
                                                                >
                                                                    {({ active }) => (
                                                                        <>
                                                                            <div
                                                                                className="h-10 w-10 flex-none rounded-[--radius-md] object-cover object-center relative overflow-hidden"
                                                                            >
                                                                                {item.coverImage?.medium && <SeaImage
                                                                                    src={item.coverImage?.medium}
                                                                                    alt={""}
                                                                                    fill
                                                                                    quality={50}
                                                                                    priority
                                                                                    sizes="10rem"
                                                                                    className="object-cover object-center"
                                                                                />}
                                                                            </div>
                                                                            <span
                                                                                className="ml-3 flex-auto truncate"
                                                                            >{item.title?.userPreferred}</span>
                                                                            {active && (
                                                                                <BiChevronRight
                                                                                    className="ml-3 h-7 w-7 flex-none text-gray-400"
                                                                                    aria-hidden="true"
                                                                                />
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </Combobox.Option>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {activeOption && (
                                                        <div
                                                            className="hidden min-h-96 w-1/2 flex-none flex-col overflow-y-auto sm:flex p-4"
                                                        >
                                                            <div className="flex-none p-6 text-center">
                                                                <div
                                                                    className="h-40 w-32 mx-auto flex-none rounded-[--radius-md] object-cover object-center relative overflow-hidden"
                                                                >
                                                                    {activeOption.coverImage?.large && <SeaImage
                                                                        src={activeOption.coverImage?.large}
                                                                        alt={""}
                                                                        fill
                                                                        quality={100}
                                                                        priority
                                                                        sizes="10rem"
                                                                        className="object-cover object-center"
                                                                    />}
                                                                </div>
                                                                <h4 className="mt-3 font-semibold text-[--foreground] line-clamp-3">{activeOption.title?.userPreferred}</h4>
                                                                <p className="text-sm leading-6 text-[--muted]">
                                                                    {activeOption.format}{activeOption.season
                                                                        ? ` - ${capitalize(activeOption.season)} `
                                                                        : " - "}{activeOption.seasonYear
                                                                            ? activeOption.seasonYear
                                                                            : "-"}
                                                                </p>
                                                            </div>
                                                            <SeaLink
                                                                href={`/manga/entry?id=${activeOption.id}`}
                                                                onClick={() => setOpen(false)}
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    className="w-full"
                                                                    intent="gray-subtle"
                                                                >
                                                                    Open
                                                                </Button>
                                                            </SeaLink>
                                                        </div>
                                                    )}
                                                </Combobox.Options>
                                            )}

                                            {/* Synthetic Anime only results */}
                                            {type === "synthetic-anime" && syntheticAnimeData && syntheticAnimeData.length > 0 && (
                                                <Combobox.Options
                                                    as="div" static hold
                                                    className="flex divide-[--border] bg-gray-950 shadow-2xl ring-1 ring-black ring-opacity-5 rounded-xl border"
                                                >
                                                    <div
                                                        className={cn(
                                                            "max-h-96 min-w-0 flex-auto scroll-py-2 overflow-y-auto px-6 py-2 my-2",
                                                            { "sm:h-96": activeOption },
                                                        )}
                                                    >
                                                        <div className="-mx-2 text-sm text-[--foreground]">
                                                            {syntheticAnimeData.map((item) => (
                                                                <Combobox.Option
                                                                    as="div"
                                                                    key={`synthetic-anime-${item.syntheticId}`}
                                                                    value={item}
                                                                    onClick={() => {
                                                                        router.push(`/entry?id=${item.syntheticId}&synthetic=true`)
                                                                        setOpen(false)
                                                                    }}
                                                                    className={({ active }) =>
                                                                        cn(
                                                                            "flex select-none items-center rounded-[--radius-md] p-2 text-[--muted] cursor-pointer",
                                                                            active && "bg-gray-800 text-white",
                                                                        )
                                                                    }
                                                                >
                                                                    {({ active }) => (
                                                                        <>
                                                                            <div
                                                                                className="h-10 w-10 flex-none rounded-[--radius-md] object-cover object-center relative overflow-hidden"
                                                                            >
                                                                                {(item.coverImage || item.thumbnail) && <SeaImage
                                                                                    src={item.coverImage || item.thumbnail}
                                                                                    alt={""}
                                                                                    fill
                                                                                    quality={50}
                                                                                    priority
                                                                                    sizes="10rem"
                                                                                    className="object-cover object-center"
                                                                                />}
                                                                            </div>
                                                                            <span className="ml-3 flex-auto truncate">{item.title}</span>
                                                                            <Badge intent="warning" size="sm" className="ml-2 gap-1">
                                                                                <LuSparkles className="text-xs" />
                                                                                Synthetic
                                                                            </Badge>
                                                                            {active && (
                                                                                <BiChevronRight
                                                                                    className="ml-3 h-7 w-7 flex-none text-gray-400"
                                                                                    aria-hidden="true"
                                                                                />
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </Combobox.Option>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {activeOption && (
                                                        <div
                                                            className="hidden min-h-96 w-1/2 flex-none flex-col overflow-y-auto sm:flex p-4"
                                                        >
                                                            <div className="flex-none p-6 text-center">
                                                                <div
                                                                    className="h-40 w-32 mx-auto flex-none rounded-[--radius-md] object-cover object-center relative overflow-hidden"
                                                                >
                                                                    {(activeOption.coverImage || activeOption.thumbnail) && <SeaImage
                                                                        src={activeOption.coverImage || activeOption.thumbnail}
                                                                        alt={""}
                                                                        fill
                                                                        quality={100}
                                                                        priority
                                                                        sizes="10rem"
                                                                        className="object-cover object-center"
                                                                    />}
                                                                </div>
                                                                <h4 className="mt-3 font-semibold text-[--foreground] line-clamp-3">{activeOption.title}</h4>
                                                                <Badge intent="warning" size="sm" className="mt-2 gap-1">
                                                                    <LuSparkles className="text-xs" />
                                                                    Synthetic Anime
                                                                </Badge>
                                                                <p className="text-sm leading-6 text-[--muted] mt-2">
                                                                    {activeOption.type}{activeOption.season
                                                                        ? ` - ${capitalize(activeOption.season)} `
                                                                        : " - "}{activeOption.seasonYear
                                                                            ? activeOption.seasonYear
                                                                            : "-"}
                                                                    {activeOption.episodes > 0 ? ` (${activeOption.episodes} eps)` : ""}
                                                                </p>
                                                            </div>
                                                            <SeaLink
                                                                href={`/entry?id=${activeOption.syntheticId}&synthetic=true`}
                                                                onClick={() => setOpen(false)}
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    className="w-full"
                                                                    intent="gray-subtle"
                                                                >
                                                                    Open
                                                                </Button>
                                                            </SeaLink>
                                                        </div>
                                                    )}
                                                </Combobox.Options>
                                            )}

                                            {(debouncedQuery !== "" && (!media || media.length === 0) && (isLoading || isFetching)) && (
                                                <LoadingSpinner />
                                            )}

                                            {/* Synthetic Manga results */}
                                            {type === "synthetic-manga" && syntheticMangaData && syntheticMangaData.length > 0 && (
                                                <Combobox.Options
                                                    as="div" static hold
                                                    className="flex divide-[--border] bg-gray-950 shadow-2xl ring-1 ring-black ring-opacity-5 rounded-xl border"
                                                >
                                                    <div
                                                        className={cn(
                                                            "max-h-96 min-w-0 flex-auto scroll-py-2 overflow-y-auto px-6 py-2 my-2",
                                                            { "sm:h-96": activeOption },
                                                        )}
                                                    >
                                                        <div className="-mx-2 text-sm text-[--foreground]">
                                                            {syntheticMangaData.map((item) => (
                                                                <Combobox.Option
                                                                    as="div"
                                                                    key={`synthetic-${item.syntheticId}`}
                                                                    value={item}
                                                                    onClick={() => {
                                                                        router.push(`/manga/entry?id=${item.syntheticId}`)
                                                                        setOpen(false)
                                                                    }}
                                                                    className={({ active }) =>
                                                                        cn(
                                                                            "flex select-none items-center rounded-[--radius-md] p-2 text-[--muted] cursor-pointer",
                                                                            active && "bg-gray-800 text-white",
                                                                        )
                                                                    }
                                                                >
                                                                    {({ active }) => (
                                                                        <>
                                                                            <div
                                                                                className="h-10 w-10 flex-none rounded-[--radius-md] object-cover object-center relative overflow-hidden"
                                                                            >
                                                                                {item.coverImage && <SeaImage
                                                                                    src={item.coverImage}
                                                                                    alt={""}
                                                                                    fill
                                                                                    quality={50}
                                                                                    priority
                                                                                    sizes="10rem"
                                                                                    className="object-cover object-center"
                                                                                />}
                                                                            </div>
                                                                            <span className="ml-3 flex-auto truncate">{item.title}</span>
                                                                            <Badge intent="warning" size="sm" className="ml-2 gap-1">
                                                                                <LuSparkles className="text-xs" />
                                                                                Synthetic
                                                                            </Badge>
                                                                            {active && (
                                                                                <BiChevronRight
                                                                                    className="ml-3 h-7 w-7 flex-none text-gray-400"
                                                                                    aria-hidden="true"
                                                                                />
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </Combobox.Option>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {activeOption && (
                                                        <div
                                                            className="hidden min-h-96 w-1/2 flex-none flex-col overflow-y-auto sm:flex p-4"
                                                        >
                                                            <div className="flex-none p-6 text-center">
                                                                <div
                                                                    className="h-40 w-32 mx-auto flex-none rounded-[--radius-md] object-cover object-center relative overflow-hidden"
                                                                >
                                                                    {activeOption.coverImage && <SeaImage
                                                                        src={activeOption.coverImage}
                                                                        alt={""}
                                                                        fill
                                                                        quality={100}
                                                                        priority
                                                                        sizes="10rem"
                                                                        className="object-cover object-center"
                                                                    />}
                                                                </div>
                                                                <h4 className="mt-3 font-semibold text-[--foreground] line-clamp-3">{activeOption.title}</h4>
                                                                <Badge intent="warning" size="sm" className="mt-2 gap-1">
                                                                    <LuSparkles className="text-xs" />
                                                                    Synthetic Manga
                                                                </Badge>
                                                                <p className="text-sm leading-6 text-[--muted] mt-2">
                                                                    {activeOption.chapters > 0 ? `${activeOption.chapters} chapters` : ""}
                                                                </p>
                                                            </div>
                                                            <SeaLink
                                                                href={`/manga/entry?id=${activeOption.syntheticId}`}
                                                                onClick={() => setOpen(false)}
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    className="w-full"
                                                                    intent="gray-subtle"
                                                                >
                                                                    Open
                                                                </Button>
                                                            </SeaLink>
                                                        </div>
                                                    )}
                                                </Combobox.Options>
                                            )}

                                            {debouncedQuery !== "" && !isLoading && !isFetching && (
                                                (type === "anime" && mixedAnimeResults.length === 0) ||
                                                (type === "manga" && (!media || media.length === 0)) ||
                                                (type === "synthetic-manga" && (!syntheticMangaData || syntheticMangaData.length === 0)) ||
                                                (type === "synthetic-anime" && (!syntheticAnimeData || syntheticAnimeData.length === 0))
                                            ) && (
                                                <div className="py-14 px-6 text-center text-sm sm:px-14">
                                                    {<div
                                                        className="h-[10rem] w-[10rem] mx-auto flex-none rounded-[--radius-md] object-cover object-center relative overflow-hidden"
                                                    >
                                                        <SeaImage
                                                            src="/luffy-01.png"
                                                            alt={""}
                                                            fill
                                                            quality={100}
                                                            priority
                                                            sizes="10rem"
                                                            className="object-contain object-top"
                                                        />
                                                    </div>}
                                                    <h5 className="mt-4 font-semibold text-[--foreground]">Nothing
                                                        found</h5>
                                                    <p className="mt-2 text-[--muted]">
                                                        We couldn't find anything with that name. Please try again.
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Combobox>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    )

}
