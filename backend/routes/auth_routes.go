package routes

import (
	"github.com/fatirgibran/smart-student-finance-tracker/backend/controllers"
	"github.com/gin-gonic/gin"
)

func AuthRoutes(r *gin.RouterGroup) {
	auth := r.Group("/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
		auth.POST("/forgot-password", controllers.ForgotPassword)
		auth.POST("/reset-password", controllers.ResetPassword)
		auth.POST("/send-otp", controllers.SendOTP)
		auth.POST("/verify-otp", controllers.VerifyOTP)
		auth.GET("/search", controllers.SearchAccount)
	}
}
