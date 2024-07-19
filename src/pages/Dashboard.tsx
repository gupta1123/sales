// src/pages/Dashboard.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, fetchUserInfo } from '../store';
import { ChevronUpIcon, ChevronDownIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { format, parseISO, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { ClipLoader } from 'react-spinners';
import EmployeeCard1 from './EmployeeCard1';

interface Visit {
  id: string;
  storeId: string;
  employeeId: string;
  employeeName: string;
  purpose: string | null;
  visit_date: string;
  storeName: string;
  state: string;
  city: string;
  checkinDate: string | null;
  checkinTime: string | null;
  checkoutDate: string | null;
  checkoutTime: string | null;
}

interface StateCardProps {
  state: string;
  totalVisits: number;
  totalEmployees: number;
  onClick: () => void;
}

const renderSkeletons = (count: number) => {
  return Array.from({ length: count }).map((_, index) => (
    <div key={index} className="bg-white shadow-lg rounded-lg p-6">
      <Skeleton height={30} width="50%" />
      <Skeleton height={20} width="80%" />
      <Skeleton height={20} width="60%" />
    </div>
  ));
};

const StateCard = ({ state, totalVisits, totalEmployees, onClick }: StateCardProps) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 cursor-pointer transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105" onClick={onClick}>
      <h2 className="text-2xl font-bold mb-4 capitalize">{state || 'Unknown State'}</h2>
      <div className="flex justify-between">

        <p className="text-gray-600">Total Employees: <span className="font-bold">{totalEmployees}</span></p>
      </div>
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: number;
}

const KPICard = ({ title, value }: KPICardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
};

interface VisitsByPurposeChartProps {
  data: { purpose: string; visits: number }[];
}

const VisitsByPurposeChart = ({ data }: VisitsByPurposeChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visits by Purpose</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="purpose" />
            <YAxis />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }} />
            <Legend />
            <Bar dataKey="visits" fill="#1a202c" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface DateRangeDropdownProps {
  selectedOption: string;
  onDateRangeChange: (startDate: string, endDate: string, selectedOption: string) => void;
}

