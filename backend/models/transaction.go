package models

import (
	"time"

	"gorm.io/gorm"
)

type Transaction struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    uint           `gorm:"not null;index" json:"user_id"`
	Type      string         `gorm:"size:20;not null" json:"type"` // "income" or "expense"
	Amount    float64        `gorm:"not null" json:"amount"`
	Category  string         `gorm:"size:50;not null" json:"category"`
	Date      string         `gorm:"type:date;not null" json:"date"`
	Note      string         `gorm:"size:255" json:"note"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
