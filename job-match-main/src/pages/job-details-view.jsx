import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import {
  Bookmark,
  Share2,
  MapPin,
  Building,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Briefcase,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";

export default function JobDetailsView() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const job = state?.job;

  const toggleSaveJob = () => {
    setSaved(!saved);
    // API call to save job would go here
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-yellow-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Aucune offre d'emploi à afficher
          </h2>
          <p className="text-gray-600 mb-6">
            Nous n'avons pas trouvé de détails pour cette offre.
          </p>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour aux recommandations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with back button */}
          <div className="p-6 border-b border-gray-200">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2 text-gray-600 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Retour aux offres</span>
            </Button>
          </div>

          {/* Main content */}
          <div className="p-6 md:p-8">
            {/* Job header */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt={job.company}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <Building className="h-12 w-12 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700">
                        <Building className="h-4 w-4 mr-1.5 text-purple-500" />
                        {job.company || "Entreprise non spécifiée"}
                      </span>
                      <span className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700">
                        <MapPin className="h-4 w-4 mr-1.5 text-purple-500" />
                        {job.location || "Localisation non spécifiée"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant={saved ? "default" : "outline"}
                      onClick={toggleSaveJob}
                      className="gap-2"
                    >
                      <Bookmark
                        className={`h-4 w-4 ${saved ? "fill-white" : ""}`}
                      />
                      {saved ? "Sauvegardé" : "Sauvegarder"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleShare}
                      className="gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      {copied ? "Copié!" : "Partager"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Job metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Type de contrat</p>
                    <p className="font-medium text-gray-900">
                      {job.type || "Non spécifié"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Salaire</p>
                    <p className="font-medium text-gray-900">
                      {job.salary || "Non spécifié"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Expérience</p>
                    <p className="font-medium text-gray-900">
                      {job.experience || "Non spécifié"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Publié le</p>
                    <p className="font-medium text-gray-900">
                      {job.postedDate || "Date inconnue"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            {job.skills?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Compétences requises
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      className="bg-purple-100 text-purple-800 hover:bg-purple-200 text-sm py-1.5 px-3"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Job description */}
            <Card className="mb-8 border border-gray-200">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Description du poste
                </h2>
                <div className="prose max-w-none text-gray-700">
                  {job.description ? (
                    <div
                      className="whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: job.description }}
                    />
                  ) : (
                    <p className="text-gray-500">Aucune description fournie</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            {job.benefits?.length > 0 && (
              <Card className="mb-8 border border-gray-200">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Avantages
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {job.benefits.map((benefit, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={job.applyUrl || job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-purple-600 text-white hover:bg-purple-700 h-10 px-4 py-2 flex-1 gap-2"
              >
                Postuler maintenant
                <ExternalLink className="h-4 w-4" />
              </a>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                Voir d'autres offres
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}