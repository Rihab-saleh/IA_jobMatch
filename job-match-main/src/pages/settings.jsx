import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Bell, Lock, CreditCard, LogOut, Trash2, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/auth-context";

export default function SettingsPage() {
  const { user } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState({
    email: false,
    jobAlerts: false,
    applicationUpdates: false,
    frequency: "daily",
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simuler un chargement des paramètres
    const timer = setTimeout(() => {
      if (user) {
        setNotificationSettings({
          email: true,
          jobAlerts: true,
          applicationUpdates: true,
          frequency: "daily",
        });
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleNotificationToggle = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePrivacyToggle = (key) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFrequencyChange = (e) => {
    setNotificationSettings((prev) => ({
      ...prev,
      frequency: e.target.value,
    }));
  };

  const saveNotificationSettings = async () => {
    setSaving(true);
    try {
      // Simuler une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      const successMessage = document.getElementById("success-message");
      if (successMessage) {
        successMessage.classList.remove("hidden");
        setTimeout(() => successMessage.classList.add("hidden"), 3000);
      }
    } catch (error) {
      const errorMessage = document.getElementById("error-message");
      if (errorMessage) {
        errorMessage.classList.remove("hidden");
        setTimeout(() => errorMessage.classList.add("hidden"), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Error</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-700 hover:bg-blue-800">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 mb-8">Manage your account settings and preferences</p>

        <Tabs defaultValue="notifications" className="w-full">
          {/* ... reste du code JSX inchangé ... */}
        </Tabs>
      </div>
    </div>
  );
}