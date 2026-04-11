package db

import (
	"math"
	"seanime/internal/database/models"
	"time"
)

// GetLevelProgress returns the user's current level progress, creating it if it doesn't exist.
func (db *Database) GetLevelProgress() (*models.LevelProgress, error) {
	var lp models.LevelProgress
	result := db.gormdb.First(&lp)
	if result.Error != nil {
		// Create default
		lp = models.LevelProgress{
			TotalXP:      0,
			CurrentLevel: 1,
		}
		if err := db.gormdb.Create(&lp).Error; err != nil {
			return nil, err
		}
	}
	return &lp, nil
}

// AddXP adds XP to the user's level progress and returns (newLevel, leveled up, error).
func (db *Database) AddXP(xp int) (int, bool, error) {
	lp, err := db.GetLevelProgress()
	if err != nil {
		return 0, false, err
	}

	oldLevel := lp.CurrentLevel
	lp.TotalXP += xp
	lp.CurrentLevel = ComputeLevel(lp.TotalXP)

	if err := db.gormdb.Save(lp).Error; err != nil {
		return oldLevel, false, err
	}

	return lp.CurrentLevel, lp.CurrentLevel > oldLevel, nil
}

// ComputeLevel returns the level for a given total XP amount. No upper cap.
func ComputeLevel(totalXP int) int {
	if totalXP <= 0 {
		return 1
	}
	// Binary search for the highest level whose XP threshold ≤ totalXP.
	// XPForLevel grows as 100*(level-1)^1.5, so we find an upper bound first.
	lo, hi := 1, 2
	for XPForLevel(hi) <= totalXP {
		hi *= 2
	}
	for lo < hi {
		mid := (lo + hi + 1) / 2
		if XPForLevel(mid) <= totalXP {
			lo = mid
		} else {
			hi = mid - 1
		}
	}
	return lo
}

// XPForLevel returns the cumulative XP required to reach a given level.
// Level 1 = 0 XP, Level 2 = 100 XP, scaling with N^1.5
func XPForLevel(level int) int {
	if level <= 1 {
		return 0
	}
	return int(100 * math.Pow(float64(level-1), 1.5))
}

// XPToNextLevel returns the XP needed from current total to reach the next level.
func XPToNextLevel(totalXP int, currentLevel int) int {
	return XPForLevel(currentLevel+1) - totalXP
}

// SetXP directly sets the total XP and recomputes the current level.
func (db *Database) SetXP(totalXP int) error {
	lp, err := db.GetLevelProgress()
	if err != nil {
		return err
	}
	lp.TotalXP = totalXP
	lp.CurrentLevel = ComputeLevel(totalXP)
	return db.gormdb.Save(lp).Error
}

// GetXPVersion returns the current XP migration version from LevelProgress.
func (db *Database) GetXPVersion() (int, error) {
	lp, err := db.GetLevelProgress()
	if err != nil {
		return 0, err
	}
	return lp.XPVersion, nil
}

// SetXPVersion updates the XP migration version on the LevelProgress record.
func (db *Database) SetXPVersion(version int) error {
	lp, err := db.GetLevelProgress()
	if err != nil {
		return err
	}
	lp.XPVersion = version
	return db.gormdb.Save(lp).Error
}

// ComputeActivityMultiplier calculates the XP multiplier based on rolling 30-day activity hours.
// Every 50 hours in the last 30 days = +0.1x, capped at 2.0x.
func (db *Database) ComputeActivityMultiplier() (float64, error) {
	endDate := time.Now().Format("2006-01-02")
	startDate := time.Now().AddDate(0, 0, -30).Format("2006-01-02")

	logs, err := db.GetActivityLogs(startDate, endDate)
	if err != nil {
		return 1.0, err
	}

	totalMinutes := 0
	for _, log := range logs {
		totalMinutes += log.AnimeMinutes
		totalMinutes += log.MangaChapters * 7 // 7 min per chapter average
	}

	totalHours := float64(totalMinutes) / 60.0
	bonus := math.Floor(totalHours/50.0) * 0.1
	multiplier := 1.0 + bonus

	if multiplier > 2.0 {
		multiplier = 2.0
	}

	return multiplier, nil
}
