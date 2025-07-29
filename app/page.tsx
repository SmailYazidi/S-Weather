"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, MapPin, Thermometer, Wind, Droplets, Clock, Moon, Sun, Languages, Cloud, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"; 
const API_KEY = "f89347a1df5a4451afb202028252807" // Your WeatherAPI.com API Key

interface WeatherData {
  location: {
    name: string
    country: string
    lat: number
    lon: number
    localtime_epoch: number
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
      date_epoch: number
      day: {
        maxtemp_c: number
        mintemp_c: number
        condition: {
          text: string
          icon: string
        }
      }
      hour: Array<{
        time_epoch: number
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
    appName: "Weather",
    title: "Weather Forecast",
    subtitle: "Get detailed weather information for any location",
    searchPlaceholder: "Enter city name...",
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
    fetchingLocation: "Detecting your location...",
    locationDenied: "Could not detect your location automatically. Please search for a city.",
    locationNotFound: "Location not found. Please try a different search.",
    searchError: "Failed to search location. Please try again.",
    weatherError: "Failed to fetch weather data. Please try again.",
    windSpeed: "Wind Speed",
    humidity: "Humidity",
    returnTo7Day: "Return to 7-Day Forecast",
  },
  ar: {
    appName: "الطقس",
    title: "توقعات الطقس",
    subtitle: "احصل على معلومات مفصلة عن الطقس لأي موقع",
    searchPlaceholder: "أدخل اسم المدينة...",
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
    fetchingLocation: "جاري تحديد موقعك تلقائيًا...",
    locationDenied: "تعذر تحديد موقعك تلقائيًا. يرجى البحث عن مدينة.",
    locationNotFound: "الموقع غير موجود. يرجى المحاولة بموقع آخر.",
    searchError: "فشل في البحث عن الموقع. يرجى المحاولة مرة أخرى.",
    weatherError: "فشل في جلب بيانات الطقس. يرجى المحاولة مرة أخرى.",
    windSpeed: "سرعة الرياح",
    humidity: "الرطوبة",
    returnTo7Day: "العودة إلى توقعات 7 أيام",
  },
  fr: {
    appName: "Météo",
    title: "Prévisions Météo",
    subtitle: "Obtenez des informations météorologiques détaillées pour n'importe quel endroit",
    searchPlaceholder: "Entrez le nom de la ville... ",
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
    fetchingLocation: "Détection automatique de votre position...",
    locationDenied: "Impossible de détecter votre position automatiquement. Veuillez rechercher une ville.",
    locationNotFound: "Lieu non trouvé. Veuillez essayer une autre recherche.",
    searchError: "Échec de la recherche de lieu. Veuillez réessayer.",
    weatherError: "Échec de récupération des données météo. Veuillez réessayer.",
    windSpeed: "Vitesse du Vent",
    humidity: "Humidité",
    returnTo7Day: "Retour aux prévisions 7 jours",
  },
}

const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/ip.json?key=${API_KEY}&q=auto:ip`
    );
    if (!response.ok) {
        const errorData = await response.json();
        console.error("IP Location API Error:", errorData);
        throw new Error("Failed to get current location via IP");
    }

    const data = await response.json();

    return {
      name: data.city,
      country: data.country,
      lat: data.lat,
      lon: data.lon,
    };
  } catch (err) {
    console.error("Location fetch error:", err);
    return null;
  }
};

export default function WeatherApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState("")
  const [theme, setTheme] = useState<Theme>("light")
  const [language, setLanguage] = useState<Language>("en")
  const [viewMode, setViewMode] = useState<ViewMode>("7-day")
  const tableRef = useRef<HTMLDivElement>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const t = translations[language]

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as Theme) || "dark"
    const savedLanguage = (localStorage.getItem("language") as Language) || "en"

    setTheme(savedTheme)
    setLanguage(savedLanguage)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

    // Only refresh weather data if we already have data for a location
    if (weatherData) {
      fetchWeatherData(weatherData.location.name);
    }
  }, [language]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const fetchWeatherData = useCallback(async (query: string) => {
    setIsLoading(true);
    setIsSearching(false);
    setError("");
    setSelectedDayIndex(null);
    setViewMode("7-day");

    try {
      const weatherResponse = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(query)}&days=7&aqi=no&alerts=no&lang=${language}`
      );

      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.json();
        if (errorData.error && errorData.error.code === 1006) {
          setError(t.locationNotFound);
          return;
        }
        throw new Error("Failed to fetch weather data");
      }

      const data: WeatherData = await weatherResponse.json();
      setWeatherData(data);
      setLocationData({
        name: data.location.name,
        country: data.location.country,
        lat: data.location.lat,
        lon: data.location.lon,
      });
      setSearchQuery(data.location.name); // Update search query to match the resolved location
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError(t.weatherError);
    } finally {
      setIsLoading(false);
    }
  }, [t.locationNotFound, t.weatherError, language]);

  useEffect(() => {
    setError("")
    setIsLoading(true)

    const initializeLocation = async () => {
      if (!hasSearched) {
        const detectedLocation = await getCurrentLocation();
        if (detectedLocation) {
          fetchWeatherData(`${detectedLocation.lat},${detectedLocation.lon}`);
        } else {
          setIsLoading(false);
          setError(t.locationDenied);
        }
      } else {
        setIsLoading(false);
      }
    };

    initializeLocation();
  }, [fetchWeatherData, t.locationDenied, hasSearched]);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    setHasSearched(true);
    fetchWeatherData(searchQuery);
  }, [searchQuery, fetchWeatherData]);

  const formatDate = (timestamp: number) => {
    const locale = language === "ar" ? "ar-SA" : language === "fr" ? "fr-FR" : "en-US"
    return new Date(timestamp * 1000).toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (timestamp: number) => {
    const locale = language === "ar" ? "ar-SA" : language === "fr" ? "fr-FR" : "en-US"
    return new Date(timestamp * 1000).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getWeatherIcon = (iconUrl: string) => {
    if (iconUrl.startsWith('//')) {
      return `https:${iconUrl}`;
    }
    return iconUrl;
  }

  const handleDayClick = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex)
    setViewMode("hourly")
  }

  const getHourlyDataForDay = (dayIndex: number) => {
    if (!weatherData || !weatherData.forecast.forecastday[dayIndex]) return []

    const selectedDayForecast = weatherData.forecast.forecastday[dayIndex].hour
    const today = new Date()
    const selectedDate = new Date(weatherData.forecast.forecastday[dayIndex].date_epoch * 1000)

    const isToday = today.getDate() === selectedDate.getDate() &&
                    today.getMonth() === selectedDate.getMonth() &&
                    today.getFullYear() === selectedDate.getFullYear()

    if (isToday) {
      const now = Date.now() / 1000;
      return selectedDayForecast.filter(hour => hour.time_epoch >= now)
    }

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
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-wrap">
              {/* Search Input */}
              <div className="flex-1 w-full">
                <Input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className={`w-full text-base sm:text-lg h-12 sm:h-12 ${
                    theme === "dark"
                      ? "bg-slate-700/50 border-slate-600 focus:border-blue-400"
                      : "bg-white border-slate-300 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Search Button */}
              <div className="w-full sm:w-auto">
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className={`w-full sm:w-auto h-12 px-6 sm:px-8 flex items-center justify-center font-semibold ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  } text-white shadow-lg transition-colors duration-200`}
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                  <span className="ml-2">{t.search}</span>
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className={`mt-4 p-4 rounded-lg border text-sm sm:text-base ${
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
                <div className="grid grid-cols-1 sm:flex sm:flex-row items-start sm:items-center gap-y-6 gap-x-6 sm:gap-6">
                  {/* Temperature + Icon Block */}
                  <div className="flex items-center gap-4 sm:gap-6">
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

                  {/* Wind + Humidity Block */}
                  <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-8 text-sm sm:text-base sm:ml-auto w-full sm:w-auto">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <Wind className={`h-5 w-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                      <span>{weatherData.current.wind_kph} kph</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <Droplets className={`h-5 w-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                      <span>{weatherData.current.humidity}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {viewMode === "7-day" && (
              <Card
                className={`mb-6 shadow-xl ${
                  theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white/70 border-slate-200"
                }`}
              >
                <CardHeader
                  className="w-full flex flex-col space-y-2 sm:space-y-2"
                  dir={language === "ar" ? "rtl" : "ltr"}
                  style={{ minWidth: 0 }}
                >
                  <CardTitle
                    className={`w-full text-lg sm:text-2xl font-bold ${
                      theme === "dark" ? "text-purple-400" : "text-purple-600"
                    }`}
                    style={{ minWidth: 0 }}
                  >
                    {t.sevenDayForecast}
                  </CardTitle>
                  <CardTitle
                    className={`w-full text-sm sm:text-base leading-snug ${
                      theme === "dark" ? "text-slate-400" : "text-slate-600"
                    }`}
                    style={{
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      direction: language === "ar" ? "rtl" : "ltr",
                      minWidth: 0,
                      maxWidth: "100%",
                    }}
                  >
                    {t.clickDay}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="relative">
                    {/* Scroll buttons */}
                    <button
                      className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 p-1 rounded-full shadow z-10"
                      onClick={() => tableRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                      className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 p-1 rounded-full shadow z-10"
                      onClick={() => tableRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    <div ref={tableRef} className="overflow-x-auto scroll-smooth">
                      <table className="w-full min-w-[540px] sm:min-w-[600px] text-sm sm:text-base">
                        <thead>
                          <tr className={`border-b ${theme === "dark" ? "border-slate-600" : "border-slate-300"}`}>
                            <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">{t.date}</th>
                            <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">{t.weather}</th>
                            <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">{t.minTemp}</th>
                            <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">{t.maxTemp}</th>
                            <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">{t.description}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weatherData.forecast.forecastday.map((day, index) => (
                            <tr
                              key={day.date_epoch}
                              className={`border-b cursor-pointer transition-colors ${
                                theme === "dark"
                                  ? "border-slate-700 hover:bg-slate-700/50"
                                  : "border-slate-200 hover:bg-blue-50"
                              }`}
                              onClick={() => handleDayClick(index)}
                            >
                              <td className="py-3 px-2 font-medium whitespace-nowrap">{formatDate(day.date_epoch)}</td>
                              <td className="py-3 px-2">
                                <img
                                  src={getWeatherIcon(day.day.condition.icon) || "/placeholder.svg"}
                                  alt={day.day.condition.text}
                                  className="w-8 h-8 sm:w-10 sm:h-10"
                                />
                              </td>
                              <td className="py-3 px-2 whitespace-nowrap">{Math.round(day.day.mintemp_c)}°C</td>
                              <td className="py-3 px-2 whitespace-nowrap">{Math.round(day.day.maxtemp_c)}°C</td>
                              <td className="py-3 px-2 capitalize whitespace-nowrap">{day.day.condition.text}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                  <div
                    className={`grid gap-4 mb-4 ${
                      language === "ar" ? "rtl" : "ltr"
                    } lg:grid-cols-1 lg:justify-items-center`}
                  >
                    {/* First line: Return button */}
                    <div className="justify-self-center sm:justify-self-start lg:justify-self-center">
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
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        {t.returnTo7Day}
                      </Button>
                    </div>

                    {/* Second line: navigation buttons with date */}
                    <div
                      className="flex justify-center items-center gap-4 text-lg font-bold text-slate-500 dark:text-slate-400
                                  lg:text-2xl"
                    >
                      {/* Next Day */}
                      <button
                        onClick={() =>
                          setSelectedDayIndex((prev) =>
                            Math.min(prev + 1, weatherData.forecast.forecastday.length - 1)
                          )
                        }
                        disabled={selectedDayIndex === weatherData.forecast.forecastday.length - 1}
                        className="px-2 py-1 disabled:opacity-30 lg:px-4 lg:py-2"
                        aria-label="Next Day"
                      >
                        {language === "ar" ? ">" : "<"}
                      </button>

                      {/* Date */}
                      <div className="whitespace-nowrap">
                        {formatDate(weatherData.forecast.forecastday[selectedDayIndex].date_epoch)}
                      </div>

                      {/* Previous Day */}
                      <button
                        onClick={() => setSelectedDayIndex((prev) => Math.max(prev - 1, 0))}
                        disabled={selectedDayIndex === 0}
                        className="px-2 py-1 disabled:opacity-30 lg:px-4 lg:py-2"
                        aria-label="Previous Day"
                      >
                        {language === "ar" ? "<" : ">"}
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getHourlyDataForDay(selectedDayIndex).map((hour) => (
                      <div
                        key={hour.time_epoch}
                        className={`p-4 border rounded-xl shadow-lg transition-transform hover:scale-[1.02] ${
                          theme === "dark"
                            ? "bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-slate-600"
                            : "bg-gradient-to-br from-white to-blue-50 border-slate-200"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 text-sm sm:text-base">
                          {/* Time */}
                          <div className="font-semibold w-20">{formatTime(hour.time_epoch)}</div>

                          {/* Icon */}
                          <img
                            src={getWeatherIcon(hour.condition.icon) || "/placeholder.svg"}
                            alt={hour.condition.text}
                            className="w-8 h-8"
                          />

                          {/* Temperature */}
                          <div className={`font-bold text-lg sm:text-xl ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                            {Math.round(hour.temp_c)}°C
                          </div>

                          {/* Condition Text */}
                          <div className={`capitalize truncate max-w-[100px] sm:max-w-[150px] ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                            {hour.condition.text}
                          </div>

                          {/* Wind */}
                          <div className="flex items-center gap-1 w-24 justify-start">
                            <Wind className="h-4 w-4" />
                            {hour.wind_kph} kph
                          </div>

                          {/* Humidity */}
                          <div className="flex items-center gap-1 w-20 justify-start">
                            <Droplets className="h-4 w-4" />
                            {hour.humidity}%
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