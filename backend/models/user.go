package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	Email              string         `gorm:"size:100;unique;not null" json:"email"`
	Phone              string         `gorm:"size:20;unique" json:"phone"`
	IsVerified         bool           `gorm:"default:false" json:"is_verified"`
	OTP                string         `gorm:"size:10" json:"-"`
	OTPExpires         *time.Time     `json:"-"`
	Password           string         `gorm:"size:255;not null" json:"-"`
	ResetToken         string         `gorm:"size:255" json:"-"`
	ResetTokenExpires  *time.Time     `json:"-"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"-"`
}
