package config

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" { dbHost = "localhost" }
	
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" { dbUser = "admin" }
	
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" { dbPassword = "adminpassword" }
	
	dbName := os.Getenv("DB_NAME")
	if dbName == "" { dbName = "finance_tracker" }
	
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" { dbPort = "5432" }

	dbSSL := os.Getenv("DB_SSL")
	if dbSSL == "" { 
		if dbHost == "localhost" || dbHost == "127.0.0.1" {
			dbSSL = "disable"
		} else {
			dbSSL = "require" 
		}
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
		dbHost, dbUser, dbPassword, dbName, dbPort, dbSSL)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("Connected to Postgres Database successfully")
}
