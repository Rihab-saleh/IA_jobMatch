"use client";

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function HomePage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    query: "",
    location: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/jobs?query=${encodeURIComponent(filters.query)}&location=${encodeURIComponent(filters.location)}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <section className="flex-1 bg-purple-50 flex items-center justify-center py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
                  Trouvez un emploi qui correspond à vos intérêts et compétences
                </h1>
                <Sparkles className="h-8 w-8 text-purple-700 hidden md:block" />
              </div>

              <p className="text-lg text-gray-600">
                Des milliers d'emplois dans tous les secteurs leaders vous attendent.
              </p>

              <form
                onSubmit={handleSearch}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      name="query"
                      value={filters.query}
                      onChange={handleInputChange}
                      placeholder="Titre du poste, Mot-clé..."
                      className="pl-12 py-3 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div className="relative flex-grow">
                    <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      name="location"
                      value={filters.location}
                      onChange={handleInputChange}
                      placeholder="Lieu"
                      className="pl-12 py-3 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-purple-700 hover:bg-purple-800 px-8 py-3 text-lg"
                  >
                    Trouver un emploi
                  </Button>
                </div>
                <div className="mt-4 text-md text-gray-500">
                  <span>Recherches populaires : </span>
                  <span className="text-gray-700">UI/UX Designer, Programmation, </span>
                  <span className="text-purple-700">Marketing Digital</span>
                  <span className="text-gray-700">, Vidéo, Animation</span>
                </div>
              </form>

              <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-lg p-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-6 w-6" />
                  <h2 className="text-xl font-semibold">Correspondance d'emplois alimentée par IA</h2>
                </div>
                <p className="text-md mb-4">
                  Notre IA analyse vos compétences et préférences pour trouver les meilleurs emplois pour vous.
                </p>
                <Link
                  to="/recommendations"
                  className="inline-flex items-center text-md font-medium text-white hover:underline"
                >
                  Voir vos recommandations personnalisées
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <img
                src="./src/assets/ai-help.png"
                alt="Illustration de recherche d'emploi"
                width={800}
                height={700}
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}