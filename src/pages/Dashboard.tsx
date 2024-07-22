import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, fetchUserInfo } from '../store';
import { ChevronUpIcon, ChevronDownIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
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
  employeeFirstName: string;
  employeeLastName: string;
  employeeState: string;
  statsDto: {
    completedVisitCount: number;
    fullDays: number;
    halfDays: number;
    absences: number;
  };
}

interface StateCardProps {
  state: string;
  totalEmployees: number;
  onClick: () => void;
}

const StateCard = ({ state, totalEmployees, onClick }: StateCardProps) => {
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
  const [lastClickedColumn, setLastClickedColumn] = useState<keyof Visit | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number | null>(null);

  useEffect(() => {
    if (lastClickTime) {
      const timer = setTimeout(() => {
        setLastClickedColumn(null);
        setLastClickTime(null);
      }, 20000);

      return () => clearTimeout(timer);
    }
  }, [lastClickTime]);

  const getOutcomeStatus = (visit: Visit): { emoji: React.ReactNode; status: string; color: string } => {
    if (visit.checkinDate && visit.checkinTime && visit.checkoutDate && visit.checkoutTime) {
      return { emoji: ' ', status: 'Completed', color: 'bg-purple-100 text-purple-800' };
    } else if (visit.checkoutDate && visit.checkoutTime) {
      return { emoji: ' ', status: 'Checked Out', color: 'bg-orange-100 text-orange-800' };
    } else if (visit.checkinDate && visit.checkinTime) {
      return { emoji: ' ', status: 'On Going', color: 'bg-green-100 text-green-800' };
    }
    return { emoji: ' ', status: 'Assigned', color: 'bg-blue-100 text-blue-800' };
  };

  const handleSort = (column: keyof Visit) => {
    if (column === sortColumn) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
    setLastClickedColumn(column);
    setLastClickTime(Date.now());
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
                {lastClickedColumn === 'storeName' && (
                  sortOrder === 'asc' ? (
                    <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                  )
                )}
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('employeeName')}>
                Employee
                {lastClickedColumn === 'employeeName' && (
                  sortOrder === 'asc' ? (
                    <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                  )
                )}
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('visit_date')}>
                Date
                {lastClickedColumn === 'visit_date' && (
                  sortOrder === 'asc' ? (
                    <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                  )
                )}
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('purpose')}>
                Purpose
                {lastClickedColumn === 'purpose' && (
                  sortOrder === 'asc' ? (
                    <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                  )
                )}
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('city')}>
                City
                {lastClickedColumn === 'city' && (
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
                  <td className="px-4 py-2">{format(parseISO(visit.visit_date), "dd MMM ''yy")}</td>
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
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(currentPage - 1)}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              >
                Previous
              </PaginationLink>
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  onClick={() => onPageChange(index + 1)}
                  className={currentPage === index + 1 ? 'bg-gray-300' : ''}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(currentPage + 1)}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              >
                Next
              </PaginationLink>
            </PaginationItem>
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
  const [employeeDetails, setEmployeeDetails] = useState<{
    statsDto: { completedVisitCount: number, fullDays: number, halfDays: number, absences: number } | null,
    visitDto: Visit[] | null
  } | null>(null);

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

  const fetchVisits = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/report/getCounts?startDate=${start}&endDate=${end}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch visits: ${response.statusText}`);
      }

      const data = await response.json();
      setVisits(data);
    } catch (error) {
      console.error('Error fetching visits:', error);
      setVisits([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchEmployeeDetails = useCallback(async (employeeName: string, start: string, end: string) => {
    setIsLoading(true);
    try {
      const employeeId = visits.find(v => `${v.employeeFirstName} ${v.employeeLastName}`.toLowerCase() === employeeName.toLowerCase())?.employeeId;

      if (!employeeId) {
        throw new Error("Employee not found");
      }

      const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/getByDateRangeAndEmployeeStats?id=${employeeId}&start=${start}&end=${end}`, {
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
  }, [router.query]);

  const handleStateClick = useCallback((state: string) => {
    setSelectedState(state.trim().toLowerCase() || 'unknown');
    setSelectedEmployee(null);
    router.push({
      pathname: '/Dashboard',
      query: { state: state.trim().toLowerCase() || 'unknown' },
    }, undefined, { shallow: true });
  }, [router]);

  const handleEmployeeClick = useCallback(async (employeeName: string, employeeId: number) => {
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

  const handleViewDetails = useCallback((visitId: string) => {
    router.push({
      pathname: `/VisitDetailPage/${visitId}`,
      query: {
        returnTo: 'dashboard',
        state: selectedState,
        employee: selectedEmployee,
      },
    });
  }, [router, selectedEmployee, selectedState]);

  const stateCards = useMemo(() => {
    const stateData = visits.reduce((acc: { [key: string]: { employees: Set<string>, visits: number } }, visit) => {
      const state = (visit.employeeState || 'unknown').trim().toLowerCase();
      if (!acc[state]) {
        acc[state] = { employees: new Set(), visits: 0 };
      }
      // Only count employees with completed visits
      if (visit.statsDto && visit.statsDto.completedVisitCount > 0) {
        acc[state].employees.add(`${visit.employeeFirstName || 'Unknown'} ${visit.employeeLastName || ''}`);
        acc[state].visits += visit.statsDto.completedVisitCount;
      }
      return acc;
    }, {});

    return Object.entries(stateData)
      .filter(([_, data]) => data.employees.size > 0) // Only show states with active employees
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
          onClick={() => handleEmployeeClick(employeeName, employeeData.employeeId)}
        />
      );
    });
  }, [selectedState, visits, handleEmployeeClick]);

  const visitsByPurposeChartData = useMemo(() => {
    if (!employeeDetails || !employeeDetails.visitDto) return [];

    const completedVisits = employeeDetails.visitDto.filter((visit) =>
      visit.checkinDate && visit.checkinTime && visit.checkoutDate && visit.checkoutTime
    );

    const visitsByPurpose = completedVisits.reduce((acc: { [key: string]: number }, visit) => {
      const purpose = visit.purpose ? visit.purpose.trim().toLowerCase() : 'unknown';
      if (!acc[purpose]) {
        acc[purpose] = 0;
      }
      acc[purpose]++;
      return acc;
    }, {});

    return Object.entries(visitsByPurpose).map(([purpose, visits]) => ({
      purpose: purpose.charAt(0).toUpperCase() + purpose.slice(1),
      visits: Number(visits),
    }));
  }, [employeeDetails]);

  return (
    <div className="container mx-auto py-8">
      {selectedState && !selectedEmployee ? (
        <>
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
            {employeeCards.length > 0 ? employeeCards : (
              <p>No employees with completed visits in this date range.</p>
            )}
          </div>
        </>
      ) : selectedEmployee && employeeDetails ? (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold capitalize">{selectedEmployee}</h1>
            <Button variant="ghost" size="lg" onClick={() => setSelectedEmployee(null)}>
              <ArrowLeftIcon className="h-6 w-6" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard title="Total Completed Visits" value={employeeDetails.statsDto ? employeeDetails.statsDto.completedVisitCount : 0} />
            <KPICard title="Full Days" value={employeeDetails.statsDto ? employeeDetails.statsDto.fullDays : 0} />
            <KPICard title="Half Days" value={employeeDetails.statsDto ? employeeDetails.statsDto.halfDays : 0} />
            <KPICard title="Absences" value={employeeDetails.statsDto ? employeeDetails.statsDto.absences : 0} />
          </div>
          <div className="mb-8">
            <DateRangeDropdown selectedOption={selectedOption} onDateRangeChange={handleDateRangeChange} />
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <ClipLoader color="#4A90E2" size={50} />
            </div>
          ) : (
            <>
              <VisitsTable
                visits={employeeDetails.visitDto || []}
                onViewDetails={handleViewDetails}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
              <div className="mt-8">
                <VisitsByPurposeChart data={visitsByPurposeChartData} />
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Sales Dashboard</h1>
            <div className="flex">
              <DateRangeDropdown selectedOption={selectedOption} onDateRangeChange={handleDateRangeChange} />
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <ClipLoader color="#4A90E2" size={50} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {stateCards.length > 0 ? stateCards : (
                <p>No states with active employees in this date range.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
