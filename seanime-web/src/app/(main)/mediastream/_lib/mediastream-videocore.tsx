"use client"
import React from "react"
import { Anime_Episode, Mediastream_StreamType } from "@/api/generated/types"
import { VideoCore, VideoCoreChapterCue, VideoCoreProvider } from "@/app/(main)/_features/video-core/video-core"
import { VideoCoreLifecycleState } from "@/app/(main)/_features/video-core/video-core.atoms"
import { vc_videoElement } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_requestTranscodeForAudio } from "@/app/(main)/_features/video-core/video-core-atoms"
import { useSkipData } from "@/app/(main)/_features/sea-media-player/aniskip"
import { useAtomValue } from "jotai"
import { useSetAtom } from "jotai/react"
import { toast } from "sonner"
import { logger } from "@/lib/helpers/debug"

const log = logger("MEDIASTREAM-VC")

type MediastreamVideoCoreProps = {
    lifecycleState: VideoCoreLifecycleState
    episode: Anime_Episode | undefined
    hasNextEpisode: boolean
    hasPreviousEpisode: boolean
    playNextEpisode: () => void
    playPreviousEpisode: () => void
    handleTerminateStream: () => void
    handleChangeStreamType?: (type: Mediastream_StreamType) => void
    currentStreamType?: Mediastream_StreamType
}

/**
 * Adapter component that bridges the mediastream page with VideoCore.
 * Replaces SeaMediaPlayer (Vidstack) for a unified Jellyfin-like player experience.
 */
export function MediastreamVideoCore(props: MediastreamVideoCoreProps) {
    const {
        lifecycleState,
        episode,
        hasNextEpisode,
        hasPreviousEpisode,
        playNextEpisode,
        playPreviousEpisode,
        handleTerminateStream,
        handleChangeStreamType,
        currentStreamType,
    } = props

    const videoElement = useAtomValue(vc_videoElement)
    const setRequestTranscodeForAudio = useSetAtom(vc_requestTranscodeForAudio)

    // Wire the transcode-for-audio callback so the audio menu can trigger
    // a switch from direct play to transcode when the user picks a different audio track.
    React.useEffect(() => {
        if (!handleChangeStreamType || currentStreamType !== "direct") {
            setRequestTranscodeForAudio(null)
            return
        }
        setRequestTranscodeForAudio(() => () => {
            log.info("Audio track switch requested — switching from direct play to transcode")
            toast.info("Switching to transcode for audio track change...")
            handleChangeStreamType("transcode")
        })
        return () => setRequestTranscodeForAudio(null)
    }, [handleChangeStreamType, currentStreamType])

    // ── Stall detection: auto-switch from direct play to transcode ──
    const stallTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const hasSwitchedRef = React.useRef(false)

    React.useEffect(() => {
        if (!videoElement || !handleChangeStreamType || currentStreamType !== "direct") return

        hasSwitchedRef.current = false

        const clearStallTimer = () => {
            if (stallTimerRef.current) {
                clearTimeout(stallTimerRef.current)
                stallTimerRef.current = null
            }
        }

        const onWaiting = () => {
            if (hasSwitchedRef.current) return
            clearStallTimer()
            stallTimerRef.current = setTimeout(() => {
                if (hasSwitchedRef.current) return
                hasSwitchedRef.current = true
                log.warning("Direct play stalled for 3s, auto-switching to transcode")
                toast.info("Direct play stalling — switching to transcode")
                handleChangeStreamType("transcode")
            }, 3000)
        }

        const onPlaying = () => clearStallTimer()
        const onCanPlay = () => clearStallTimer()

        videoElement.addEventListener("waiting", onWaiting)
        videoElement.addEventListener("playing", onPlaying)
        videoElement.addEventListener("canplay", onCanPlay)

        return () => {
            clearStallTimer()
            videoElement.removeEventListener("waiting", onWaiting)
            videoElement.removeEventListener("playing", onPlaying)
            videoElement.removeEventListener("canplay", onCanPlay)
        }
    }, [videoElement, handleChangeStreamType, currentStreamType])

    // AniSkip data for skip opening/ending
    const { data: aniSkipData } = useSkipData(
        lifecycleState?.playbackInfo?.media?.idMal,
        episode?.progressNumber ?? -1,
    )

    const handlePlayEpisode = React.useCallback((which: "previous" | "next") => {
        if (which === "next" && hasNextEpisode) {
            playNextEpisode()
        } else if (which === "previous" && hasPreviousEpisode) {
            playPreviousEpisode()
        }
    }, [hasNextEpisode, hasPreviousEpisode, playNextEpisode, playPreviousEpisode])

    return (
        <VideoCoreProvider id="mediastream">
            <div className="relative w-full h-full aspect-video bg-black rounded-md overflow-hidden">
                <VideoCore
                    id="mediastream"
                    state={lifecycleState}
                    aniSkipData={aniSkipData}
                    onTerminateStream={handleTerminateStream}
                    onPlayEpisode={handlePlayEpisode}
                    inline
                />
            </div>
        </VideoCoreProvider>
    )
}
