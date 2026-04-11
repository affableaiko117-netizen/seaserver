import { submenuClass, VdsSubmenuButton } from "@/app/(main)/onlinestream/_components/onlinestream-video-addons"
import { Switch } from "@/components/ui/switch"
import { TextInput } from "@/components/ui/text-input"
import { Menu } from "@vidstack/react"
import { useAtom } from "jotai/react"
import React from "react"
import { AiFillPlayCircle } from "react-icons/ai"
import { MdPlaylistPlay } from "react-icons/md"
import { RxSlider } from "react-icons/rx"
import { TbHistory, TbLanguage } from "react-icons/tb"
import {
    __seaMediaPlayer_autoNextAtom,
    __seaMediaPlayer_autoPlayAtom,
    __seaMediaPlayer_autoSkipEndingAtom,
    __seaMediaPlayer_autoSkipOpeningAtom,
    __seaMediaPlayer_discreteControlsAtom,
    __seaMediaPlayer_preferredAudioLanguageAtom,
    __seaMediaPlayer_preferredSubtitleLanguageAtom,
    __seaMediaPlayer_watchContinuityAtom,
} from "./sea-media-player.atoms"

export function SeaMediaPlayerPlaybackSubmenu() {

    const [autoPlay, setAutoPlay] = useAtom(__seaMediaPlayer_autoPlayAtom)
    const [autoNext, setAutoNext] = useAtom(__seaMediaPlayer_autoNextAtom)
    const [autoSkipOpening, setAutoSkipOpening] = useAtom(__seaMediaPlayer_autoSkipOpeningAtom)
    const [autoSkipEnding, setAutoSkipEnding] = useAtom(__seaMediaPlayer_autoSkipEndingAtom)
    const [discreteControls, setDiscreteControls] = useAtom(__seaMediaPlayer_discreteControlsAtom)
    const [watchContinuity, setWatchContinuity] = useAtom(__seaMediaPlayer_watchContinuityAtom)

    return (
        <>
            <Menu.Root>
                <VdsSubmenuButton
                    label={`Auto Play`}
                    hint={autoPlay ? "On" : "Off"}
                    disabled={false}
                    icon={AiFillPlayCircle}
                />
                <Menu.Content className={submenuClass}>
                    <Switch
                        label="Auto play"
                        fieldClass="py-2 px-2"
                        value={autoPlay}
                        onValueChange={setAutoPlay}
                    />
                </Menu.Content>
            </Menu.Root>
            <Menu.Root>
                <VdsSubmenuButton
                    label={`Auto Play Next Episode`}
                    hint={autoNext ? "On" : "Off"}
                    disabled={false}
                    icon={MdPlaylistPlay}
                />
                <Menu.Content className={submenuClass}>
                    <Switch
                        label="Auto play next episode"
                        fieldClass="py-2 px-2"
                        value={autoNext}
                        onValueChange={setAutoNext}
                    />
                </Menu.Content>
            </Menu.Root>
            <Menu.Root>
                <VdsSubmenuButton
                    label={`Skip Opening`}
                    hint={autoSkipOpening ? "On" : "Off"}
                    disabled={false}
                    icon={MdPlaylistPlay}
                />
                <Menu.Content className={submenuClass}>
                    <Switch
                        label="Skip opening"
                        fieldClass="py-2 px-2"
                        value={autoSkipOpening}
                        onValueChange={setAutoSkipOpening}
                    />
                </Menu.Content>
            </Menu.Root>
            <Menu.Root>
                <VdsSubmenuButton
                    label={`Skip Ending`}
                    hint={autoSkipEnding ? "On" : "Off"}
                    disabled={false}
                    icon={MdPlaylistPlay}
                />
                <Menu.Content className={submenuClass}>
                    <Switch
                        label="Skip ending"
                        fieldClass="py-2 px-2"
                        value={autoSkipEnding}
                        onValueChange={setAutoSkipEnding}
                    />
                </Menu.Content>
            </Menu.Root>
            <Menu.Root>
                <VdsSubmenuButton
                    label={`Discrete Controls`}
                    hint={discreteControls ? "On" : "Off"}
                    disabled={false}
                    icon={RxSlider}
                />
                <Menu.Content className={submenuClass}>
                    <Switch
                        label="Discrete controls"
                        help="Only show the controls when the mouse is over the bottom part. (Large screens only)"
                        fieldClass="py-2 px-2"
                        value={discreteControls}
                        onValueChange={setDiscreteControls}
                        fieldHelpTextClass="max-w-xs"
                    />
                </Menu.Content>
            </Menu.Root>
            <Menu.Root>
                <VdsSubmenuButton
                    label={`Watch Continuity`}
                    hint={watchContinuity === "inherit" ? "Global" : watchContinuity === "on" ? "On" : "Off"}
                    disabled={false}
                    icon={TbHistory}
                />
                <Menu.Content className={submenuClass}>
                    <div className="space-y-2 p-2">
                        {(["inherit", "on", "off"] as const).map((val) => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="radio"
                                    name="smp-watch-continuity"
                                    checked={watchContinuity === val}
                                    onChange={() => setWatchContinuity(val)}
                                    className="accent-brand-300"
                                />
                                {val === "inherit" ? "Use global setting" : val === "on" ? "Always on" : "Always off"}
                            </label>
                        ))}
                    </div>
                </Menu.Content>
            </Menu.Root>
            <SeaMediaPlayerLanguageSubmenu />
        </>
    )
}

function SeaMediaPlayerLanguageSubmenu() {
    const [preferredAudioLang, setPreferredAudioLang] = useAtom(__seaMediaPlayer_preferredAudioLanguageAtom)
    const [preferredSubtitleLang, setPreferredSubtitleLang] = useAtom(__seaMediaPlayer_preferredSubtitleLanguageAtom)

    const audioHint = React.useMemo(() => {
        const first = preferredAudioLang.split(",")[0]?.trim()
        return first || "Not set"
    }, [preferredAudioLang])

    const subtitleHint = React.useMemo(() => {
        const first = preferredSubtitleLang.split(",")[0]?.trim()
        return first || "Not set"
    }, [preferredSubtitleLang])

    return (
        <Menu.Root>
            <VdsSubmenuButton
                label="Language Preferences"
                hint={`${audioHint} / ${subtitleHint}`}
                disabled={false}
                icon={TbLanguage}
            />
            <Menu.Content className={submenuClass}>
                <div className="space-y-3 p-2">
                    <TextInput
                        label="Preferred audio language"
                        help="Comma-separated codes (e.g. jpn,jp,japanese). Applied on next file load."
                        value={preferredAudioLang}
                        onValueChange={setPreferredAudioLang}
                        size="sm"
                        fieldHelpTextClass="max-w-xs"
                    />
                    <TextInput
                        label="Preferred subtitle language"
                        help="Comma-separated codes (e.g. en,eng,english). Applied on next file load."
                        value={preferredSubtitleLang}
                        onValueChange={setPreferredSubtitleLang}
                        size="sm"
                        fieldHelpTextClass="max-w-xs"
                    />
                </div>
            </Menu.Content>
        </Menu.Root>
    )
}
