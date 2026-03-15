package routes

import (
	"github.com/fatirgibran/smart-student-finance-tracker/backend/controllers"
	"github.com/fatirgibran/smart-student-finance-tracker/backend/middleware"
	"github.com/gin-gonic/gin"
)

func BudgetRoutes(r *gin.RouterGroup) {
	budgets := r.Group("/budget")
	budgets.Use(middleware.AuthMiddleware())
	{
		budgets.GET("", controllers.GetBudgets)
		budgets.POST("", controllers.CreateOrUpdateBudget)
	}
}
