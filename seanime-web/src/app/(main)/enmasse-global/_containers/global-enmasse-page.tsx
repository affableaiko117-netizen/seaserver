"use client"

import { useGetGlobalEnMasseStatus, useStartGlobalEnMasse, useStopGlobalEnMasse } from "@/api/hooks/synthetic-anime.hooks"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import React, { useEffect, useRef } from "react"
import { BiPause, BiPlay, BiStop } from "react-icons/bi"
import { LuRefreshCw } from "react-icons/lu"

export function GlobalEnMassePage() {
    const { data: status, isLoading: statusLoading } = useGetGlobalEnMasseStatus()
    const { mutate: start, isPending: isStarting } = useStartGlobalEnMasse()
    const { mutate: stop, isPending: isStopping } = useStopGlobalEnMasse()

    const downloadedRef = useRef<HTMLDivElement>(null)
    const failedRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (downloadedRef.current) {
            downloadedRef.current.scrollTop = downloadedRef.current.scrollHeight
        }
    }, [status?.downloadedAnime])

    useEffect(() => {
        if (failedRef.current) {
            failedRef.current.scrollTop = failedRef.current.scrollHeight
        }
    }, [status?.failedAnime])

    if (statusLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Global En Masse Downloader</h1>
                    <p className="text-sm text-[--muted]">
                        Uses the anime-offline-database to create synthetic anime and search AniTosho for torrents.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {!status?.isRunning ? (
                        <>
                            {status?.hasSavedProgress && (
                                <Button
                                    intent="primary"
                                    leftIcon={<LuRefreshCw className="text-xl" />}
                                    onClick={() => start({ resume: true })}
                                    loading={isStarting}
                                    disabled={isStarting}
                                >
                                    Resume
                                </Button>
                            )}
                            <Button
                                intent={status?.hasSavedProgress ? "white-subtle" : "primary"}
                                leftIcon={<BiPlay className="text-xl" />}
                                onClick={() => start({ resume: false })}
                                loading={isStarting}
                                disabled={isStarting}
                            >
                                {status?.hasSavedProgress ? "Start Fresh" : "Start Download"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                intent="warning"
                                leftIcon={<BiPause className="text-xl" />}
                                onClick={() => stop({ saveProgress: true })}
                                loading={isStopping}
                                disabled={isStopping}
                            >
                                Pause
                            </Button>
                            <Button
                                intent="alert"
                                leftIcon={<BiStop className="text-xl" />}
                                onClick={() => stop({ saveProgress: false })}
                                loading={isStopping}
                                disabled={isStopping}
                            >
                                Stop
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <AppLayoutStack>
                <Card className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">Status:</span>
                            {status?.isRunning ? (
                                <Badge intent="success" className="flex items-center gap-1">
                                    Running
                                </Badge>
                            ) : status?.isPaused || status?.hasSavedProgress ? (
                                <Badge intent="warning">Paused</Badge>
                            ) : (
                                <Badge intent="gray">Idle</Badge>
                            )}
                        </div>
                        <span className="text-sm text-[--muted]">
                            {status?.status || "Waiting for start"}
                        </span>
                    </div>

                    {status?.isRunning && status?.currentAnime && (
                        <div className="bg-[--subtle] rounded-xl p-4">
                            <p className="text-sm text-[--muted]">Processing</p>
                            <p className="text-lg font-semibold">{status.currentAnime}</p>
                        </div>
                    )}

                    {(status?.totalCount ?? 0) > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Progress</span>
                                <span>
                                    {status?.processedCount || 0} / {status?.totalCount || 0}
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-gray-800">
                                <div
                                    className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${((status?.processedCount || 0) / (status?.totalCount || 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="font-semibold">Downloaded</span>
                            <Badge intent="success">{status?.downloadedAnime?.length || 0}</Badge>
                        </div>
                        <div ref={downloadedRef} className="max-h-60 overflow-y-auto space-y-2">
                            {(status?.downloadedAnime || []).slice(-100).map((title, idx) => (
                                <div key={`${title}-${idx}`} className="text-sm text-green-300 bg-green-950/50 rounded-lg px-3 py-1">
                                    {title}
                                </div>
                            ))}
                            {(!status?.downloadedAnime || status.downloadedAnime.length === 0) && (
                                <p className="text-[--muted] text-sm">No downloads recorded yet.</p>
                            )}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="font-semibold">Failed</span>
                            <Badge intent="alert">{status?.failedAnime?.length || 0}</Badge>
                        </div>
                        <div ref={failedRef} className="max-h-60 overflow-y-auto space-y-2">
                            {(status?.failedAnime || []).slice(-100).map((title, idx) => (
                                <div key={`${title}-${idx}`} className="text-sm text-red-300 bg-red-950/50 rounded-lg px-3 py-1">
                                    {title}
                                </div>
                            ))}
                            {(!status?.failedAnime || status.failedAnime.length === 0) && (
                                <p className="text-[--muted] text-sm">No failures reported.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </AppLayoutStack>
        </div>
    )
}
