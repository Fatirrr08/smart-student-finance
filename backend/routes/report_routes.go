package routes

import (
	"github.com/fatirgibran/smart-student-finance-tracker/backend/controllers"
	"github.com/fatirgibran/smart-student-finance-tracker/backend/middleware"
	"github.com/gin-gonic/gin"
)

func ReportRoutes(r *gin.RouterGroup) {
	reports := r.Group("/report")
	reports.Use(middleware.AuthMiddleware())
	{
		reports.GET("/monthly", controllers.GetMonthlyReport)
	}
}
