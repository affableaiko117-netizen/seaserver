"use client"

import React from "react"
import { LuLock, LuCheck, LuMousePointer2, LuTag, LuPalette, LuFrame, LuImage, LuZap, LuSparkles } from "react-icons/lu"
import { cn } from "@/components/ui/core/styling"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ALL_CURSOR_DEFINITIONS } from "@/lib/cursors/cursor-generator"
import { useCursor } from "@/lib/cursors/cursor-provider"
import { useRewards } from "@/lib/rewards/reward-provider"
import {
    TITLE_REWARDS,
    NAME_COLOR_REWARDS,
    BORDER_REWARDS,
    BACKGROUND_REWARDS,
    XP_BAR_SKIN_REWARDS,
    PARTICLE_SET_REWARDS,
    type TitleReward,
    type NameColorReward,
    type BorderReward,
    type BackgroundReward,
    type XPBarSkinReward,
    type ParticleSetReward,
} from "@/lib/rewards/reward-definitions"

type Props = {
    currentLevel: number
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function LockBadge() {
    return (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center">
            <LuLock className="text-[10px] text-gray-400" />
        </div>
    )
}

function ActiveBadge() {
    return (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
            <LuCheck className="text-[10px] text-white" />
        </div>
    )
}

function LevelTag({ level }: { level: number }) {
    return <span className="text-[10px] text-[--muted]">Lv. {level}</span>
}

function CardBase({
    isActive,
    isUnlocked,
    onClick,
    children,
    className,
}: {
    isActive: boolean
    isUnlocked: boolean
    onClick: () => void
    children: React.ReactNode
    className?: string
}) {
    return (
        <button
            disabled={!isUnlocked}
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all text-left",
                isActive
                    ? "border-brand-500 bg-brand-500/15 shadow-lg shadow-brand-500/20"
                    : isUnlocked
                        ? "border-[--border] bg-gray-900/40 hover:border-brand-500/50 hover:bg-gray-900/60"
                        : "border-[--border] bg-gray-900/20 opacity-50 cursor-not-allowed",
                className,
            )}
        >
            {isActive && <ActiveBadge />}
            {!isUnlocked && <LockBadge />}
            {children}
        </button>
    )
}

// ─── Cursor Tab ───────────────────────────────────────────────────────────────

const CURSOR_TIER_LABELS: { label: string; min: number; max: number }[] = [
    { label: "Basic (1-60)",      min: 1,   max: 60   },
    { label: "Vivid (61-100)",    min: 61,  max: 100  },
    { label: "Metallic (101-200)", min: 101, max: 200  },
    { label: "Neon (201-300)",    min: 201, max: 300  },
    { label: "Pastel (301-400)",  min: 301, max: 400  },
    { label: "Void (401-500)",    min: 401, max: 500  },
    { label: "Fire (501-600)",    min: 501, max: 600  },
    { label: "Ice (601-700)",     min: 601, max: 700  },
    { label: "Cosmic (701-800)",  min: 701, max: 800  },
    { label: "Divine (801-900)",  min: 801, max: 900  },
    { label: "Prismatic (901+)",  min: 901, max: 1000 },
]

