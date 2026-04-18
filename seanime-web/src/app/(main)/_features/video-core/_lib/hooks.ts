import { isMobile } from "@/lib/utils/browser-detection"

export function useIsCodecSupported() {
    const isCodecSupported = (codec: string) => {
        if (isMobile()) return false
        if (navigator.userAgent.search("Firefox") === -1)
            codec = codec.replace("video/x-matroska", "video/mp4")
        // Also try video/mp4 for video/webm with non-VP codecs (MKV served as webm)
        const videos = document.getElementsByTagName("video")
        const video = videos.item(0) ?? document.createElement("video")
        const support = video.canPlayType(codec)
        if (support === "probably" || support === "maybe") return true

        // Heuristic: some browsers (Firefox/Opera) report empty for HEVC but can still play
        const codecLower = codec.toLowerCase()
        const ua = navigator.userAgent.toLowerCase()
        const isHevc = codecLower.includes("hvc1") || codecLower.includes("hev1") || codecLower.includes("hevc")
        const isFirefox = ua.includes("firefox")
        const isOpera = ua.includes("opr") || ua.includes("opera")
        if (isHevc && (isFirefox || isOpera)) return true

        // Fallback: if the codec string uses video/webm container, re-test with video/mp4
        // because MKV files are often served as video/webm but contain H.264/HEVC
        if (codec.includes("video/webm")) {
            const mp4Codec = codec.replace("video/webm", "video/mp4")
            const mp4Support = video.canPlayType(mp4Codec)
            if (mp4Support === "probably" || mp4Support === "maybe") return true
        }

        return false
    }

    return {
        isCodecSupported,
    }
}
