package routes

import (
	"github.com/fatirgibran/smart-student-finance-tracker/backend/controllers"
	"github.com/fatirgibran/smart-student-finance-tracker/backend/middleware"
	"github.com/gin-gonic/gin"
)

func TransactionRoutes(r *gin.RouterGroup) {
	transactions := r.Group("/transactions")
	transactions.Use(middleware.AuthMiddleware()) // Protected route
	{
		transactions.GET("", controllers.GetTransactions)
		transactions.POST("", controllers.CreateTransaction)
		transactions.PUT("/:id", controllers.UpdateTransaction)
		transactions.DELETE("/:id", controllers.DeleteTransaction)
	}
}
