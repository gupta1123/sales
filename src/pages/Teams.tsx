import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import Select, { MultiValue } from 'react-select';

interface Team {
    id: number;
    officeManager: {
        id: number;
        firstName: string | null;
        lastName: string | null;
        assignedCity: string[];
    };
    fieldOfficers: FieldOfficer[];
}

interface FieldOfficer {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
}

const Teams: React.FC<{ authToken: string | null }> = ({ authToken }) => {
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isDataAvailable, setIsDataAvailable] = useState<boolean>(true);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState<boolean>(false);
    const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [selectedOfficeManagerId, setSelectedOfficeManagerId] = useState<number | null>(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
    const [isCityRemoveModalVisible, setIsCityRemoveModalVisible] = useState<boolean>(false);
    const [fieldOfficers, setFieldOfficers] = useState<FieldOfficer[]>([]);
    const [selectedFieldOfficers, setSelectedFieldOfficers] = useState<number[]>([]);
    const [assignedCities, setAssignedCities] = useState<string[]>([]);
    const [cityToRemove, setCityToRemove] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<{ [key: number]: number }>({});
    const [availableCities, setAvailableCities] = useState<{ value: string, label: string }[]>([]);
    const [selectedCities, setSelectedCities] = useState<MultiValue<{ value: string, label: string }>>([]);
    const [newCity, setNewCity] = useState<string | null>(null);

    const fetchTeams = useCallback(async () => {
        try {
            const response = await axios.get('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/team/getAll', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            setTeams(response.data);
            setIsDataAvailable(response.data.length > 0);
            toast({
                title: "Teams loaded successfully",
                description: "All team data has been fetched.",
                variant: "default",
            });
        } catch (error) {
            console.error('Error fetching teams:', error);
            setIsDataAvailable(false);
            toast({
                title: "Error loading teams",
                description: "Failed to fetch team data. Please try again.",
                variant: "destructive",
            });
        }
    }, [authToken, toast]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    const fetchCities = async () => {
        try {
            const response = await axios.get(
                "http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getCities",
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );
            const sortedCities = response.data
                .sort((a: string, b: string) => a.localeCompare(b))
                .map((city: string) => ({ value: city, label: city }));
            setAvailableCities(sortedCities);
        } catch (error) {
            console.error("Error fetching cities:", error);
            toast({
                title: "Error",
                description: "Failed to fetch cities. Please try again.",
                variant: "destructive",
            });
        }
    };

    const showDeleteModal = (teamId: number) => {
        setDeleteTeamId(teamId);
        setIsDeleteModalVisible(true);
    };

    const handleDeleteTeam = async () => {
        try {
            await axios.delete(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/team/delete?id=${deleteTeamId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            await fetchTeams();
            setIsDeleteModalVisible(false);
            toast({
                title: "Team deleted",
                description: "The team has been successfully deleted.",
                variant: "default",
            });
        } catch (error) {
            console.error('Error deleting team:', error);
            toast({
                title: "Error",
                description: "Failed to delete the team. Please try again.",
                variant: "destructive",
            });
        }
    };

    const fetchFieldOfficersByCities = useCallback(async (cities: string[], officeManagerId: number) => {
        try {
            const promises = cities.map(city =>
                axios.get(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getFieldOfficerByCity?city=${city}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                })
            );

            const responses = await Promise.all(promises);
            const allFieldOfficers: FieldOfficer[] = responses.flatMap(response => response.data).filter((officer: FieldOfficer) => officer.role === 'Field Officer');
            const currentTeam = teams.find(team => team.officeManager.id === officeManagerId);
            const currentTeamMemberIds = currentTeam ? currentTeam.fieldOfficers.map(officer => officer.id) : [];
            const availableFieldOfficers = allFieldOfficers.filter((officer: FieldOfficer) => !currentTeamMemberIds.includes(officer.id));
            setFieldOfficers(availableFieldOfficers);
        } catch (error) {
            console.error('Error fetching field officers:', error);
            toast({
                title: "Error",
                description: "Failed to fetch field officers. Please try again.",
                variant: "destructive",
            });
        }
    }, [authToken, teams, toast]);

    const showEditModal = async (team: Team) => {
        setSelectedTeamId(team.id);
        setSelectedOfficeManagerId(team.officeManager.id);
        const cities = team.officeManager.assignedCity;
        setAssignedCities(cities);
        setSelectedCities(cities.map(city => ({ value: city, label: city })));
        await fetchFieldOfficersByCities(cities, team.officeManager.id);
        setIsEditModalVisible(true);
        await fetchCities();
    };

    const handleAddCity = (selectedOptions: MultiValue<{ value: string, label: string }>) => {
        const newCities = selectedOptions.map(option => option.value);
        setSelectedCities(selectedOptions);
        setNewCity(newCities[newCities.length - 1]);
    };

    const handleRemoveCity = (cityToRemove: string) => {
        setCityToRemove(cityToRemove);
        setIsCityRemoveModalVisible(true);
    };

    const confirmRemoveCity = async () => {
        if (!selectedOfficeManagerId || !cityToRemove) return;
        try {
            await axios.delete(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/removeAssignedCity?employeeId=${selectedOfficeManagerId}&city=${cityToRemove}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            setAssignedCities(prev => prev.filter(city => city !== cityToRemove));
            setSelectedCities(prev => prev.filter(option => option.value !== cityToRemove));
            await fetchTeams(); // Fetch teams again to update the data
            setIsCityRemoveModalVisible(false);
            toast({
                title: "City removed",
                description: `${cityToRemove} removed from Employee Id: ${selectedOfficeManagerId} and associated team updated/deleted.`,
                variant: "default",
            });
        } catch (error) {
            console.error('Error removing city:', error);
            toast({
                title: "Error",
                description: "Failed to remove city. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleAddFieldOfficer = async () => {
        if (selectedFieldOfficers.length === 0) {
            toast({
                title: "No officers selected",
                description: "Please select at least one field officer to add.",
                variant: "destructive",
            });
            return;
        }

        try {
            await axios.put(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/team/addFieldOfficer?id=${selectedTeamId}`, {
                fieldOfficers: selectedFieldOfficers,
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
            });
            await fetchTeams();
            setIsEditModalVisible(false);
            setSelectedFieldOfficers([]);
            toast({
                title: "Field officers added",
                description: "The selected field officers have been added to the team.",
                variant: "default",
            });
        } catch (error) {
            console.error('Error adding field officer:', error);
            toast({
                title: "Error",
                description: "Failed to add field officers. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleRemoveFieldOfficer = async (fieldOfficerId: number) => {
        if (!selectedOfficeManagerId) return;
        try {
            await axios.delete(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/team/deleteFieldOfficer?id=${selectedOfficeManagerId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    fieldOfficers: [fieldOfficerId],
                },
            });
            await fetchTeams();
            toast({
                title: "Field officer removed",
                description: "The field officer has been removed from the team.",
                variant: "default",
            });
        } catch (error) {
            console.error('Error removing field officer:', error);
            toast({
                title: "Error",
                description: "Failed to remove field officer. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleAssignCity = async () => {
        if (!newCity || !selectedOfficeManagerId) return;
        try {
            await axios.put(
                `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/assignCity?id=${selectedOfficeManagerId}&city=${newCity}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            toast({
                title: "City assigned",
                description: `${newCity} assigned to team ${selectedOfficeManagerId}`,
                variant: "default",
            });
            await fetchFieldOfficersByCities([...assignedCities, newCity], selectedOfficeManagerId);
            setAssignedCities(prev => [...prev, newCity]);
            setNewCity(null);
        } catch (error) {
            console.error('Error assigning city:', error);
            toast({
                title: "Error",
                description: "Failed to assign city. Please try again.",
                variant: "destructive",
            });
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const handlePageChange = (teamId: number, newPage: number) => {
        setCurrentPage(prev => ({ ...prev, [teamId]: newPage }));
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {isDataAvailable ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {teams.map((team) => {
                        const pageCount = Math.ceil(team.fieldOfficers.length / 4);
                        const currentPageForTeam = currentPage[team.id] || 1;
                        const startIndex = (currentPageForTeam - 1) * 4;
                        const visibleOfficers = team.fieldOfficers.slice(startIndex, startIndex + 4);

                        return (
                            <Card key={team.id} className="flex flex-col">
                                <CardContent className="p-6 flex-grow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-semibold">
                                                {team.officeManager?.firstName ?? 'N/A'} {team.officeManager?.lastName ?? 'N/A'}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Regional Manager - {team.officeManager.assignedCity.join(", ")}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {team.officeManager.assignedCity.map((city, index) => (
                                                    <Badge key={index} variant="secondary">
                                                        {city}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => showDeleteModal(team.id)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {visibleOfficers.map((officer) => (
                                            <div key={officer.id} className="bg-gray-100 p-2 rounded flex items-center justify-between">
                                                <div className="flex items-center min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center mr-2 flex-shrink-0">
                                                        {getInitials(`${officer.firstName} ${officer.lastName}`)}
                                                    </div>
                                                    <div className="min-w-0 flex-grow">
                                                        <p className="font-medium text-sm truncate" title={`${officer.firstName} ${officer.lastName}`}>
                                                            {`${officer.firstName} ${officer.lastName}`}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate" title={officer.role}>
                                                            {officer.role}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveFieldOfficer(officer.id)}
                                                    className="flex-shrink-0"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    {pageCount > 1 && (
                                        <div className="flex justify-center items-center mt-4 space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(team.id, currentPageForTeam - 1)}
                                                disabled={currentPageForTeam === 1}
                                            >
                                                <ChevronLeft size={16} />
                                            </Button>
                                            <span className="text-sm">
                                                Page {currentPageForTeam} of {pageCount}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(team.id, currentPageForTeam + 1)}
                                                disabled={currentPageForTeam === pageCount}
                                            >
                                                <ChevronRight size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="p-6 pt-0">
                                    <Button
                                        className="w-full"
                                        onClick={() => showEditModal(team)}
                                    >
                                        <UserPlus size={16} className="mr-2" />
                                        Add Field Officer
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <p className="text-center text-gray-500">No teams available. Please try again later.</p>
            )}

            <Dialog open={isDeleteModalVisible} onOpenChange={setIsDeleteModalVisible}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Team</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this team?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalVisible(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteTeam}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditModalVisible} onOpenChange={setIsEditModalVisible}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Field Officer</DialogTitle>
                    </DialogHeader>
                    <div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {assignedCities.map((city, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                                    <MapPin size={16} className="mr-1" />
                                    {city}
                                    <Button size="icon" variant="ghost" onClick={() => handleRemoveCity(city)}>
                                        <X size={16} />
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                        <Select
                            isMulti
                            value={selectedCities}
                            onChange={handleAddCity}
                            options={availableCities.filter(city => !assignedCities.includes(city.value))}
                            placeholder="Select cities"
                        />
                        {newCity && (
                            <div className="flex justify-end mt-4">
                                <Button onClick={handleAssignCity}>
                                    OK
                                </Button>
                            </div>
                        )}
                        <div className="space-y-2 max-h-60 overflow-y-auto mt-4">
                            {fieldOfficers.map((officer) => (
                                <div key={officer.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`officer-${officer.id}`}
                                        checked={selectedFieldOfficers.includes(officer.id)}
                                        onCheckedChange={(checked) => {
                                            setSelectedFieldOfficers(prev =>
                                                checked
                                                    ? [...prev, officer.id]
                                                    : prev.filter(id => id !== officer.id)
                                            );
                                        }}
                                    />
                                    <label htmlFor={`officer-${officer.id}`} className="text-sm">
                                        {`${officer.firstName} ${officer.lastName} (${officer.role})`}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalVisible(false)}>Cancel</Button>
                        <Button onClick={handleAddFieldOfficer} disabled={selectedFieldOfficers.length === 0}>
                            Add Selected Officers
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCityRemoveModalVisible} onOpenChange={setIsCityRemoveModalVisible}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove City</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to remove this city?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCityRemoveModalVisible(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmRemoveCity}>Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Teams;
