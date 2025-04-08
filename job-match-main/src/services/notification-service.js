
export async function saveNotificationSettings(settings) {
    try {
      const response = await fetch("/api/user/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })
  
      const data = await response.json()
  
      return {
        success: response.ok,
        message: data.message || (response.ok ? "Settings saved successfully" : "Failed to save settings"),
      }
    } catch (error) {
      console.error("Error saving notification settings:", error)
      return {
        success: false,
        message: "An error occurred while saving settings",
      }
    }
  }
  
  /**
   * Gets the user's notification settings
   * @returns {Promise<Object|null>} The user's notification settings or null if an error occurs
   */
  export async function getUserNotificationSettings() {
    try {
      const response = await fetch("/api/user/notifications")
  
      if (!response.ok) {
        throw new Error("Failed to fetch notification settings")
      }
  
      const data = await response.json()
      return data.settings
    } catch (error) {
      console.error("Error fetching notification settings:", error)
      return null
    }
  }
  
  /**
   * Sends a test notification
   * @param {string} channel - The channel to send the notification through (email, sms, browser)
   * @param {string} email - The user's email (required for email notifications)
   * @returns {Promise<Object>} Result of the test notification
   */
  export async function sendTestNotification(channel, email = null) {
    try {
      const response = await fetch("/api/user/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel, email }),
      })
  
      const data = await response.json()
      
      return {
        success: response.ok,
        message: data.message || (response.ok ? "Test notification sent" : "Failed to send test notification"),
        data: data.data
      }
    } catch (error) {
      console.error("Error sending test notification:", error)
      return {
        success: false,
        message: "An error occurred while sending test notification",
      }
    }
  }
  
  /**
   * Subscribes to browser notifications
   * @returns {Promise<boolean>} Whether the subscription was successful
   */
  export async function subscribeToBrowserNotifications() {
    try {
      // Check if the browser supports notifications
      if (!("Notification" in window)) {
        console.error("This browser does not support desktop notifications")
        return false
      }
  
      // Request permission
      const permission = await Notification.requestPermission()
  
      if (permission === "granted") {
        // In a real app, you would register the push subscription with your server
        return true
      } else {
        console.log("Notification permission denied")
        return false
      }
    } catch (error) {
      console.error("Error subscribing to browser notifications:", error)
      return false
    }
  }
  
  /**
   * Displays a browser notification
   * @param {string} title - The notification title
   * @param {string} body - The notification body
   * @param {string} icon - The notification icon URL
   * @returns {Promise<boolean>} Whether the notification was displayed
   */
  export async function showBrowserNotification(title, body, icon = '/favicon.ico') {
    try {
      // Vérifier si les notifications sont supportées
      if (!("Notification" in window)) {
        console.error("Ce navigateur ne supporte pas les notifications")
        return false
      }
  
      // Vérifier si la permission est déjà accordée
      if (Notification.permission === "granted") {
        // Afficher la notification
        const notification = new Notification(title, {
          body,
          icon
        })
        
        // Ajouter un gestionnaire de clic
        notification.onclick = function() {
          window.focus()
          notification.close()
        }
        
        return true
      } 
      // Demander la permission si elle n'est pas encore déterminée
      else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission()
        
        if (permission === "granted") {
          // Afficher la notification
          const notification = new Notification(title, {
            body,
            icon
          })
          
          // Ajouter un gestionnaire de clic
          notification.onclick = function() {
            window.focus()
            notification.close()
          }
          
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error("Erreur lors de l'affichage de la notification:", error)
      return false
    }
  }