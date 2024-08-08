import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, fetchUserInfo, fetchTeamInfo } from '../store';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { debounce } from 'lodash';
import { ClipLoader } from 'react-spinners';
import { Skeleton } from '@/components/ui/skeleton';
import EmployeeCard1 from './EmployeeCard1';
import EmployeeDetails from './EmployeeDetails';
import DateRangeDropdown from './DateRangeDropdown';
import maplibregl, { Map as MapLibreMap, NavigationControl, Marker, Popup } from 'maplibre-gl';
import axios, { AxiosResponse } from 'axios';
import 'maplibre-gl/dist/maplibre-gl.css';
import EmployeeLocationList from './EmployeeLocationList';

const API_BASE_URL = 'http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081';
const MAP_STYLE_URL = 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json';
const OLA_CLIENT_ID = '7ba2810b-f481-4e31-a0c6-d436b0c7c1eb';
const OLA_CLIENT_SECRET = 'klymi04gaquWCnpa57hBEpMXR7YPhkLD';

type EmployeeLocation = {
  id: number;
  empId: number;
  empName: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  updatedTime: string;
};

type Visit = {
  id: number;
  employeeId: number;
  employeeFirstName: string;
  employeeLastName: string;
  employeeState: string;
  storeId: number;
  employeeName: string;
  purpose: string;
  storeName: string;
  visit_date: string;
  checkinTime: string;
  checkoutTime: string;
  statsDto: {
    completedVisitCount: number;
    fullDays: number;
    halfDays: number;
    absences: number;
  };
};

type StateCardProps = {
  state: string;
  totalEmployees: number;
  onClick: () => void;
};

