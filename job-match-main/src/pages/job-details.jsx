// src/pages/JobDetailsPage.jsx
import { useLocation } from "react-router-dom";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Bookmark, 
  ArrowLeft
} from 'lucide-react';
import { Button, Badge } from "../components/ui";

export default function JobDetailsPage() {
  const { state } = useLocation();
  const job = state?.job;

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Job non trouvé</h1>
        <Link to="/jobs" className="text-purple-600 hover:underline">
          <ArrowLeft className="inline mr-2" />
          Retour aux offres
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link to="/jobs" className="text-purple-600 hover:underline">
            <ArrowLeft className="inline mr-2" />
            Retour aux offres
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
              <div className="flex items-center text-lg">
                <Briefcase className="h-5 w-5 mr-2" />
                <span className="font-medium">{job.company}</span>
              </div>
              <div className="flex items-center mt-2">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{job.location}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Type de contrat</p>
                  <p className="font-medium">{job.jobType}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Salaire</p>
                  <p className="font-medium">{job.salary}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Compétences requises</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <h3 className="text-xl font-bold mb-4">Description</h3>
            <div dangerouslySetInnerHTML={{ __html: job.description }} />
          </div>

          <div className="border-t pt-6">
            <Button 
              asChild 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                Postuler maintenant
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
