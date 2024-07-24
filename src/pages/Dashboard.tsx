import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, fetchUserInfo } from '../store';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { ClipLoader } from 'react-spinners';
import EmployeeCard1 from './EmployeeCard1';
import EmployeeDetails from './EmployeeDetails';
import DateRangeDropdown from './DateRangeDropdown';

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
  const { view, state, employee, startDate: queryStartDate, endDate: queryEndDate } = router.query;

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
        returnTo: 'employeeDetails',
        employeeId: selectedEmployee,
        startDate: startDate,
        endDate: endDate,
      },
    });
  }, [router, selectedEmployee, startDate, endDate]);

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
        />
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
