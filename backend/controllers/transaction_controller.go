package controllers

import (
	"fmt"
	"net/http"

	"github.com/fatirgibran/smart-student-finance-tracker/backend/config"
	"github.com/fatirgibran/smart-student-finance-tracker/backend/models"
	"github.com/gin-gonic/gin"
)

func GetTransactions(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	// Optional filters
	month := c.Query("month")
	category := c.Query("category")
	transType := c.Query("type")

	var transactions []models.Transaction
	query := config.DB.Where("user_id = ?", userID)

	if month != "" {
		// Assuming format YYYY-MM
		query = query.Where("date LIKE ?", fmt.Sprintf("%s%%", month))
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if transType != "" {
		query = query.Where("type = ?", transType)
	}

	if err := query.Order("date desc").Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve transactions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": transactions})
}

func CreateTransaction(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var input struct {
		Type     string  `json:"type" binding:"required,oneof=income expense"`
		Amount   float64 `json:"amount" binding:"required,gt=0"`
		Category string  `json:"category" binding:"required"`
		Date     string  `json:"date" binding:"required"`
		Note     string  `json:"note"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	transaction := models.Transaction{
		UserID:   userID,
		Type:     input.Type,
		Amount:   input.Amount,
		Category: input.Category,
		Date:     input.Date,
		Note:     input.Note,
	}

	if err := config.DB.Create(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": transaction})
}

func UpdateTransaction(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	transactionID := c.Param("id")

	var transaction models.Transaction
	if err := config.DB.Where("id = ? AND user_id = ?", transactionID, userID).First(&transaction).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	var input struct {
		Type     string  `json:"type" binding:"oneof=income expense"`
		Amount   float64 `json:"amount" binding:"gt=0"`
		Category string  `json:"category"`
		Date     string  `json:"date"`
		Note     string  `json:"note"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Type != "" {
		transaction.Type = input.Type
	}
	if input.Amount != 0 {
		transaction.Amount = input.Amount
	}
	if input.Category != "" {
		transaction.Category = input.Category
	}
	if input.Date != "" {
		transaction.Date = input.Date
	}
	transaction.Note = input.Note

	if err := config.DB.Save(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": transaction})
}

func DeleteTransaction(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	transactionID := c.Param("id")

	var transaction models.Transaction
	if err := config.DB.Where("id = ? AND user_id = ?", transactionID, userID).First(&transaction).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	if err := config.DB.Delete(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transaction deleted successfully"})
}
