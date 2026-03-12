package handlers

import (
	"github.com/labstack/echo/v4"
)

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Anime En Masse Downloader
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// HandleEnMasseGetStatus
//
//	@summary get the status of the en masse downloader.
//	@desc Returns the current status of the en masse downloader including progress and current anime.
//	@returns enmasse.DownloaderStatus
//	@route /api/v1/enmasse/status [GET]
func (h *Handler) HandleEnMasseGetStatus(c echo.Context) error {
	status := h.App.EnMasseDownloader.GetStatus()
	return h.RespondWithData(c, status)
}

type EnMasseStartBody struct {
	Resume bool `json:"resume"`
}

// HandleEnMasseStart
//
//	@summary start the en masse downloader.
//	@desc Starts the en masse downloader to process anime from anilist-minified.json.
//	@returns bool
//	@route /api/v1/enmasse/start [POST]
func (h *Handler) HandleEnMasseStart(c echo.Context) error {
	var body EnMasseStartBody
	if err := c.Bind(&body); err != nil {
		body.Resume = false
	}
	
	err := h.App.EnMasseDownloader.Start(body.Resume)
	if err != nil {
		return h.RespondWithError(c, err)
	}
	return h.RespondWithData(c, true)
}

type EnMasseStopBody struct {
	SaveProgress bool `json:"saveProgress"`
}

