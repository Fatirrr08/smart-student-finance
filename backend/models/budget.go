package models

import (
	"time"

	"gorm.io/gorm"
)

type Budget struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	UserID       uint           `gorm:"not null;index;uniqueIndex:idx_user_category" json:"user_id"`
	Category     string         `gorm:"size:50;not null;uniqueIndex:idx_user_category" json:"category"`
	MonthlyLimit float64        `gorm:"not null" json:"monthly_limit"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