const DateRangeDropdown = ({ selectedOption, onDateRangeChange }: DateRangeDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomDateRangeOpen, setIsCustomDateRangeOpen] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const options = [
    'Today',
    'Last 7 Days',
    'Last 15 Days',
    'Last 30 Days',
    'Custom Date Range',
  ];

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: string) => {
    setIsOpen(false);

    if (option === 'Custom Date Range') {
      setIsCustomDateRangeOpen(true);
    } else {
      let startDate = '';
      let endDate = '';

      switch (option) {
        case 'Today':
          startDate = format(new Date(), 'yyyy-MM-dd');
          endDate = format(new Date(), 'yyyy-MM-dd');
          break;
        case 'Last 7 Days':
          startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
          endDate = format(new Date(), 'yyyy-MM-dd');
          break;
        case 'Last 15 Days':
          startDate = format(subDays(new Date(), 15), 'yyyy-MM-dd');
          endDate = format(new Date(), 'yyyy-MM-dd');
          break;
        case 'Last 30 Days':
          startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
          endDate = format(new Date(), 'yyyy-MM-dd');
          break;
        default:
          break;
      }

      onDateRangeChange(startDate, endDate, option);
    }
  };

  const handleCustomDateRangeSubmit = () => {
    onDateRangeChange(startDate, endDate, 'Custom Date Range');
    setIsCustomDateRangeOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          id="options-menu"
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={toggleDropdown}
        >
          {selectedOption}
          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {options.map((option) => (
              <a
                key={option}
                href="#"
                className={`${option === selectedOption
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-700'
                  } block px-4 py-2 text-sm`}
                role="menuitem"
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </a>
            ))}
          </div>
        </div>
      )}

      {isCustomDateRangeOpen && (
        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-6 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <h3 className="text-2xl leading-6 font-semibold text-gray-900 mb-4">Custom Date Range</h3>
                    <div className="mt-4">
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="mt-4">
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-3 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCustomDateRangeSubmit}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsCustomDateRangeOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface VisitsTableProps {
  visits: Visit[];
  onViewDetails: (visitId: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const VisitsTable = ({ visits, onViewDetails, currentPage, onPageChange }: VisitsTableProps) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortColumn, setSortColumn] = useState<keyof Visit>('visit_date');

  const getOutcomeStatus = (visit: Visit): { emoji: React.ReactNode; status: string; color: string } => {
    if (visit.checkinDate && visit.checkinTime && visit.checkoutDate && visit.checkoutTime) {
      return { emoji: '✅', status: 'Completed', color: 'bg-purple-100 text-purple-800' };
    } else if (visit.checkoutDate && visit.checkoutTime) {
      return { emoji: '🚪', status: 'Checked Out', color: 'bg-orange-100 text-orange-800' };
    } else if (visit.checkinDate && visit.checkinTime) {
      return { emoji: '⏳', status: 'On Going', color: 'bg-green-100 text-green-800' };
    }
    return { emoji: '📋', status: 'Assigned', color: 'bg-blue-100 text-blue-800' };
  };

  const handleSort = (column: keyof Visit) => {
    if (column === sortColumn) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  const rowsPerPage = 10;
  const totalPages = Math.ceil(visits.length / rowsPerPage);

  const sortedVisits = [...visits].sort((a, b) => {
    const valueA = a[sortColumn];
    const valueB = b[sortColumn];

    if (valueA === null || valueA === undefined) {
      return 1;
    }
    if (valueB === null || valueB === undefined) {
      return -1;
    }

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    }

    if (valueA < valueB) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const visitsToDisplay = sortedVisits.slice(startIndex, endIndex);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Completed Visits</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('storeName')}>
                Store
                {sortColumn === 'storeName' && (
                  sortOrder === 'asc' ? (
                    <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                  )
                )}
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('employeeName')}>
                Employee
                {sortColumn === 'employeeName' && (
                  sortOrder === 'asc' ? (
                    <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                  )
                )}
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('visit_date')}>
                Date
                {sortColumn === 'visit_date' && (
                  sortOrder === 'asc' ? (
                    <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                  )
                )}
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('purpose')}>
                Purpose
                {sortColumn === 'purpose' && (
                  sortOrder === 'asc' ? (
                    <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                  )
                )}
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('city')}>
                City
                {sortColumn === 'city' && (
                  sortOrder === 'asc' ? (
                    <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                  )
                )}
              </th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visitsToDisplay.map((visit) => {
              const { emoji, status, color } = getOutcomeStatus(visit);
              return (
                <tr key={visit.id}>
                  <td className="px-4 py-2">{visit.storeName}</td>
                  <td className="px-4 py-2 capitalize">{visit.employeeName}</td>
                  <td className="px-4 py-2">{format(parseISO(visit.visit_date), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-2">{visit.purpose}</td>
                  <td className="px-4 py-2 capitalize">{visit.city}</td>
                  <td className={`px-4 py-2 ${color}`}>{emoji} {status}</td>
                  <td className="px-4 py-2">
                    <button
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => onViewDetails(visit.id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
            {visitsToDisplay.length === 0 && (
              <tr>
                <td className="px-4 py-2 text-center" colSpan={7}>No visits available</td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
      {totalPages > 1 && visitsToDisplay.length > 0 && (
        <Pagination>
          <PaginationContent>
            <a
              href="#"
              className={`px-4 py-2 text-sm font-medium ${currentPage === 1
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-gray-700 hover:text-gray-900'
                }`}
              onClick={(e) => {
                if (currentPage !== 1) {
                  onPageChange(currentPage - 1);
                }
                e.preventDefault();
              }}
            >
              Previous
            </a>
            {Array.from({ length: totalPages }, (_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  isActive={currentPage === index + 1}
                  onClick={() => onPageChange(index + 1)}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            {totalPages > 1 && currentPage !== totalPages && (
              <a
                href="#"
                className={`px-4 py-2 text-sm font-medium ${currentPage === totalPages
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-gray-700 hover:text-gray-900'
                  }`}
                onClick={(e) => {
                  if (currentPage !== totalPages) {
                    onPageChange(currentPage + 1);
                  }
                  e.preventDefault();
                }}
              >
                Next
              </a>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </Card>
  );
};

const Dashboard = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedOption, setSelectedOption] = useState('Today');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);
  const teamId = useSelector((state: RootState) => state.auth.teamId);
  const username = useSelector((state: RootState) => state.auth.username);
  const router = useRouter();
  const { state, employee } = router.query;

  useEffect(() => {
    if (state && typeof state === 'string') {
      setSelectedState(state);
    }
    if (employee && typeof employee === 'string') {
      setSelectedEmployee(employee);
    }
  }, [state, employee]);

  useEffect(() => {
    if (token && username && !role) {
      dispatch(fetchUserInfo(username));
    }
  }, [dispatch, token, username, role]);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // This will run only on the initial mount (including page reloads)
      if (token && role) {
        fetchVisits(startDate, endDate);
      }
    } else {
      // This will run on dependency changes after the initial mount
      if (token && role) {
        fetchVisits(startDate, endDate);
      }
    }
  }, [startDate, endDate, token, role, teamId]);

  const fetchVisits = async (start: string, end: string) => {
    setIsLoading(true);
    try {
      let url = '';

      switch (role) {
        case 'MANAGER':
          if (teamId) {
            console.log(teamId);
            url = `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/getForTeam?teamId=${teamId}&startDate=${start}&endDate=${end}`;
          } else {
            throw new Error('Team ID is missing for MANAGER role');
          }
          break;
        case 'ADMIN':
        case 'OFFICE MANAGER':
          url = `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/getByDateRange1?start=${start}&end=${end}`;
          break;
        default:
          console.warn(`Unknown user role: ${role}. Using default endpoint.`);
          url = `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/getByDateRange1?start=${start}&end=${end}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch visits: ${response.statusText}`);
      }

      const data = await response.json();

      if (role === 'MANAGER' || role === 'FIELD OFFICER') {
        setVisits(data.content || []);
      } else {
        setVisits(data);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
      setVisits([]); // Set visits to an empty array in case of an error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const { reset } = router.query;
    if (reset === 'true') {
      setSelectedState(null);
      setSelectedEmployee(null);
      setCurrentPage(1);
      router.replace('/Dashboard', undefined, { shallow: true });
    }
  }, [router.query]);

  const handleStateClick = (state: string) => {
    setSelectedState(state.trim().toLowerCase() || 'unknown');
    setSelectedEmployee(null);
    router.push({
      pathname: '/Dashboard',
      query: { state: state.trim().toLowerCase() || 'unknown' },
    }, undefined, { shallow: true });
  };

  const handleEmployeeClick = (employeeName: string) => {
    setSelectedEmployee(employeeName.trim().toLowerCase());
    router.push({
      pathname: '/Dashboard',
      query: {
        state: selectedState,
        employee: employeeName.trim().toLowerCase(),
      },
    }, undefined, { shallow: true });
  };

  const handleDateRangeChange = (start: string, end: string, option: string) => {
    setStartDate(start);
    setEndDate(end);
    setSelectedOption(option);
  };

  const handleViewDetails = (visitId: string) => {
    router.push({
      pathname: `/VisitDetailPage/${visitId}`,
      query: {
        returnState: selectedState,
        returnEmployee: selectedEmployee,
      },
    });
  };

  const states = Array.from(new Set(visits.map((visit) => visit.state.trim().toLowerCase() || 'unknown')));
  const stateCards = states.map((state) => {
    const stateVisits = visits.filter((visit) => (visit.state.trim().toLowerCase() || 'unknown') === state);
    const completedVisits = stateVisits.filter((visit) => visit.checkinDate && visit.checkinTime && visit.checkoutDate && visit.checkoutTime).length;

    const totalEmployees = Array.from(new Set(stateVisits.map((visit) => visit.employeeName))).length;
    return (
      <StateCard
        key={state}
        state={state.charAt(0).toUpperCase() + state.slice(1) || 'Unknown State'}
        totalVisits={completedVisits}
        totalEmployees={totalEmployees}
        onClick={() => handleStateClick(state)}
      />
    );
  });

  const renderSkeletons = (count: number) => {
    return Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white shadow-lg rounded-lg p-6">
        <Skeleton height={30} width="50%" />
        <Skeleton height={20} width="80%" />
        <Skeleton height={20} width="60%" />
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Sales Dashboard</h1>
        </div>
        <div className="flex justify-center mb-8">
          <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {renderSkeletons(6)}
        </div>
      </div>
    );
  }
  if (isLoading && !selectedState && !selectedEmployee) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Sales Dashboard</h1>
        </div>
        <div className="flex justify-center mb-8">
          <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {renderSkeletons(6)}
        </div>
      </div>
    );
  }

  if (isLoading && selectedState && !selectedEmployee) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold capitalize">{selectedState === 'unknown' ? 'Unknown State' : selectedState}</h1>
          <Button variant="ghost" size="lg" onClick={() => setSelectedState(null)}>
            <ArrowLeftIcon className="h-6 w-6" />
          </Button>
        </div>
        <div className="flex justify-center mb-8">
          <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {renderSkeletons(6)}
        </div>
      </div>
    );
  }

  if (isLoading && selectedEmployee) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold capitalize">{selectedEmployee}</h1>
          <Button variant="ghost" size="lg" onClick={() => setSelectedEmployee(null)}>
            <ArrowLeftIcon className="h-6 w-6" />
          </Button>
        </div>
        <div className="flex justify-center mb-8">
          <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {renderSkeletons(4)}
        </div>
        <div className="mb-8">
          <Skeleton height={30} width="100%" />
        </div>
        <div className="mt-8">
          <Skeleton height={300} width="100%" />
        </div>
      </div>
    );
  }
  if (selectedState && !selectedEmployee) {
    const stateVisits = visits.filter((visit) => (visit.state.trim().toLowerCase() || 'unknown') === selectedState);
    const completedVisits = stateVisits.filter((visit) => visit.checkinDate && visit.checkinTime && visit.checkoutDate && visit.checkoutTime).length;
    const employeeVisits = stateVisits.reduce((acc: { [key: string]: Visit[] }, visit) => {
      const employeeName = visit.employeeName.trim().toLowerCase();
      if (!acc[employeeName]) {
        acc[employeeName] = [];
      }
      acc[employeeName].push(visit);
      return acc;
    }, {});

    const employeeCards = Object.entries(employeeVisits).map(([employeeName, visits]) => {
      const completedEmployeeVisits = visits.filter((visit) => visit.checkinDate && visit.checkinTime && visit.checkoutDate && visit.checkoutTime).length;
      return (
        <EmployeeCard1
          key={employeeName}
          employeeName={employeeName.charAt(0).toUpperCase() + employeeName.slice(1)}
          totalVisits={completedEmployeeVisits}
          onClick={() => handleEmployeeClick(employeeName)}
        />
      );
    });


    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold capitalize">{selectedState === 'unknown' ? 'Unknown State' : selectedState}</h1>
          <Button variant="ghost" size="lg" onClick={() => setSelectedState(null)}>
            <ArrowLeftIcon className="h-6 w-6" />
          </Button>
        </div>
        <div className="mb-8">
          <DateRangeDropdown selectedOption={selectedOption} onDateRangeChange={handleDateRangeChange} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {employeeCards}
        </div>
        <div className="mt-8">
    
        </div>
      </div>
    );
  }

  if (selectedEmployee) {
    const employeeVisits = visits.filter((visit) => visit.employeeName.trim().toLowerCase() === selectedEmployee);
    const completedEmployeeVisits = employeeVisits.filter((visit) => visit.checkinDate && visit.checkinTime && visit.checkoutDate && visit.checkoutTime);

    const totalVisits = completedEmployeeVisits.length;
    const assignedVisits = employeeVisits.filter((visit) => !visit.checkinDate && !visit.checkinTime).length;

    const visitsByPurpose = completedEmployeeVisits.reduce((acc: { [key: string]: number }, visit) => {
      const purpose = visit.purpose ? visit.purpose.trim().toLowerCase() : 'unknown';
      if (!acc[purpose]) {
        acc[purpose] = 0;
      }
      acc[purpose]++;
      return acc;
    }, {});

    const visitsByPurposeChartData = Object.entries(visitsByPurpose).map(([purpose, visits]) => ({
      purpose: purpose.charAt(0).toUpperCase() + purpose.slice(1),
      visits: Number(visits),
    }));

    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold capitalize">{selectedEmployee}</h1>
          <Button variant="ghost" size="lg" onClick={() => setSelectedEmployee(null)}>
            <ArrowLeftIcon className="h-6 w-6" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard title="Total Completed Visits" value={totalVisits} />
     
        </div>
        <div className="mb-8">
          <DateRangeDropdown selectedOption={selectedOption} onDateRangeChange={handleDateRangeChange} />
        </div>
        <VisitsTable visits={completedEmployeeVisits} onViewDetails={handleViewDetails} currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="mt-8">
          <VisitsByPurposeChart data={visitsByPurposeChartData} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Sales Dashboard</h1>
        <div className="flex">
          <DateRangeDropdown selectedOption={selectedOption} onDateRangeChange={handleDateRangeChange} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {stateCards}
      </div>
    </div>
  );
};

export default Dashboard;
