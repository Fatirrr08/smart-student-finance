package controllers

import (
	"fmt"
	"net/http"

	"github.com/fatirgibran/smart-student-finance-tracker/backend/config"
	"github.com/fatirgibran/smart-student-finance-tracker/backend/models"
	"github.com/gin-gonic/gin"
)

func GetMonthlyReport(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	month := c.Query("month") // format YYYY-MM

	if month == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "month parameter is required (format YYYY-MM)"})
		return
	}

	var transactions []models.Transaction
	query := config.DB.Where("user_id = ? AND date LIKE ?", userID, fmt.Sprintf("%s%%", month))
	if err := query.Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve transactions"})
		return
	}

	totalIncome := 0.0
	totalExpense := 0.0
	categoryExpenses := make(map[string]float64)

	for _, t := range transactions {
		if t.Type == "income" {
			totalIncome += t.Amount
		} else if t.Type == "expense" {
			totalExpense += t.Amount
			categoryExpenses[t.Category] += t.Amount
		}
	}

	balance := totalIncome - totalExpense

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"month":             month,
			"total_income":      totalIncome,
			"total_expense":     totalExpense,
			"balance":           balance,
			"category_expenses": categoryExpenses,
			"transactions":      transactions,
		},
	})
}