function CursorTab({ currentLevel }: { currentLevel: number }) {
    const { activeCursorId, setActiveCursorId } = useCursor()
    const [tierIdx, setTierIdx] = React.useState(0)

    const tier = CURSOR_TIER_LABELS[tierIdx]
    const visible = ALL_CURSOR_DEFINITIONS.filter(c => c.requiredLevel >= tier.min && c.requiredLevel <= tier.max)
    const unlocked = ALL_CURSOR_DEFINITIONS.filter(c => c.requiredLevel <= currentLevel).length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-[--muted]">
                    <LuMousePointer2 />
                    <span>{unlocked}/{ALL_CURSOR_DEFINITIONS.length} unlocked</span>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                    {CURSOR_TIER_LABELS.map((t, i) => (
                        <button
                            key={t.label}
                            onClick={() => setTierIdx(i)}
                            className={cn(
                                "px-2.5 py-1 text-xs rounded-full border transition",
                                tierIdx === i
                                    ? "border-brand-500 bg-brand-500/20 text-brand-300"
                                    : "border-[--border] text-[--muted] hover:border-brand-500/50",
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {visible.map(cursor => {
                    const isUnlocked = cursor.requiredLevel <= currentLevel
                    const isActive = activeCursorId === cursor.id
                    return (
                        <CardBase key={cursor.id} isActive={isActive} isUnlocked={isUnlocked} onClick={() => setActiveCursorId(cursor.id)}>
                            <div className="w-12 h-12 flex items-center justify-center">
                                {cursor.icon ? (
                                    <img src={cursor.icon} alt={cursor.name} className="w-10 h-10 object-contain" draggable={false} />
                                ) : (
                                    <LuMousePointer2 className="text-2xl text-[--muted]" />
                                )}
                            </div>
                            <div className="text-center w-full">
                                <p className="text-xs font-medium leading-tight truncate w-full">{cursor.name}</p>
                                {!isUnlocked && <LevelTag level={cursor.requiredLevel} />}
                            </div>
                        </CardBase>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Titles Tab ───────────────────────────────────────────────────────────────

function TitlesTab({ currentLevel }: { currentLevel: number }) {
    const { activeTitle, setActiveTitle } = useRewards()
    const unlocked = TITLE_REWARDS.filter(r => r.requiredLevel <= currentLevel).length

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[--muted]">
                <LuTag />
                <span>{unlocked}/{TITLE_REWARDS.length} unlocked</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {TITLE_REWARDS.map((reward: TitleReward) => {
                    const isUnlocked = reward.requiredLevel <= currentLevel
                    const isActive = activeTitle?.id === reward.id
                    return (
                        <CardBase key={reward.id} isActive={isActive} isUnlocked={isUnlocked} onClick={() => setActiveTitle(reward.id)} className="items-start">
                            <div className="w-full">
                                <p
                                    className="text-sm font-semibold leading-tight"
                                    style={reward.color ? { color: reward.color } : undefined}
                                >
                                    {reward.icon && <span className="mr-1">{reward.icon}</span>}
                                    {reward.text}
                                </p>
                                <p className="text-xs text-[--muted] mt-0.5 leading-tight">{reward.description}</p>
                                {!isUnlocked && <LevelTag level={reward.requiredLevel} />}
                            </div>
                        </CardBase>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Name Colors Tab ──────────────────────────────────────────────────────────

function NameColorsTab({ currentLevel }: { currentLevel: number }) {
    const { activeNameColor, setActiveNameColor } = useRewards()
    const unlocked = NAME_COLOR_REWARDS.filter(r => r.requiredLevel <= currentLevel).length

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[--muted]">
                <LuPalette />
                <span>{unlocked}/{NAME_COLOR_REWARDS.length} unlocked</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {NAME_COLOR_REWARDS.map((reward: NameColorReward) => {
                    const isUnlocked = reward.requiredLevel <= currentLevel
                    const isActive = activeNameColor?.id === reward.id
                    return (
                        <CardBase key={reward.id} isActive={isActive} isUnlocked={isUnlocked} onClick={() => setActiveNameColor(reward.id)} className="items-start">
                            <div className="w-full space-y-1.5">
                                {/* Color swatch */}
                                <div
                                    className="w-full h-6 rounded"
                                    style={{ background: reward.gradientCss ?? reward.color }}
                                />
                                <p className="text-xs font-medium leading-tight">{reward.name}</p>
                                <p className="text-xs text-[--muted] leading-tight">{reward.description}</p>
                                {!isUnlocked && <LevelTag level={reward.requiredLevel} />}
                            </div>
                        </CardBase>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Borders Tab ─────────────────────────────────────────────────────────────

function BordersTab({ currentLevel }: { currentLevel: number }) {
    const { activeBorder, setActiveBorder } = useRewards()
    const unlocked = BORDER_REWARDS.filter(r => r.requiredLevel <= currentLevel).length

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[--muted]">
                <LuFrame />
                <span>{unlocked}/{BORDER_REWARDS.length} unlocked</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {BORDER_REWARDS.map((reward: BorderReward) => {
                    const isUnlocked = reward.requiredLevel <= currentLevel
                    const isActive = activeBorder?.id === reward.id
                    return (
                        <CardBase key={reward.id} isActive={isActive} isUnlocked={isUnlocked} onClick={() => setActiveBorder(reward.id)} className="items-start">
                            <div className="w-full space-y-1.5">
                                {/* Border preview */}
                                <div
                                    className="w-full h-10 rounded-lg bg-gray-800"
                                    style={{
                                        border: reward.borderCss,
                                        boxShadow: reward.glowCss,
                                    }}
                                />
                                <p className="text-xs font-medium leading-tight">{reward.icon && <span className="mr-1">{reward.icon}</span>}{reward.name}</p>
                                <p className="text-xs text-[--muted] leading-tight">{reward.description}</p>
                                {!isUnlocked && <LevelTag level={reward.requiredLevel} />}
                            </div>
                        </CardBase>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Backgrounds Tab ─────────────────────────────────────────────────────────

function BackgroundsTab({ currentLevel }: { currentLevel: number }) {
    const { activeBackground, setActiveBackground } = useRewards()
    const unlocked = BACKGROUND_REWARDS.filter(r => r.requiredLevel <= currentLevel).length

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[--muted]">
                <LuImage />
                <span>{unlocked}/{BACKGROUND_REWARDS.length} unlocked</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {BACKGROUND_REWARDS.map((reward: BackgroundReward) => {
                    const isUnlocked = reward.requiredLevel <= currentLevel
                    const isActive = activeBackground?.id === reward.id
                    return (
                        <CardBase key={reward.id} isActive={isActive} isUnlocked={isUnlocked} onClick={() => setActiveBackground(reward.id)} className="items-start">
                            <div className="w-full space-y-1.5">
                                {/* Background preview */}
                                <div
                                    className="w-full h-14 rounded-lg"
                                    style={{ background: reward.backgroundCss === "transparent" ? "#1e293b" : reward.backgroundCss }}
                                />
                                <p className="text-xs font-medium leading-tight">{reward.icon && <span className="mr-1">{reward.icon}</span>}{reward.name}</p>
                                <p className="text-xs text-[--muted] leading-tight">{reward.description}</p>
                                {!isUnlocked && <LevelTag level={reward.requiredLevel} />}
                            </div>
                        </CardBase>
                    )
                })}
            </div>
        </div>
    )
}

// ─── XP Bar Skins Tab ─────────────────────────────────────────────────────────

function XPBarsTab({ currentLevel }: { currentLevel: number }) {
    const { activeXPBarSkin, setActiveXPBarSkin } = useRewards()
    const unlocked = XP_BAR_SKIN_REWARDS.filter(r => r.requiredLevel <= currentLevel).length

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[--muted]">
                <LuZap />
                <span>{unlocked}/{XP_BAR_SKIN_REWARDS.length} unlocked</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {XP_BAR_SKIN_REWARDS.map((reward: XPBarSkinReward) => {
                    const isUnlocked = reward.requiredLevel <= currentLevel
                    const isActive = activeXPBarSkin?.id === reward.id
                    return (
                        <CardBase key={reward.id} isActive={isActive} isUnlocked={isUnlocked} onClick={() => setActiveXPBarSkin(reward.id)} className="items-start">
                            <div className="w-full space-y-2">
                                {/* XP bar preview */}
                                <div
                                    className="w-full h-3 rounded-full overflow-hidden"
                                    style={{ background: reward.trackCss ?? "rgba(255,255,255,0.1)" }}
                                >
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: "65%", background: reward.fillCss }}
                                    />
                                </div>
                                <p className="text-xs font-medium leading-tight">{reward.icon && <span className="mr-1">{reward.icon}</span>}{reward.name}</p>
                                <p className="text-xs text-[--muted] leading-tight">{reward.description}</p>
                                {!isUnlocked && <LevelTag level={reward.requiredLevel} />}
                            </div>
                        </CardBase>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Particles Tab ────────────────────────────────────────────────────────────

function ParticlesTab({ currentLevel }: { currentLevel: number }) {
    const { activeParticleSet, setActiveParticleSet } = useRewards()
    const unlocked = PARTICLE_SET_REWARDS.filter(r => r.requiredLevel <= currentLevel).length

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[--muted]">
                <LuSparkles />
                <span>{unlocked}/{PARTICLE_SET_REWARDS.length} unlocked</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {PARTICLE_SET_REWARDS.map((reward: ParticleSetReward) => {
                    const isUnlocked = reward.requiredLevel <= currentLevel
                    const isActive = activeParticleSet?.id === reward.id
                    return (
                        <CardBase key={reward.id} isActive={isActive} isUnlocked={isUnlocked} onClick={() => setActiveParticleSet(reward.id)}>
                            <div className="text-3xl">{reward.previewEmoji}</div>
                            <div className="text-center w-full">
                                <p className="text-xs font-medium leading-tight">{reward.name}</p>
                                <p className="text-[10px] text-[--muted] leading-tight mt-0.5">{reward.description}</p>
                                {!isUnlocked && <LevelTag level={reward.requiredLevel} />}
                            </div>
                        </CardBase>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Main Shop ────────────────────────────────────────────────────────────────

export function RewardShop({ currentLevel }: Props) {
    return (
        <Tabs defaultValue="cursors" className="w-full">
            <TabsList className="mb-4 flex flex-wrap gap-1 h-auto bg-transparent border border-[--border] p-1 rounded-lg">
                <TabsTrigger value="cursors"    className="flex items-center gap-1.5 text-xs"><LuMousePointer2 className="shrink-0" /> Cursors</TabsTrigger>
                <TabsTrigger value="titles"     className="flex items-center gap-1.5 text-xs"><LuTag          className="shrink-0" /> Titles</TabsTrigger>
                <TabsTrigger value="namecolors" className="flex items-center gap-1.5 text-xs"><LuPalette      className="shrink-0" /> Name Colors</TabsTrigger>
                <TabsTrigger value="borders"    className="flex items-center gap-1.5 text-xs"><LuFrame        className="shrink-0" /> Borders</TabsTrigger>
                <TabsTrigger value="backgrounds"className="flex items-center gap-1.5 text-xs"><LuImage        className="shrink-0" /> Backgrounds</TabsTrigger>
                <TabsTrigger value="xpbars"     className="flex items-center gap-1.5 text-xs"><LuZap          className="shrink-0" /> XP Bars</TabsTrigger>
                <TabsTrigger value="particles"  className="flex items-center gap-1.5 text-xs"><LuSparkles     className="shrink-0" /> Particles</TabsTrigger>
            </TabsList>

            <TabsContent value="cursors">     <CursorTab       currentLevel={currentLevel} /> </TabsContent>
            <TabsContent value="titles">      <TitlesTab       currentLevel={currentLevel} /> </TabsContent>
            <TabsContent value="namecolors">  <NameColorsTab   currentLevel={currentLevel} /> </TabsContent>
            <TabsContent value="borders">     <BordersTab      currentLevel={currentLevel} /> </TabsContent>
            <TabsContent value="backgrounds"> <BackgroundsTab  currentLevel={currentLevel} /> </TabsContent>
            <TabsContent value="xpbars">      <XPBarsTab       currentLevel={currentLevel} /> </TabsContent>
            <TabsContent value="particles">   <ParticlesTab    currentLevel={currentLevel} /> </TabsContent>
        </Tabs>
    )
}
