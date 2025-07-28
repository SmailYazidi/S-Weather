"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, MapPin, Thermometer, Wind, Droplets, Clock, Moon, Sun, Languages, Cloud, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_KEY = "f89347a1df5a4451afb202028252807" // Your WeatherAPI.com API Key

interface WeatherData {
  location: {
    name: string
    country: string
    lat: number
    lon: number
    localtime_epoch: number // Current local time in Unix epoch
  }
  current: {
    temp_c: number
    condition: {
      text: string
      icon: string
    }
    wind_kph: number
    humidity: number
  }
  forecast: {
    forecastday: Array<{
      date_epoch: number // Day's date in Unix epoch
      day: {
        maxtemp_c: number
        mintemp_c: number
        condition: {
          text: string
          icon: string
        }
      }
      hour: Array<{
        time_epoch: number // Hour's time in Unix epoch
        temp_c: number
        condition: {
          text: string
          icon: string
        }
        wind_kph: number
        humidity: number
      }>
    }>
  }
}

interface LocationData {
  name: string
  country: string
  lat: number
  lon: number
}

type Language = "en" | "ar" | "fr"
type Theme = "light" | "dark"
type ViewMode = "7-day" | "hourly"

const translations = {
  en: {
    appName: "S-Weather",
    title: "Weather Forecast",
    subtitle: "Get detailed weather information for any location",
    searchPlaceholder: "Enter city name (e.g., London, New York, Tokyo)",
    search: "Search",
    currentWeather: "Current Weather",
    sevenDayForecast: "7-Day Forecast",
    clickDay: "Click on any day to see hourly forecast",
    hourlyForecast: "Hourly Forecast for",
    date: "Date",
    weather: "Weather",
    minTemp: "Min Temp",
    maxTemp: "Max Temp",
    description: "Description",
    loading: "Loading weather data...",
    fetchingLocation: "Fetching your location...",
    locationDenied: "Location access denied. Please enable it in your browser settings or search for a city manually.",
    locationNotFound: "Location not found. Please try a different search.",
    searchError: "Failed to search location. Please try again.",
    weatherError: "Failed to fetch weather data. Please try again.",
    windSpeed: "Wind Speed",
    humidity: "Humidity",
    returnTo7Day: "Return to 7-Day Forecast",
  },
  ar: {
    appName: "إس-ويذر",
    title: "توقعات الطقس",
    subtitle: "احصل على معلومات مفصلة عن الطقس لأي موقع",
    searchPlaceholder: "أدخل اسم المدينة (مثل: لندن، نيويورك، طوكيو)",
    search: "بحث",
    currentWeather: "الطقس الحالي",
    sevenDayForecast: "توقعات 7 أيام",
    clickDay: "انقر على أي يوم لرؤية التوقعات بالساعة",
    hourlyForecast: "التوقعات بالساعة لـ",
    date: "التاريخ",
    weather: "الطقس",
    minTemp: "أدنى درجة حرارة",
    maxTemp: "أعلى درجة حرارة",
    description: "الوصف",
    loading: "جاري تحميل بيانات الطقس...",
    fetchingLocation: "جاري تحديد موقعك...",
    locationDenied: "تم رفض الوصول إلى الموقع. يرجى تمكينه في إعدادات متصفحك أو البحث عن مدينة يدويًا.",
    locationNotFound: "الموقع غير موجود. يرجى المحاولة بموقع آخر.",
    searchError: "فشل في البحث عن الموقع. يرجى المحاولة مرة أخرى.",
    weatherError: "فشل في جلب بيانات الطقس. يرجى المحاولة مرة أخرى.",
    windSpeed: "سرعة الرياح",
    humidity: "الرطوبة",
    returnTo7Day: "العودة إلى توقعات 7 أيام",
  },
  fr: {
    appName: "S-Météo",
    title: "Prévisions Météo",
    subtitle: "Obtenez des informations météorologiques détaillées pour n'importe quel endroit",
    searchPlaceholder: "Entrez le nom de la ville (ex: Londres, New York, Tokyo)",
    search: "Rechercher",
    currentWeather: "Météo Actuelle",
    sevenDayForecast: "Prévisions 7 Jours",
    clickDay: "Cliquez sur n'importe quel jour pour voir les prévisions horaires",
    hourlyForecast: "Prévisions Horaires pour",
    date: "Date",
    weather: "Météo",
    minTemp: "Temp Min",
    maxTemp: "Temp Max",
    description: "Description",
    loading: "Chargement des données météo...",
    fetchingLocation: "Recherche de votre position...",
    locationDenied: "Accès à la position refusé. Veuillez l'activer dans les paramètres de votre navigateur ou rechercher une ville manuellement.",
    locationNotFound: "Lieu non trouvé. Veuillez essayer une autre recherche.",
    searchError: "Échec de la recherche de lieu. Veuillez réessayer.",
    weatherError: "Échec de récupération des données météo. Veuillez réessayer.",
    windSpeed: "Vitesse du Vent",
    humidity: "Humidité",
    returnTo7Day: "Retour aux prévisions 7 jours",
  },
}

