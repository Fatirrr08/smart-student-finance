package controllers

import (
	"net/http"

	"github.com/fatirgibran/smart-student-finance-tracker/backend/config"
	"github.com/fatirgibran/smart-student-finance-tracker/backend/models"
	"github.com/gin-gonic/gin"
)

func GetBudgets(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var budgets []models.Budget
	if err := config.DB.Where("user_id = ?", userID).Find(&budgets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve budgets"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": budgets})
}

func CreateOrUpdateBudget(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var input struct {
		Category     string  `json:"category" binding:"required"`
		MonthlyLimit float64 `json:"monthly_limit" binding:"required,gt=0"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var budget models.Budget
	// Check if budget for category already exists
	if err := config.DB.Where("user_id = ? AND category = ?", userID, input.Category).First(&budget).Error; err != nil {
		// Not found, create new
		budget = models.Budget{
			UserID:       userID,
			Category:     input.Category,
			MonthlyLimit: input.MonthlyLimit,
		}
		if err := config.DB.Create(&budget).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create budget"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"data": budget})
		return
	}

	// Update existing
	budget.MonthlyLimit = input.MonthlyLimit
	if err := config.DB.Save(&budget).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update budget"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": budget})
}
