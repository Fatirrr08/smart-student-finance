package main

import (
	"fmt"
	"log"

	"github.com/fatirgibran/smart-student-finance-tracker/backend/config"
	"github.com/fatirgibran/smart-student-finance-tracker/backend/models"
	"github.com/fatirgibran/smart-student-finance-tracker/backend/routes"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Connect to database
	config.ConnectDB()

	// Auto migrate schema
	models.AutoMigrate(config.DB)

	r := gin.Default()

	// Robust CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Register Routes
	api := r.Group("/api")
	{
		routes.AuthRoutes(api)
		routes.TransactionRoutes(api)
		routes.BudgetRoutes(api)
		routes.ReportRoutes(api)
	}

	fmt.Println("Server running on port 8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server", err)
	}
}
