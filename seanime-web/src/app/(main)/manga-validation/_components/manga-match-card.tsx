"use client"

import { MangaMatchRecord } from "@/api/hooks/enmasse.hooks"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/components/ui/core/styling"
import React from "react"
import { BiFolder } from "react-icons/bi"
import { LuCheck, LuInfo, LuCircle } from "react-icons/lu"

interface MangaMatchCardProps {
    record: MangaMatchRecord
    onSelect: () => void
}

export function MangaMatchCard({ record, onSelect }: MangaMatchCardProps) {
    const confidenceIntent = record.isSynthetic 
        ? "gray" 
        : record.confidenceScore >= 0.8 
            ? "success" 
            : record.confidenceScore >= 0.5 
                ? "warning" 
                : "alert"

    const ConfidenceIcon = record.isSynthetic 
        ? LuCircle 
        : record.confidenceScore >= 0.8 
            ? LuCheck 
            : record.confidenceScore >= 0.5 
                ? LuInfo 
                : LuCircle

    return (
        <div
            className={cn(
                "p-4 border rounded-lg cursor-pointer transition-all",
                "hover:border-brand-200 hover:bg-gray-900/50",
                "bg-gray-950/50"
            )}
            onClick={onSelect}
        >
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-gray-800">
                    <BiFolder className="text-2xl text-brand-200" />
                </div>
                <div className="flex-1 min-w-0">
                    {/* Show matched title prominently if different from original */}
                    {record.matchedTitle !== record.originalTitle && (
                        <p className="text-xs text-brand-300 font-medium mb-1 line-clamp-1">
                            {record.matchedTitle}
                        </p>
                    )}
                    {/* Show original title */}
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2" title={record.originalTitle}>
                        {record.originalTitle}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {/* Confidence badge */}
                        {record.isSynthetic ? (
                            <Badge intent="gray" size="sm">
                                Synthetic
                            </Badge>
                        ) : (
                            <Badge intent={confidenceIntent} size="sm">
                                <ConfidenceIcon className="mr-1" />
                                {(record.confidenceScore * 100).toFixed(0)}% match
                            </Badge>
                        )}
                        {/* Status badge */}
                        <Badge 
                            intent={record.status === "downloaded" ? "success" : record.status === "failed" ? "alert" : "gray"} 
                            size="sm"
                        >
                            {record.status}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    )
}