// HandleEnMasseStop
//
//	@summary stop the en masse downloader.
//	@desc Stops the en masse downloader if it's running.
//	@returns bool
//	@route /api/v1/enmasse/stop [POST]
func (h *Handler) HandleEnMasseStop(c echo.Context) error {
	var body EnMasseStopBody
	if err := c.Bind(&body); err != nil {
		body.SaveProgress = true // Default to saving progress
	}
	
	h.App.EnMasseDownloader.Stop(body.SaveProgress)
	return h.RespondWithData(c, true)
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Manga En Masse Downloader
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// HandleMangaEnMasseGetStatus
//
//	@summary get the status of the manga en masse downloader.
//	@desc Returns the current status of the manga en masse downloader including progress and current manga.
//	@returns enmasse.MangaDownloaderStatus
//	@route /api/v1/enmasse/manga/status [GET]
func (h *Handler) HandleMangaEnMasseGetStatus(c echo.Context) error {
	status := h.App.MangaEnMasseDownloader.GetStatus()
	return h.RespondWithData(c, status)
}

type MangaEnMasseStartBody struct {
	Resume bool `json:"resume"`
}

// HandleMangaEnMasseStart
//
//	@summary start the manga en masse downloader.
//	@desc Starts the manga en masse downloader to process manga from hakuneko-mangas.json.
//	@returns bool
//	@route /api/v1/enmasse/manga/start [POST]
func (h *Handler) HandleMangaEnMasseStart(c echo.Context) error {
	var body MangaEnMasseStartBody
	if err := c.Bind(&body); err != nil {
		body.Resume = false
	}

	err := h.App.MangaEnMasseDownloader.Start(body.Resume)
	if err != nil {
		return h.RespondWithError(c, err)
	}
	return h.RespondWithData(c, true)
}

type MangaEnMasseStopBody struct {
	SaveProgress bool `json:"saveProgress"`
}

// HandleMangaEnMasseStop
//
//	@summary stop the manga en masse downloader.
//	@desc Stops the manga en masse downloader if it's running.
//	@returns bool
//	@route /api/v1/enmasse/manga/stop [POST]
func (h *Handler) HandleMangaEnMasseStop(c echo.Context) error {
	var body MangaEnMasseStopBody
	if err := c.Bind(&body); err != nil {
		body.SaveProgress = true // Default to saving progress
	}

	h.App.MangaEnMasseDownloader.Stop(body.SaveProgress)
	return h.RespondWithData(c, true)
}

// HandleGetMangaMatchHistory
//
//	@summary get the match history for manga en masse downloader.
//	@desc Returns all manga match records for review and correction.
//	@returns []*enmasse.MangaMatchRecord
//	@route /api/v1/enmasse/manga/match-history [GET]
func (h *Handler) HandleGetMangaMatchHistory(c echo.Context) error {
	history := h.App.MangaEnMasseDownloader.GetMatchHistory()
	return h.RespondWithData(c, history)
}

// HandleGetLowConfidenceMangaMatchCount
//
//	@summary get count of low confidence manga matches.
//	@desc Returns count of matches below confidence threshold for sidebar badge.
//	@returns int
//	@route /api/v1/enmasse/manga/low-confidence-count [GET]
func (h *Handler) HandleGetLowConfidenceMangaMatchCount(c echo.Context) error {
	threshold := 0.6 // Matches below 60% confidence
	count := h.App.MangaEnMasseDownloader.GetLowConfidenceMatchCount(threshold)
	return h.RespondWithData(c, count)
}

type CorrectMangaMatchBody struct {
	ProviderID   string `json:"providerId"`
	NewAnilistID int    `json:"newAnilistId"`
}

// HandleCorrectMangaMatch
//
//	@summary correct a manga's AniList match.
//	@desc Updates a manga's AniList match and moves files accordingly.
//	@returns bool
//	@route /api/v1/enmasse/manga/correct-match [POST]
func (h *Handler) HandleCorrectMangaMatch(c echo.Context) error {
	var body CorrectMangaMatchBody
	if err := c.Bind(&body); err != nil {
		return h.RespondWithError(c, err)
	}

	if body.ProviderID == "" {
		return h.RespondWithError(c, echo.NewHTTPError(400, "provider ID is required"))
	}
	if body.NewAnilistID <= 0 {
		return h.RespondWithError(c, echo.NewHTTPError(400, "valid AniList ID is required"))
	}

	err := h.App.MangaEnMasseDownloader.CorrectMatch(c.Request().Context(), body.ProviderID, body.NewAnilistID)
	if err != nil {
		return h.RespondWithError(c, err)
	}

	return h.RespondWithData(c, true)
}

type ConvertToSyntheticBody struct {
	ProviderID string `json:"providerId"`
}

// HandleConvertMangaToSynthetic
//
//	@summary convert an AniList manga match to synthetic.
//	@desc Converts an AniList match to a synthetic manga entry.
//	@returns bool
//	@route /api/v1/enmasse/manga/convert-synthetic [POST]
func (h *Handler) HandleConvertMangaToSynthetic(c echo.Context) error {
	var body ConvertToSyntheticBody
	if err := c.Bind(&body); err != nil {
		return h.RespondWithError(c, err)
	}

	if body.ProviderID == "" {
		return h.RespondWithError(c, echo.NewHTTPError(400, "provider ID is required"))
	}

	err := h.App.MangaEnMasseDownloader.ConvertToSynthetic(c.Request().Context(), body.ProviderID)
	if err != nil {
		return h.RespondWithError(c, err)
	}

	return h.RespondWithData(c, true)
}

// HandleScanMangaCollection
//
//	@summary scan existing manga collection for validation.
//	@desc Scans the user's existing manga collection (AniList + synthetic) and creates match records.
//	@returns bool
//	@route /api/v1/enmasse/manga/scan-collection [POST]
func (h *Handler) HandleScanMangaCollection(c echo.Context) error {
	err := h.App.MangaEnMasseDownloader.ScanExistingCollection(c.Request().Context())
	if err != nil {
		return h.RespondWithError(c, err)
	}

	return h.RespondWithData(c, true)
}

// HandleAutoMatchSyntheticManga
//
//	@summary auto-match synthetic manga to AniList.
//	@desc Scans all synthetic manga and attempts to find AniList matches for review.
//	@returns bool
//	@route /api/v1/enmasse/manga/auto-match-synthetic [POST]
func (h *Handler) HandleAutoMatchSyntheticManga(c echo.Context) error {
	err := h.App.MangaEnMasseDownloader.AutoMatchSyntheticManga(c.Request().Context())
	if err != nil {
		return h.RespondWithError(c, err)
	}

	return h.RespondWithData(c, true)
}
