// src/pages/AdminPage.js
"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Sparkles,
  User,
} from "lucide-react";
import { adminService } from "../services/admin-service";

export default function AdminPage() {
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [apiIntegrations, setApiIntegrations] = useState([
    { id: 1, name: "Adzuna API", status: "Connected", lastSync: "2 hours ago", jobsImported: 2458 },
    { id: 2, name: "LinkedIn Jobs API", status: "Disconnected", lastSync: "Never" }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scrapedJobs, externalJobs, usersData] = await Promise.all([
          adminService.getAllScrapedJobs(),
          adminService.getAllExternalJobs(),
          adminService.getAllUsers()
        ]);

        // Fix: Handle potentially undefined data arrays
        const scrapedJobsArray = scrapedJobs.data || [];
        const externalJobsArray = externalJobs.data || [];
        const usersArray = usersData.data || [];

        setJobs([
          ...scrapedJobsArray.map(job => ({ ...job, source: 'scraped' })),
          ...externalJobsArray.map(job => ({ ...job, source: 'external' }))
        ]);
        setUsers(usersArray);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const deleteJob = async (id) => {
    try {
      await adminService.deleteJob(id);
      setJobs(jobs.filter(job => job.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteUser = async (id) => {
    try {
      await adminService.deleteUser(id);
      setUsers(users.filter(user => user.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleApiStatus = async (id) => {
    setApiIntegrations(apiIntegrations?.map(api => 
      api.id === id ? { ...api, status: api.status === "Connected" ? "Disconnected" : "Connected" } : api
    ) || []);
  };

  if (loading) return <div className="text-center py-8">Chargement...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Erreur : {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Tableau de bord administrateur</h1>
        
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Offres d'emploi" 
            value={jobs.length} 
            trend="12%"
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatCard
            title="Utilisateurs"
            value={users.length}
            trend="8%"
            icon={<User className="h-5 w-5" />}
          />
          <StatCard
            title="Candidatures"
            value={3845}
            trend="15%"
            icon={<Sparkles className="h-5 w-5" />}
          />
          <StatCard
            title="API Connectées"
            value={`${apiIntegrations.filter(api => api.status === "Connected").length}/${apiIntegrations.length}`}
            trend="75%"
            icon={<RefreshCw className="h-5 w-5" />}
          />
        </div>

        <Tabs defaultValue="jobs">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="jobs">Offres</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="ia">Configuration IA</TabsTrigger>
          </TabsList>

          {/* Onglet Offres */}
          <TabsContent value="jobs">
            <DashboardSection
              title="Gestion des offres"
              searchPlaceholder="Rechercher des offres..."
              addButtonLink="/post-job"
              addButtonText="Ajouter une offre"
              columns={['Offre', 'Candidats', 'Statut', 'Source', 'Date', 'Actions']}
            >
              {jobs && jobs.length > 0 ? jobs.map(job => (
                <tr key={job.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <Briefcase className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">{job.title}</div>
                        <div className="text-sm text-gray-500">{job.company} • {job.location}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{job.applicants}</TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell>{job.source === 'scraped' ? 'Scrapé' : 'Externe'}</TableCell>
                  <TableCell>{new Date(job.postedDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <ActionButtons 
                      onDelete={() => deleteJob(job.id)}
                      onEdit={() => {/* Implémentez l'édition */}}
                      onView={() => {/* Implémentez la visualisation */}}
                    />
                  </TableCell>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">Aucune offre disponible</td>
                </tr>
              )}
            </DashboardSection>
          </TabsContent>

          {/* Onglet Utilisateurs */}
          <TabsContent value="users">
            <DashboardSection
              title="Gestion des utilisateurs"
              searchPlaceholder="Rechercher des utilisateurs..."
              addButtonText="Ajouter un utilisateur"
              columns={['Utilisateur', 'Rôle', 'Statut', 'Inscription', 'Candidatures', 'Actions']}
            >
              {users && users.length > 0 ? users.map(user => (
                <tr key={user.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{user.applications?.length || 0}</TableCell>
                  <TableCell>
                    <ActionButtons 
                      onDelete={() => deleteUser(user.id)}
                      onEdit={() => {/* Implémentez l'édition */}}
                      onView={() => {/* Implémentez la visualisation */}}
                    />
                  </TableCell>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">Aucun utilisateur disponible</td>
                </tr>
              )}
            </DashboardSection>
          </TabsContent>

          {/* Onglet API */}
          <TabsContent value="api">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Intégrations API</h2>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="mr-2 h-4 w-4" /> Ajouter une API
                </Button>
              </div>

              {apiIntegrations && apiIntegrations.length > 0 ? apiIntegrations.map(api => (
                <div key={api.id} className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{api.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={api.status} />
                        {api.status === 'Connected' && (
                          <span className="text-sm text-gray-500">
                            Dernière synchronisation : {api.lastSync}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {api.status === 'Connected' ? (
                        <>
                          <Button variant="outline" onClick={() => toggleApiStatus(api.id)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Synchroniser
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => toggleApiStatus(api.id)}
                          >
                            Déconnecter
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => toggleApiStatus(api.id)}>
                          Connecter
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4">Aucune API disponible</div>
              )}
            </div>
          </TabsContent>

          {/* Onglet Configuration IA */}
          <TabsContent value="ia">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-semibold">Configuration de l'IA</h2>
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>

              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Configuration OpenAI</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Clé API</label>
                      <Input type="password" placeholder="sk-..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Modèle</label>
                      <select className="w-full border rounded-md p-2">
                        <option>gpt-4</option>
                        <option>gpt-3.5-turbo</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      Sauvegarder
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Composants réutilisables
const StatCard = ({ title, value, trend, icon }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center mt-2 text-sm">
        {icon}
        <span className="ml-2 text-green-500">{trend}</span>
      </div>
    </CardContent>
  </Card>
);

const DashboardSection = ({ title, searchPlaceholder, addButtonLink, addButtonText, columns, children }) => (
  <div className="bg-white rounded-lg border p-6">
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input placeholder={searchPlaceholder} className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtrer
        </Button>
        {addButtonLink ? (
          <Link to={addButtonLink}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              {addButtonText}
            </Button>
          </Link>
        ) : (
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            {addButtonText}
          </Button>
        )}
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            {columns && columns.map((col, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {children}
        </tbody>
      </table>
    </div>

    <div className="mt-6 flex justify-between items-center">
      <div className="text-sm text-gray-500">Affichage de 1 à 10 éléments</div>
      <div className="flex gap-2">
        <Button variant="outline">Précédent</Button>
        <Button variant="outline">Suivant</Button>
      </div>
    </div>
  </div>
);

const TableCell = ({ children }) => (
  <td className="px-6 py-4 whitespace-nowrap">{children}</td>
);

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
    status === 'Active' || status === 'Connected' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800'
  }`}>
    {status}
  </span>
);

const ActionButtons = ({ onView, onEdit, onDelete }) => (
  <div className="flex gap-2">
    <Button variant="ghost" size="icon" onClick={onView}>
      <Eye className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon" onClick={onEdit}>
      <Edit className="h-4 w-4 text-blue-500" />
    </Button>
    <Button variant="ghost" size="icon" onClick={onDelete}>
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  </div>
);