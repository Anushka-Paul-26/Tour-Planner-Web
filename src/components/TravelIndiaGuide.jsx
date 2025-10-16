import React, { useState, useCallback } from "react";
import {
  Search,
  MapPin,
  Globe,
  Loader2,
  AlertTriangle,
  BookOpen,
  Plane,
  Compass,
  Umbrella,
} from "lucide-react";

const apiKey = "AIzaSyDfwkrTbxsJ4RImahcrM-yyIPZYQJdAGOs";
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const apiUrl = `${API_BASE_URL}${GEMINI_MODEL}:generateContent?key=${apiKey}`;
const maxRetries = 3;

const LANDING_IMAGE_URL =
  "https://images.unsplash.com/photo-1564507572793-cd26038d17c7?q=80&w=2070&auto=format&fit=crop";
const VIDEO_URL =
  "https://www.incredibleindia.gov.in/content/dam/incredible-india/videos/home/Nature.mp4";
async function fetchWithRetry(url, options, retries = 0) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries < maxRetries) {
      const delay = Math.pow(2, retries) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries + 1);
    }
    throw error;
  }
}

function formatMarkdown(markdown) {
  let html = markdown;
  if (!html) return "";
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2 text-orange-600">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-extrabold mt-6 mb-3 text-indigo-800">$1</h2>');
  html = html.replace(/\*\*(Best Time to Visit.*)\*\*/gim, '<h2 class="text-2xl font-extrabold mt-6 mb-3 text-orange-700 p-3 bg-yellow-50 rounded-lg border-l-4 border-orange-500">$1</h2>');
  html = html
    .split("\n")
    .map((line) =>
      !line.match(/^(#|-|<h)/) && line.trim()
        ? `<p class="mb-3 text-gray-700 leading-relaxed">${line}</p>`
        : line
    )
    .join("");
  html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");
  html = html.replace(/^- (.*$)/gim, "<li><p class='font-medium text-gray-800'>$1</p></li>");
  html = html.replace(/(<li>.*?<\/li>)+/gs, "<ul class='list-disc space-y-2 pl-6 pt-2'>$1</ul>");
  return `<div class='space-y-4'>${html}</div>`;
}

const LandingPage = ({ onExplore }) => (
  <div className="relative w-full min-h-screen overflow-hidden bg-gray-900">
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover opacity-80"
      src={VIDEO_URL}
      poster={LANDING_IMAGE_URL}
    ></video>
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

    <div className="relative z-10 w-full text-center pt-20">
      <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">
        Explore <span className="text-lime-400">Incredible India</span>
      </h1>
      <p className="text-lg sm:text-2xl text-gray-200 mt-4">
        Where culture, nature, and heritage meet your wanderlust ✈️
      </p>
    </div>
    <button
      onClick={() => onExplore("")}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 py-3 px-10 bg-lime-600 text-white font-bold text-lg rounded-full shadow-xl hover:bg-lime-700 transform hover:scale-105 transition duration-300 z-10"
    >
      Explore Now
    </button>
  </div>
);

const TravelPlannerContent = ({ initialRegion }) => {
  const [regionInput, setRegionInput] = useState(initialRegion || "");
  const [interestInput, setInterestInput] = useState("");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const isInitialState = !loading && !error && !result;

  const fetchTravelInfo = useCallback(async () => {
    const region = regionInput.trim();
    const interest = interestInput.trim();

    if (!region) {
      setError("Please enter a region (e.g., Kerala, Rajasthan) to begin.");
      return;
    }

    setResult(null);
    setError(null);
    setLoading(true);

    const userQuery = `Provide the absolute **Best Time to Visit** ${region} and a 5-day itinerary focused on ${interest || "culture and sightseeing"}.`;
    const systemPrompt = `Act as an expert Indian travel guide. Respond in ${language}. Include sections with markdown formatting.`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const apiResult = await fetchWithRetry(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const candidate = apiResult.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      setResult({ text, sources: [] });
    } catch (e) {
      setError(`Network or API error. (${e.message})`);
    } finally {
      setLoading(false);
    }
  }, [regionInput, interestInput, language]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <header className="relative h-[350px] sm:h-[400px] flex flex-col items-center justify-center text-center overflow-hidden shadow-md">
        <div className="absolute inset-0 grid grid-cols-3 gap-1">
          <img
            src="https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1920&auto=format&fit=crop"
            alt="Taj Mahal"
            className="object-cover w-full h-full"
          />
          <img
            src="https://plus.unsplash.com/premium_photo-1697729600773-5b039ef17f3b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070"
            alt="Kerala Backwaters"
            className="object-cover w-full h-full"
          />
          <img
            src="https://images.unsplash.com/photo-1454496522488-7a8e488e8606?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1176"
            alt="Mountains"
            className="object-cover w-full h-full"
          />
        </div>

        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10">
          <h1 className="text-6xl font-extrabold text-white mb-3 drop-shadow-lg">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-400">
              Plan Your Trip
            </span>
          </h1>
          <p className="text-lg sm:text-2xl text-gray-100 font-semibold flex justify-center items-center gap-2 drop-shadow-md">
            <Compass className="w-6 h-6 text-yellow-200" /> Discover hidden gems of India
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto -mt-20 px-6 pb-16">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border-t-4 border-orange-600">
          <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-orange-600" />
            Start Planning
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="State/Region (e.g., Goa)"
                value={regionInput}
                onChange={(e) => setRegionInput(e.target.value)}
                className="w-full p-4 pl-10 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-lg font-medium transition duration-200"
              />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Interest (e.g., beaches, wildlife)"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                className="w-full p-4 pl-10 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-lg font-medium transition duration-200"
              />
            </div>

            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-4 pl-10 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-lg font-medium bg-white cursor-pointer"
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Bengali</option>
              </select>
            </div>
          </div>

          <button
            onClick={fetchTravelInfo}
            disabled={loading || !regionInput}
            className="w-full mt-6 py-4 bg-orange-600 text-white font-bold text-xl rounded-xl shadow-lg hover:bg-orange-700 transition duration-300 flex items-center justify-center space-x-3 disabled:bg-gray-400"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plane className="w-6 h-6" />}
            <span>{loading ? "Crafting your journey..." : "Generate My Itinerary"}</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 p-6 mt-8 rounded-xl border-2 border-red-400 text-red-800 flex items-center space-x-3 shadow-md">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold text-lg">Error:</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {isInitialState && (
          <div className="bg-white mt-10 p-10 rounded-3xl shadow-inner text-center border-4 border-dashed border-gray-200">
            <Umbrella className="w-12 h-12 mx-auto mb-4 text-orange-500" />
            <p className="text-xl font-semibold text-gray-600">
              Ready to explore? Enter a region and your interests above.
            </p>
            <p className="text-gray-500 mt-2">Try “Kerala”, “Rajasthan” or “Himalayas” 🌄</p>
          </div>
        )}

        {result && (
          <div className="bg-white p-8 mt-10 rounded-3xl shadow-2xl border-l-8 border-orange-600 transition-all duration-500">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-2 pb-2">
              Your Personalized Travel Plan ✨
            </h2>
            <div
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(result.text) }}
            />
          </div>
        )}
      </main>
    </div>
  );
};
const App = () => {
  const [currentPage, setCurrentPage] = useState("landing");
  const [initialRegion, setInitialRegion] = useState("");
  return currentPage === "landing" ? (
    <LandingPage onExplore={() => setCurrentPage("planner")} />
  ) : (
    <TravelPlannerContent initialRegion={initialRegion} />
  );
};

export default App;
