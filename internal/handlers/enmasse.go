package handlers

import (
	"errors"
	"strconv"

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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Global En Masse Downloader (anime-offline-database)
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// HandleGlobalEnMasseGetStatus
//
//	@summary get the status of the global en masse downloader.
//	@desc Returns the current status of the global en masse downloader including progress and current anime.
//	@returns enmasse.GlobalDownloaderStatus
//	@route /api/v1/enmasse/global/status [GET]
func (h *Handler) HandleGlobalEnMasseGetStatus(c echo.Context) error {
	status := h.App.GlobalEnMasseDownloader.GetStatus()
	return h.RespondWithData(c, status)
}

type GlobalEnMasseStartBody struct {
	Resume bool `json:"resume"`
}

// HandleGlobalEnMasseStart
//
//	@summary start the global en masse downloader.
//	@desc Starts the global en masse downloader to process anime from anime-offline-database.
//	@returns bool
//	@route /api/v1/enmasse/global/start [POST]
func (h *Handler) HandleGlobalEnMasseStart(c echo.Context) error {
	var body GlobalEnMasseStartBody
	if err := c.Bind(&body); err != nil {
		body.Resume = false
	}

	err := h.App.GlobalEnMasseDownloader.Start(body.Resume)
	if err != nil {
		return h.RespondWithError(c, err)
	}
	return h.RespondWithData(c, true)
}

type GlobalEnMasseStopBody struct {
	SaveProgress bool `json:"saveProgress"`
}

// HandleGlobalEnMasseStop
//
//	@summary stop the global en masse downloader.
//	@desc Stops the global en masse downloader if it's running.
//	@returns bool
//	@route /api/v1/enmasse/global/stop [POST]
func (h *Handler) HandleGlobalEnMasseStop(c echo.Context) error {
	var body GlobalEnMasseStopBody
	if err := c.Bind(&body); err != nil {
		body.SaveProgress = true // Default to saving progress
	}

	h.App.GlobalEnMasseDownloader.Stop(body.SaveProgress)
	return h.RespondWithData(c, true)
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Synthetic Anime
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// HandleSearchSyntheticAnime
//
//	@summary searches for synthetic anime by title.
//	@desc Returns synthetic anime entries that match the search query.
//	@route /api/v1/anime/synthetic/search [POST]
//	@returns []*models.SyntheticAnime
func (h *Handler) HandleSearchSyntheticAnime(c echo.Context) error {
	type body struct {
		Query string `json:"query"`
		Limit int    `json:"limit"`
	}

	var b body
	if err := c.Bind(&b); err != nil {
		return h.RespondWithError(c, err)
	}

	if b.Query == "" {
		return h.RespondWithData(c, []*interface{}{})
	}

	results, err := h.App.Database.SearchSyntheticAnime(b.Query, b.Limit)
	if err != nil {
		return h.RespondWithError(c, err)
	}

	return h.RespondWithData(c, results)
}

// HandleGetSyntheticAnimeDetails
//
//	@summary returns details about a synthetic anime entry.
//	@desc Returns full details for a synthetic anime by its synthetic ID.
//	@route /api/v1/anime/synthetic/:id [GET]
//	@param id - int - true - "Synthetic anime ID (negative number)"
//	@returns models.SyntheticAnime
func (h *Handler) HandleGetSyntheticAnimeDetails(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return h.RespondWithError(c, err)
	}

	syntheticAnime, found := h.App.Database.GetSyntheticAnime(id)
	if !found {
		return h.RespondWithError(c, errors.New("synthetic anime not found"))
	}

	return h.RespondWithData(c, syntheticAnime)
}

// HandleGetAllSyntheticAnime
//
//	@summary returns all synthetic anime entries.
//	@desc Returns all synthetic anime from the database.
//	@route /api/v1/anime/synthetic/all [GET]
//	@returns []*models.SyntheticAnime
func (h *Handler) HandleGetAllSyntheticAnime(c echo.Context) error {
	results, err := h.App.Database.GetAllSyntheticAnime()
	if err != nil {
		return h.RespondWithError(c, err)
	}
	return h.RespondWithData(c, results)
}
