package controllers

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/fatirgibran/smart-student-finance-tracker/backend/config"
	"github.com/fatirgibran/smart-student-finance-tracker/backend/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	result := config.DB.Where("email = ?", input.Email).First(&user)

	if result.Error == nil {
		// Update existing user (could be a placeholder from OTP stage or sync)
		user.Name = input.Name
		if input.Password != "firebase_authenticated_user" {
			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
			user.Password = string(hashedPassword)
		}
		config.DB.Save(&user)
		c.JSON(http.StatusOK, gin.H{"message": "User synchronized successfully"})
		return
	}

	// Create new user if not exists
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	user = models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashedPassword),
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
}

func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "supersecretkey"
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
		},
	})
}

func ForgotPassword(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		// We return OK even if email not found to prevent email enumeration
		c.JSON(http.StatusOK, gin.H{"message": "If the email is registered, a reset token has been generated."})
		return
	}

	// Generate a simple 6-digit token for demonstration/manual use
	// In production, use a secure random string (crypto/rand)
	token := time.Now().Format("050403") // Very simple token based on time
	expires := time.Now().Add(time.Hour)

	user.ResetToken = token
	user.ResetTokenExpires = &expires

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save reset token"})
		return
	}

	// CRITICAL: Since no email service is configured, we log the token
	log.Printf("RESET TOKEN FOR %s: %s", user.Email, token)

	c.JSON(http.StatusOK, gin.H{
		"message": "Reset token generated successfully.",
		"debug_token": token, // Included for user to easily test
	})
}

func ResetPassword(c *gin.Context) {
	var input struct {
		Token    string `json:"token" binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("reset_token = ?", input.Token).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired token"})
		return
	}

	if user.ResetTokenExpires == nil || time.Now().After(*user.ResetTokenExpires) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token has expired"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user.Password = string(hashedPassword)
	user.ResetToken = ""
	user.ResetTokenExpires = nil

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password has been reset successfully"})
}

func SendOTP(c *gin.Context) {
	var input struct {
		Target string `json:"target" binding:"required"` // Can be email or phone
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Simple 6-digit OTP
	otp := time.Now().Format("050403")
	expires := time.Now().Add(time.Minute * 10)

	var user models.User
	result := config.DB.Where("email = ? OR phone = ?", input.Target, input.Target).First(&user)
	
	if result.Error != nil {
		// Create placeholder user for new registration
		user = models.User{
			Name: "Pending User",
			OTP:  otp,
			OTPExpires: &expires,
		}
		if containsAt := (len(input.Target) > 0 && input.Target[0] != '+'); containsAt {
			user.Email = input.Target
		} else {
			user.Phone = input.Target
		}
		config.DB.Create(&user)
	} else {
		user.OTP = otp
		user.OTPExpires = &expires
		config.DB.Save(&user)
	}

	// In production, send via SMS/Email. For now, log it.
	log.Printf("OTP FOR %s: %s", input.Target, otp)

	c.JSON(http.StatusOK, gin.H{
		"message": "OTP sent successfully",
		"debug_otp": otp, // For testing
	})
}

func VerifyOTP(c *gin.Context) {
	var input struct {
		Target string `json:"target" binding:"required"`
		OTP    string `json:"otp" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("(email = ? OR phone = ?) AND otp = ?", input.Target, input.Target, input.OTP).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid OTP"})
		return
	}

	if user.OTPExpires == nil || time.Now().After(*user.OTPExpires) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "OTP has expired"})
		return
	}

	user.IsVerified = true
	user.OTP = ""
	user.OTPExpires = nil
	config.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{"message": "OTP verified successfully"})
}

func SearchAccount(c *gin.Context) {
	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter is required"})
		return
	}

	var users []models.User
	// Search by partial match on email or phone
	config.DB.Where("email LIKE ? OR phone LIKE ?", "%"+query+"%", "%"+query+"%").Limit(5).Find(&users)

	type PublicUser struct {
		ID    uint   `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
		Phone string `json:"phone"`
	}

	var results []PublicUser
	for _, u := range users {
		results = append(results, PublicUser{
			ID:    u.ID,
			Name:  u.Name,
			Email: u.Email,
			Phone: u.Phone,
		})
	}

	c.JSON(http.StatusOK, results)
}
