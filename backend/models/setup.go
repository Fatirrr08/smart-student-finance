package models

import (
	"fmt"
	"gorm.io/gorm"
)

func AutoMigrate(db *gorm.DB) {
	err := db.AutoMigrate(
		&User{},
		&Transaction{},
		&Budget{},
	)
	if err != nil {
		fmt.Printf("Error during auto migration: %v\n", err)
	} else {
		fmt.Println("Database migration completed successfully.")
	}
}