const StateCard: React.FC<StateCardProps> = ({ state, totalEmployees, onClick }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 cursor-pointer transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105" onClick={onClick}>
      <h2 className="text-2xl font-bold mb-4 capitalize">{state || 'Unknown State'}</h2>
      <div className="flex justify-between">
        <p className="text-gray-600">Total Employees: <span className="font-bold">{totalEmployees}</span></p>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedOption, setSelectedOption] = useState('Today');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<{
    statsDto: { completedVisitCount: number, fullDays: number, halfDays: number, absences: number } | null,
    visitDto: Visit[] | null
  } | null>(null);
  const [isMainDashboard, setIsMainDashboard] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<number[]>([]);

  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);
  const teamId = useSelector((state: RootState) => state.auth.teamId);
  const username = useSelector((state: RootState) => state.auth.username);
  const router = useRouter();
  const { view, state, employee, startDate: queryStartDate, endDate: queryEndDate } = router.query;
  const [employeeLocations, setEmployeeLocations] = useState<EmployeeLocation[]>([]);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (token && username && !role) {
      dispatch(fetchUserInfo(username));
    }
  }, [dispatch, token, username, role]);

  useEffect(() => {
    if (token) {
      getAccessToken();
      fetchEmployeeInfo();
    }
  }, [token]);

  useEffect(() => {
    if (token && role === 'MANAGER') {
      dispatch(fetchTeamInfo()).then((action) => {
        if (fetchTeamInfo.fulfilled.match(action) && action.payload) {
          const teamMemberIds = action.payload.fieldOfficers.map((officer: any) => officer.id);
          setTeamMembers(teamMemberIds);
        }
      });
    }
  }, [token, role, dispatch]);

  const fetchEmployeeInfo = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/employee/getAll`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployeeInfo(response.data);
    } catch (error) {
      console.error('Error fetching employee info:', error);
    }
  }, [token]);

  const isInitialMount = useRef(true);

  const fetchVisits = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/report/getCounts?startDate=${start}&endDate=${end}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch visits: ${response.statusText}`);
      }

      const data = await response.json();
      if (role === 'MANAGER') {
        const filteredData = data.filter((visit: Visit) => teamMembers.includes(visit.employeeId));
        setVisits(filteredData);
      } else {
        setVisits(data);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
      setVisits([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, role, teamMembers]);

  const fetchEmployeeDetails = useCallback(async (employeeName: string, start: string, end: string) => {
    setIsLoading(true);
    try {
      const employeeId = visits.find(v => `${v.employeeFirstName} ${v.employeeLastName}`.toLowerCase() === employeeName.toLowerCase())?.employeeId;

      if (!employeeId) {
        throw new Error("Employee not found");
      }

      const response = await fetch(`${API_BASE_URL}/visit/getByDateRangeAndEmployeeStats?id=${employeeId}&start=${start}&end=${end}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch employee details: ${response.statusText}`);
      }

      const data = await response.json();
      setEmployeeDetails(data);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      setEmployeeDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, visits]);

  useEffect(() => {
    if (view === 'employeeDetails' && employee && queryStartDate && queryEndDate) {
      setSelectedEmployee(employee as string);
      setStartDate(queryStartDate as string);
      setEndDate(queryEndDate as string);
      fetchEmployeeDetails(employee as string, queryStartDate as string, queryEndDate as string);
    }
  }, [view, employee, queryStartDate, queryEndDate, fetchEmployeeDetails]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (token && role) {
        fetchVisits(startDate, endDate);
      }
    } else {
      if (token && role) {
        fetchVisits(startDate, endDate);
      }
    }
  }, [startDate, endDate, token, role, teamId, fetchVisits]);

  useEffect(() => {
    const { reset } = router.query;
    if (reset === 'true') {
      setSelectedState(null);
      setSelectedEmployee(null);
      setCurrentPage(1);
      router.replace('/Dashboard', undefined, { shallow: true });
    }
  }, [router.query, router]);

  const handleEmployeeClick = useCallback(async (employeeName: string) => {
    setSelectedEmployee(employeeName.trim().toLowerCase());
    router.push({
      pathname: '/Dashboard',
      query: {
        state: selectedState,
        employee: employeeName.trim().toLowerCase(),
      },
    }, undefined, { shallow: true });

    fetchEmployeeDetails(employeeName, startDate, endDate);
  }, [fetchEmployeeDetails, router, selectedState, startDate, endDate]);

  const handleDateRangeChange = useCallback((start: string, end: string, option: string) => {
    setStartDate(start);
    setEndDate(end);
    setSelectedOption(option);

    if (selectedEmployee) {
      fetchEmployeeDetails(selectedEmployee, start, end);
    } else {
      fetchVisits(start, end);
    }
  }, [fetchEmployeeDetails, fetchVisits, selectedEmployee]);

  const handleViewDetails = useCallback((visitId: number) => {
    router.push({
      pathname: `/VisitDetailPage/${visitId}`,
      query: {
        returnTo: 'employeeDetails',
        employeeId: selectedEmployee,
        startDate: startDate,
        endDate: endDate,
      },
    });
  }, [router, selectedEmployee, startDate, endDate]);

  const getAccessToken = useCallback(async () => {
    try {
      const response = await axios.post(
        'https://account.olamaps.io/realms/olamaps/protocol/openid-connect/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'openid',
          client_id: OLA_CLIENT_ID,
          client_secret: OLA_CLIENT_SECRET
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      setAccessToken(response.data.access_token);
    } catch (error) {
      console.error('Error getting access token:', error);
    }
  }, []);

  const handleStateClick = useCallback((state: string) => {
    setSelectedState(state.trim().toLowerCase() || 'unknown');
    setSelectedEmployee(null);
    setIsMainDashboard(false);
    router.push({
      pathname: '/Dashboard',
      query: { state: state.trim().toLowerCase() || 'unknown' },
    }, undefined, { shallow: true });
  }, [router]);

  const handleBackToMainDashboard = useCallback(() => {
    setSelectedState(null);
    setSelectedEmployee(null);
    setIsMainDashboard(true);
    setMapError(null);
    fetchAllEmployeeLocations();
    router.push('/Dashboard', undefined, { shallow: true });
  }, [router]);

  const fetchAllEmployeeLocations = useCallback(async () => {
    setIsMapLoading(true);
    setMapError(null);

    try {
      if (role === 'MANAGER') {
        if (!teamMembers.length) {
          setEmployeeLocations([]);
          return;
        }

        const locationPromises = teamMembers.map((employeeId) =>
          axios.get(`${API_BASE_URL}/employee/getLiveLocation?id=${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(error => {
            console.log(`No live location for employee ${employeeId}`);
            return null;
          })
        );

        const locationResponses = await Promise.all(locationPromises);
        const locations = locationResponses
          .filter((response): response is AxiosResponse<EmployeeLocation> => response !== null && response.data)
          .map((response) => response.data)
          .filter(location => location.latitude && location.longitude);

        setEmployeeLocations(locations);

        if (locations.length > 0 && accessToken) {
          await initializeMap(locations);
        } else {
          setMapError("No employee locations available");
        }
      } else {
        const employeesResponse = await axios.get(`${API_BASE_URL}/employee/getAll`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const locationPromises = employeesResponse.data.map((employee: any) =>
          axios.get(`${API_BASE_URL}/employee/getLiveLocation?id=${employee.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(error => {
            console.log(`No live location for employee ${employee.id}`);
            return null;
          })
        );

        const locationResponses = await Promise.all(locationPromises);
        const locations = locationResponses
          .filter((response): response is AxiosResponse<EmployeeLocation> => response !== null && response.data)
          .map((response) => response.data)
          .filter(location => location.latitude && location.longitude);

        setEmployeeLocations(locations);

        if (locations.length > 0 && accessToken) {
          await initializeMap(locations);
        } else {
          setMapError("No employee locations available");
        }
      }
    } catch (error) {
      console.error('Error fetching employee locations:', error);
      setMapError("Failed to fetch employee locations");
    } finally {
      setIsMapLoading(false);
    }
  }, [token, accessToken, role, teamMembers]);

  const fetchLatestVisit = useCallback(async (employeeName: string) => {
    const today = new Date();
    const startDate = today.getDate() <= 7 ? format(subDays(today, today.getDate() + 23), 'yyyy-MM-dd') : format(subDays(today, 30), 'yyyy-MM-dd');
    const endDate = format(today, 'yyyy-MM-dd');

    try {
      const response = await axios.get(`${API_BASE_URL}/visit/getByDateSorted`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: startDate,
          endDate: endDate,
          page: 0,
          size: 1,
          sort: 'visitDate,desc',
          employeeName: employeeName
        }
      });

      const visitData = response.data.content[0];
      return visitData;
    } catch (error) {
      console.error('Error fetching latest visit:', error);
      return null;
    }
  }, [token]);

  const initializeMap = useCallback(async (locations: EmployeeLocation[]) => {
    if (mapContainer.current && accessToken) {
      if (map.current) {
        map.current.remove();
      }

      try {
        const styleResponse = await axios.get(MAP_STYLE_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        const style = styleResponse.data;

        style.layers = style.layers.filter((layer: any) =>
          !['poi-vectordata', 'poi'].includes(layer.id)
        );

        map.current = new MapLibreMap({
          container: mapContainer.current,
          style: style,
          center: [78.9629, 20.5937],
          zoom: 4,
          transformRequest: (url, resourceType) => {
            if (url.startsWith('https://api.olamaps.io')) {
              return {
                url: url,
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                },
              };
            }
          },
        });

        let currentPopup: Popup | null = null;

        map.current.on('load', () => {
          map.current!.addControl(new NavigationControl(), 'top-left');

          locations.forEach((location, index) => {
            const color = `hsl(${(index * 137.508) % 360}, 70%, 50%)`;
            const marker = new Marker({ color: color })
              .setLngLat([location.longitude, location.latitude])
              .addTo(map.current!);

            const employee = employeeInfo.find(emp => emp.id === location.empId);
            const updatedDateTime = parseISO(`${location.updatedAt}T${location.updatedTime}`);
            const formattedDateTime = format(updatedDateTime, "d MMM ''yy h:mm a");

            marker.getElement().addEventListener('mouseenter', async () => {
              if (currentPopup) {
                currentPopup.remove();
                currentPopup = null;
              }

              const latestVisit = await fetchLatestVisit(location.empName);
              const visitTime = latestVisit && latestVisit.checkinTime ? format(parseISO(`${latestVisit.visit_date}T${latestVisit.checkinTime}`), "h:mm a") : 'N/A';
              const popupContent = `
  <div style="
    font-family: 'Poppins', sans-serif;
    padding: 12px;
    max-width: 400px;
    background-color: #f8f9fa;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    border: 2px solid #4A90E2;">
    <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 8px; color: #333;">
      ${location.empName}
    </div>
    <div style="font-size: 1em; color: #555;">
      <p style="white-space: nowrap;"><strong>Last updated:</strong> <span style="color: #4A90E2;">${formattedDateTime}</span></p>
      ${latestVisit ? `
        <div style="background-color: #d1ecf1; padding: 8px; border-radius: 6px; margin-top: 8px;">
          <p><strong>Latest Visit:</strong> ${latestVisit.storeName} at ${visitTime}</p>
        </div>
      ` : '<p>No recent visits</p>'}
    </div>
  </div>
`;


              const popup = new Popup({ offset: 25 }).setHTML(popupContent);
              popup.setLngLat(marker.getLngLat());
              popup.addTo(map.current!);
              currentPopup = popup;
            });
          });

          const bounds = new maplibregl.LngLatBounds();
          locations.forEach(location => {
            bounds.extend([location.longitude, location.latitude]);
          });
          map.current!.fitBounds(bounds, { padding: 50 });
        });

        map.current.on('mousemove', () => {
          if (currentPopup && !currentPopup.isOpen()) {
            currentPopup.remove();
            currentPopup = null;
          }
        });

        map.current.on('error', (e) => {
          console.error('Map error:', e);
          setMapError(`Map error: ${e.error.message}`);
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError("Failed to initialize map");
      }
    }
  }, [accessToken, fetchLatestVisit, employeeInfo]);

  const handleEmployeeLocationClick = useCallback((location: EmployeeLocation) => {
    if (map.current) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 14,
        essential: true,
      });
    }
  }, []);

  useEffect(() => {
    if (token && username && !role) {
      dispatch(fetchUserInfo(username));
    }
  }, [dispatch, token, username, role]);

  useEffect(() => {
    if (token) {
      getAccessToken();
    }
  }, [token, getAccessToken]);

  useEffect(() => {
    if (accessToken && isMainDashboard) {
      fetchAllEmployeeLocations();
    }
  }, [accessToken, fetchAllEmployeeLocations, isMainDashboard]);

  useEffect(() => {
    if (token && role) {
      fetchVisits(startDate, endDate);
    }
  }, [token, role, startDate, endDate, fetchVisits]);

  const stateCards = useMemo(() => {
    const stateData = visits.reduce((acc: { [key: string]: { employees: Set<string>, visits: number } }, visit) => {
      const state = (visit.employeeState || 'unknown').trim().toLowerCase();
      if (!acc[state]) {
        acc[state] = { employees: new Set(), visits: 0 };
      }
      if (visit.statsDto && visit.statsDto.completedVisitCount > 0) {
        acc[state].employees.add(`${visit.employeeFirstName || 'Unknown'} ${visit.employeeLastName || ''}`);
        acc[state].visits += visit.statsDto.completedVisitCount;
      }
      return acc;
    }, {});

    return Object.entries(stateData)
      .filter(([_, data]) => data.employees.size > 0)
      .map(([state, data]) => {
        return (
          <StateCard
            key={state}
            state={state.charAt(0).toUpperCase() + state.slice(1) || 'Unknown State'}
            totalEmployees={data.employees.size}
            onClick={() => handleStateClick(state)}
          />
        );
      });
  }, [visits, handleStateClick]);

  const employeeCards = useMemo(() => {
    if (!selectedState) return [];

    const stateVisits = visits.filter((visit) => (visit.employeeState.trim().toLowerCase() || 'unknown') === selectedState);
    const employeeVisits = stateVisits.reduce((acc: { [key: string]: any }, visit) => {
      const employeeName = visit.employeeFirstName + ' ' + visit.employeeLastName;
      if (!acc[employeeName] && visit.statsDto && visit.statsDto.completedVisitCount > 0) {
        acc[employeeName] = {
          ...visit,
          completedVisitCount: visit.statsDto.completedVisitCount
        };
      }
      return acc;
    }, {});

    return Object.entries(employeeVisits).map(([employeeName, employeeData]: [string, any]) => {
      return (
        <EmployeeCard1
          key={employeeName}
          employeeName={employeeName.charAt(0).toUpperCase() + employeeName.slice(1)}
          totalVisits={employeeData.completedVisitCount}
          onClick={() => handleEmployeeClick(employeeName)}
        />
      );
    });
  }, [selectedState, visits, handleEmployeeClick]);

  const renderSkeletonCards = () => (
    <>
      {[...Array(6)].map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-[250px] mb-4" />
            <Skeleton className="h-4 w-[200px]" />
          </CardContent>
        </Card>
      ))}
    </>
  );

  return (
    <div className="container mx-auto py-8">
      {selectedState && !selectedEmployee ? (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold capitalize">{selectedState === 'unknown' ? 'Unknown State' : selectedState}</h1>
            <Button variant="ghost" size="lg" onClick={handleBackToMainDashboard}>
              <ArrowLeftIcon className="h-6 w-6" />
            </Button>
          </div>
          <div className="mb-8">
            <DateRangeDropdown selectedOption={selectedOption} onDateRangeChange={handleDateRangeChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? renderSkeletonCards() : (
              employeeCards.length > 0 ? employeeCards : <p>No employees with completed visits in this date range.</p>
            )}
          </div>
        </>
      ) : selectedEmployee && employeeDetails ? (
        <EmployeeDetails
          employeeDetails={employeeDetails}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          handleDateRangeChange={handleDateRangeChange}
          selectedOption={selectedOption}
          handleViewDetails={handleViewDetails}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isLoading={isLoading}
          onBackClick={handleBackToMainDashboard}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Sales Dashboard</h1>
            <div className="flex">
              <DateRangeDropdown selectedOption={selectedOption} onDateRangeChange={handleDateRangeChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {isLoading ? renderSkeletonCards() : (
              stateCards.length > 0 ? stateCards : <p>No states with active employees in this date range.</p>
            )}
          </div>
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Live Employee Locations</h2>
            {isMapLoading ? (
              <div className="flex justify-center items-center h-[600px]">
                <ClipLoader color="#4A90E2" size={50} />
              </div>
            ) : (
              <>
                {employeeLocations.length > 0 ? (
                  <>
                    <div ref={mapContainer} className="rounded-lg border-2 border-gray-300 shadow-lg" style={{ width: '100%', height: '600px' }} />
                    <EmployeeLocationList employeeLocations={employeeLocations} onEmployeeClick={handleEmployeeLocationClick} />
                  </>
                ) : (
                  <div className="flex justify-center items-center h-[600px]">
                    <p>No live location data available</p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