export default function WeatherApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start with loading for initial geolocation
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState("")
  const [theme, setTheme] = useState<Theme>("light")
  const [language, setLanguage] = useState<Language>("en")
  const [viewMode, setViewMode] = useState<ViewMode>("7-day")

  const t = translations[language]

  // Load theme and language from localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as Theme) || "light"
    const savedLanguage = (localStorage.getItem("language") as Language) || "en"

    setTheme(savedTheme)
    setLanguage(savedLanguage)
  }, [])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme])

  // Save language to localStorage and set text direction
  useEffect(() => {
    localStorage.setItem("language", language)
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
  }, [language])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  // --- Fetch Weather Data Function ---
  const fetchWeatherData = useCallback(async (query: string) => {
    setIsLoading(true)
    setIsSearching(false) // Reset search state if this is called from initial load
    setError("")
    setWeatherData(null) // Clear previous data
    setLocationData(null) // Clear previous location data
    setSelectedDayIndex(null)
    setViewMode("7-day") // Always default to 7-day forecast when new data is fetched

    try {
      // Use WeatherAPI.com's forecast endpoint which also handles location lookup
      // days=7 for 7-day forecast, aqi=no, alerts=no for lighter response
      const weatherResponse = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(query)}&days=7&aqi=no&alerts=no&lang=${language}`
      )

      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.json()
        if (errorData.error && errorData.error.code === 1006) {
          setError(t.locationNotFound)
          return
        }
        throw new Error("Failed to fetch weather data")
      }

      const data: WeatherData = await weatherResponse.json()
      setWeatherData(data)
      setLocationData({
        name: data.location.name,
        country: data.location.country,
        lat: data.location.lat,
        lon: data.location.lon,
      })
    } catch (err) {
      console.error("Weather fetch error:", err)
      setError(t.weatherError)
    } finally {
      setIsLoading(false)
    }
  }, [t.locationNotFound, t.weatherError, language]) // Dependencies for useCallback

  // --- Geolocation on Page Load ---
  useEffect(() => {
    setError("")
    setIsLoading(true) // Ensure loading state is active
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          // Fetch weather based on lat/lon from geolocation
          fetchWeatherData(`${latitude},${longitude}`)
        },
        (err) => {
          console.error("Geolocation error:", err)
          setIsLoading(false) // Stop loading even if error
          if (err.code === err.PERMISSION_DENIED) {
            setError(t.locationDenied)
          } else {
            setError(t.fetchingLocation) // Generic error
          }
        },
        {
          enableHighAccuracy: false, // High accuracy can be slower
          timeout: 10000, // 10 seconds timeout
          maximumAge: 60000, // Use cached position if less than 1 minute old
        }
      )
    } else {
      setIsLoading(false)
      setError("Geolocation is not supported by your browser.")
    }
  }, [fetchWeatherData, t.locationDenied, t.fetchingLocation]) // Depend on fetchWeatherData and translations

  // --- Search Location Manually ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError("") // Clear existing errors
    await fetchWeatherData(searchQuery.trim()) // Use the main fetch function
    setIsSearching(false)
  }

  // --- Date and Time Formatting ---
  const formatDate = (timestamp: number) => {
    const locale = language === "ar" ? "ar-SA" : language === "fr" ? "fr-FR" : "en-US"
    // WeatherAPI.com epoch is in seconds, Date expects milliseconds
    return new Date(timestamp * 1000).toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (timestamp: number) => {
    const locale = language === "ar" ? "ar-SA" : language === "fr" ? "fr-FR" : "en-US"
    // WeatherAPI.com epoch is in seconds, Date expects milliseconds
    return new Date(timestamp * 1000).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getWeatherIcon = (iconUrl: string) => {
    // WeatherAPI.com provides full URLs, sometimes they are missing 'https:'
    if (iconUrl.startsWith('//')) {
      return `https:${iconUrl}`;
    }
    return iconUrl;
  }

  // --- Handle Day Click for Hourly View ---
  const handleDayClick = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex)
    setViewMode("hourly")
  }

  // --- Get Hourly Data for Selected Day (and filter past hours for current day) ---
  const getHourlyDataForDay = (dayIndex: number) => {
    if (!weatherData || !weatherData.forecast.forecastday[dayIndex]) return []

    const selectedDayForecast = weatherData.forecast.forecastday[dayIndex].hour
    const today = new Date()
    const selectedDate = new Date(weatherData.forecast.forecastday[dayIndex].date_epoch * 1000)

    // Check if the selected day is today (ignoring time for date comparison)
    const isToday = today.getDate() === selectedDate.getDate() &&
                    today.getMonth() === selectedDate.getMonth() &&
                    today.getFullYear() === selectedDate.getFullYear()

    if (isToday) {
      // Filter out past hours for the current day
      const now = Date.now() / 1000; // Current time in seconds epoch
      return selectedDayForecast.filter(hour => hour.time_epoch >= now)
    }

    // For future days, show all hours
    return selectedDayForecast
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white"
          : "bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 text-gray-900"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
          theme === "dark" ? "bg-slate-900/80 border-slate-700" : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo and App Name */}
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-blue-500 to-purple-600"
                    : "bg-gradient-to-br from-blue-500 to-sky-600"
                } shadow-lg`}
              >
                <Cloud className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1
                  className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${
                    theme === "dark" ? "from-blue-400 to-purple-400" : "from-blue-600 to-purple-600"
                  } bg-clip-text text-transparent`}
                >
                  {t.appName}
                </h1>
                <p
                  className={`text-xs sm:text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  } hidden sm:block`}
                >
                  Weather Forecast App
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Language Selector */}
              <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
                <SelectTrigger
                  className={`w-[100px] sm:w-[130px] ${
                    theme === "dark"
                      ? "bg-slate-800 border-slate-600 hover:bg-slate-700"
                      : "bg-white border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Languages className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                </SelectContent>
              </Select>

              {/* Theme Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className={`shrink-0 ${
                  theme === "dark"
                    ? "bg-slate-800 border-slate-600 hover:bg-slate-700 text-yellow-400"
                    : "bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4 transition-transform hover:rotate-12" />
                ) : (
                  <Sun className="h-4 w-4 transition-transform hover:rotate-12" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Title Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r ${
              theme === "dark" ? "from-blue-400 via-purple-400 to-pink-400" : "from-blue-600 via-purple-600 to-pink-600"
            } bg-clip-text text-transparent`}
          >
            {t.title}
          </h2>
          <p
            className={`text-base sm:text-lg ${
              theme === "dark" ? "text-slate-300" : "text-slate-600"
            } max-w-2xl mx-auto`}
          >
            {t.subtitle}
          </p>
        </div>

        {/* Search Section */}
        <Card
          className={`mb-6 sm:mb-8 shadow-xl ${
            theme === "dark"
              ? "bg-slate-800/50 border-slate-700 backdrop-blur-sm"
              : "bg-white/70 border-slate-200 backdrop-blur-sm"
          }`}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className={`text-base sm:text-lg h-12 ${
                    theme === "dark"
                      ? "bg-slate-700/50 border-slate-600 focus:border-blue-400"
                      : "bg-white border-slate-300 focus:border-blue-500"
                  }`}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className={`px-6 sm:px-8 h-12 w-full sm:w-auto font-semibold ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                } text-white shadow-lg`}
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Search className="h-5 w-5" />
                )}
                <span className="ml-2">{t.search}</span>
              </Button>
            </div>

            {error && (
              <div
                className={`mt-4 p-4 rounded-lg border ${
                  theme === "dark"
                    ? "bg-red-900/30 border-red-800 text-red-300"
                    : "bg-red-50 border-red-300 text-red-700"
                }`}
              >
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Info */}
        {locationData && (
          <Card
            className={`mb-4 sm:mb-6 shadow-lg ${
              theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white/70 border-slate-200"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-lg sm:text-xl font-semibold">
                <MapPin
                  className={`h-5 w-5 sm:h-6 sm:w-6 shrink-0 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                />
                <span className="truncate">
                  {locationData.name}, {locationData.country}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card
            className={`shadow-lg ${
              theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white/70 border-slate-200"
            }`}
          >
            <CardContent className="p-8 sm:p-12 text-center">
              <div
                className={`animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-t-transparent mx-auto mb-6 ${
                  theme === "dark" ? "border-blue-400" : "border-blue-600"
                }`}
              ></div>
              <p className={`text-lg ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                {isSearching ? t.loading : t.fetchingLocation}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Weather Data */}
        {weatherData && !isLoading && (
          <>
            {/* Current Weather */}
            <Card
              className={`mb-6 shadow-xl ${
                theme === "dark"
                  ? "bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700"
                  : "bg-gradient-to-br from-white/80 to-blue-50/80 border-slate-200"
              }`}
            >
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-3 text-xl sm:text-2xl ${
                    theme === "dark" ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  <Thermometer className="h-6 w-6" />
                  {t.currentWeather}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <img
                      src={getWeatherIcon(weatherData.current.condition.icon) || "/placeholder.svg"}
                      alt={weatherData.current.condition.text}
                      className="w-16 h-16 sm:w-20 sm:h-20"
                    />
                    <div>
                      <div
                        className={`text-4xl sm:text-5xl font-bold ${
                          theme === "dark" ? "text-blue-300" : "text-blue-700"
                        }`}
                      >
                        {Math.round(weatherData.current.temp_c)}°C
                      </div>
                      <div
                        className={`text-base sm:text-lg capitalize ${
                          theme === "dark" ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {weatherData.current.condition.text}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6 sm:gap-8 text-sm sm:text-base ml-auto">
                    <div className="flex items-center gap-2">
                      <Wind className={`h-5 w-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                      <span>{weatherData.current.wind_kph} kph</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className={`h-5 w-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                      <span>{weatherData.current.humidity}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conditional Rendering for Forecast Views */}
            {viewMode === "7-day" && (
              <Card
                className={`mb-6 shadow-xl ${
                  theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white/70 border-slate-200"
                }`}
              >
                <CardHeader>
                  <CardTitle
                    className={`text-xl sm:text-2xl ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`}
                  >
                    {t.sevenDayForecast}
                  </CardTitle>
                  <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                    {t.clickDay}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className={`border-b ${theme === "dark" ? "border-slate-600" : "border-slate-300"}`}>
                          <th className="text-left py-3 px-2 text-sm sm:text-base font-semibold">{t.date}</th>
                          <th className="text-left py-3 px-2 text-sm sm:text-base font-semibold">{t.weather}</th>
                          <th className="text-left py-3 px-2 text-sm sm:text-base font-semibold">{t.minTemp}</th>
                          <th className="text-left py-3 px-2 text-sm sm:text-base font-semibold">{t.maxTemp}</th>
                          <th className="text-left py-3 px-2 text-sm sm:text-base font-semibold">{t.description}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weatherData.forecast.forecastday.map((day, index) => (
                          <tr
                            key={day.date_epoch}
                            className={`border-b cursor-pointer transition-all duration-200 ${
                              theme === "dark"
                                ? `border-slate-700 hover:bg-slate-700/50`
                                : `border-slate-200 hover:bg-blue-50`
                            }`}
                            onClick={() => handleDayClick(index)} // Always click to view hourly
                          >
                            <td className="py-3 px-2 font-medium text-sm sm:text-base">{formatDate(day.date_epoch)}</td>
                            <td className="py-3 px-2">
                              <img
                                src={getWeatherIcon(day.day.condition.icon) || "/placeholder.svg"}
                                alt={day.day.condition.text}
                                className="w-10 h-10 sm:w-12 sm:h-12"
                              />
                            </td>
                            <td className="py-3 px-2 text-sm sm:text-base">{Math.round(day.day.mintemp_c)}°C</td>
                            <td className="py-3 px-2 text-sm sm:text-base">{Math.round(day.day.maxtemp_c)}°C</td>
                            <td className="py-3 px-2 capitalize text-sm sm:text-base">{day.day.condition.text}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === "hourly" && selectedDayIndex !== null && (
              <Card
                className={`shadow-xl ${
                  theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white/70 border-slate-200"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle
                      className={`flex items-center gap-3 text-xl sm:text-2xl ${
                        theme === "dark" ? "text-green-400" : "text-green-600"
                      }`}
                    >
                      <Clock className="h-6 w-6" />
                      {t.hourlyForecast} {formatDate(weatherData.forecast.forecastday[selectedDayIndex].date_epoch)}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode("7-day")}
                      className={`font-semibold ${
                        theme === "dark"
                          ? "bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200"
                          : "bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {t.returnTo7Day}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {getHourlyDataForDay(selectedDayIndex).map((hour) => (
                      <div
                        key={hour.time_epoch}
                        className={`p-4 border rounded-xl shadow-lg transition-transform hover:scale-105 ${
                          theme === "dark"
                            ? "bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-slate-600"
                            : "bg-gradient-to-br from-white to-blue-50 border-slate-200"
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-lg mb-3">{formatTime(hour.time_epoch)}</div>
                          <img
                            src={getWeatherIcon(hour.condition.icon) || "/placeholder.svg"}
                            alt={hour.condition.text}
                            className="w-12 h-12 mx-auto mb-3"
                          />
                          <div
                            className={`text-2xl font-bold mb-2 ${
                              theme === "dark" ? "text-blue-300" : "text-blue-700"
                            }`}
                          >
                            {Math.round(hour.temp_c)}°C
                          </div>
                          <div
                            className={`text-sm capitalize mb-4 ${
                              theme === "dark" ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            {hour.condition.text}
                          </div>
                          <div
                            className={`space-y-2 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Wind className="h-4 w-4" />
                              {hour.wind_kph} kph
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <Droplets className="h-4 w-4" />
                              {hour.humidity}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}