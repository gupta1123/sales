import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useQuery, QueryClient, QueryClientProvider } from 'react-query';
import { useRouter } from 'next/router';
import { RootState } from '../store';
import VisitsTable from '../components/VisitList/VisitsTable';
import VisitsFilter from '../components/VisitList/VisitsFilter';
import { Visit } from '../components/VisitList/types';
import { format, subDays, addDays } from 'date-fns';
import { stringify } from 'csv-stringify';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';

const queryClient = new QueryClient();

const fetchVisits = async (
  token: string | null,
  startDate: Date | undefined,
  endDate: Date | undefined,
  purpose: string,
  storeName: string,
  employeeName: string,
  sortColumn: string | null,
  sortDirection: 'asc' | 'desc',
  currentPage: number,
  itemsPerPage: number
) => {
  const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : '';
  const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : '';
  let url = `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/getByDateSorted?startDate=${formattedStartDate}&endDate=${formattedEndDate}&page=${currentPage - 1}&size=${itemsPerPage}`;

  if (sortColumn) {
    url += `&sort=${sortColumn},${sortDirection}`;
  }

  if (purpose) {
    url += `&purpose=${encodeURIComponent(purpose)}`;
  }
  if (storeName) {
    url += `&storeName=${encodeURIComponent(storeName)}`;
  }
  if (employeeName) {
    url += `&employeeName=${encodeURIComponent(employeeName)}`;
  }

  const headers: { Authorization?: string } = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.get(url, {
    headers,
  });
  return response.data;
};

const fetchVisitsForTeam = async (
  token: string | null,
  teamId: number,
  startDate: Date | undefined,
  endDate: Date | undefined,
  purpose: string,
  storeName: string,
  sortColumn: string | null,
  sortDirection: 'asc' | 'desc',
  currentPage: number,
  itemsPerPage: number
) => {
  const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : '';
  const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : '';
  let url = `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/getForTeam?teamId=${teamId}&startDate=${formattedStartDate}&endDate=${formattedEndDate}&page=${currentPage - 1}&size=${itemsPerPage}`;

  if (sortColumn) {
    url += `&sort=${sortColumn},${sortDirection}`;
  }

  if (purpose) {
    url += `&purpose=${encodeURIComponent(purpose)}`;
  }
  if (storeName) {
    url += `&storeName=${encodeURIComponent(storeName)}`;
  }

  const headers: { Authorization?: string } = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.get(url, { headers });
  return response.data;
};

const fetchAllVisitsForTeam = async (
  token: string | null,
  teamId: number,
  startDate: Date | undefined,
  endDate: Date | undefined,
  sortColumn: string | null,
  sortDirection: 'asc' | 'desc'
) => {
  let page = 0;
  const itemsPerPage = 100;
  const allVisits = [];

  while (true) {
    const response = await fetchVisitsForTeam(
      token,
      teamId,
      startDate,
      endDate,
      '',
      '',
      sortColumn,
      sortDirection,
      page + 1,
      itemsPerPage
    );

    allVisits.push(...response.content);

    if (response.last) {
      break;
    }

    page++;
  }

  return allVisits;
};

const VisitsList: React.FC = () => {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);
  const teamId = useSelector((state: RootState) => state.auth.teamId);
  const state = typeof window !== 'undefined' ? history.state : undefined;
  const { date, employeeName: stateEmployeeName } = state || {};

  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [startDate, setStartDate] = useState<Date | undefined>(date ? new Date(date as string) : subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | undefined>(date ? new Date(date as string) : new Date());
  const [sortColumn, setSortColumn] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [purpose, setPurpose] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>(stateEmployeeName ? stateEmployeeName as string : '');
  const [visitsNavigate, setVisitsNavigate] = useState([]);

  const saveStateToLocalStorage = () => {
    const state = {
      startDate,
      endDate,
      sortColumn,
      sortDirection,
      itemsPerPage,
      currentPage,
      purpose,
      storeName,
      employeeName,
    };
    localStorage.setItem('visitsListState', JSON.stringify(state));
  };

  useEffect(() => {
    const selectedDate = localStorage.getItem('selectedDate');
    const storedEmployeeName = localStorage.getItem('employeeName');

    if (selectedDate) {
      setStartDate(new Date(selectedDate));
      setEndDate(new Date(selectedDate));
    }

    if (storedEmployeeName) {
      const cleanedEmployeeName = storedEmployeeName.trim().replace(/\s+/g, ' ');
      setEmployeeName(cleanedEmployeeName);
    }

    if (selectedDate && storedEmployeeName) {
      const encodedEmployeeName = encodeURIComponent(employeeName);

      const url = `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/getByDateSorted?startDate=${selectedDate}&endDate=${selectedDate}&page=0&size=10&sort=id,desc&employeeName=${encodedEmployeeName}`;

      const headers: { Authorization?: string } = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      axios.get(url, { headers })
        .then(response => {
          setVisitsNavigate(response.data.content);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
    }
  }, [employeeName]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('selectedDate');
      localStorage.removeItem('employeeName');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url !== '/VisitsList') {
        localStorage.removeItem('selectedDate');
        localStorage.removeItem('employeeName');
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);


  const loadStateFromLocalStorage = () => {
    const state = localStorage.getItem('visitsListState');
    if (state) {
      const parsedState = JSON.parse(state);
      setStartDate(new Date(parsedState.startDate));
      setEndDate(new Date(parsedState.endDate));
      setSortColumn(parsedState.sortColumn);
      setSortDirection(parsedState.sortDirection);
      setItemsPerPage(parsedState.itemsPerPage);
      setCurrentPage(parsedState.currentPage);
      setPurpose(parsedState.purpose);
      setStoreName(parsedState.storeName);
      setEmployeeName(parsedState.employeeName);
    }
  };

  useEffect(() => {
    // Clear dates from local storage if not explicitly set
    if (!localStorage.getItem('selectedDate')) {
      setStartDate(subDays(new Date(), 7));
      setEndDate(new Date());
    } else {
      loadStateFromLocalStorage();
    }
  }, []);

  useEffect(() => {
    saveStateToLocalStorage();
  }, [
    startDate,
    endDate,
    sortColumn,
    sortDirection,
    itemsPerPage,
    currentPage,
    purpose,
    storeName,
    employeeName,
  ]);

  const { data, error, isLoading } = useQuery(
    [
      'visits',
      token,
      role,
      teamId,
      startDate,
      endDate,
      purpose,
      storeName,
      employeeName,
      sortColumn,
      sortDirection,
      currentPage,
      itemsPerPage
    ],
    () => {
      if (role === 'MANAGER' && teamId) {
        return fetchVisitsForTeam(
          token,
          teamId,
          startDate,
          endDate,
          purpose,
          storeName,
          sortColumn,
          sortDirection,
          currentPage,
          itemsPerPage
        );
      } else if (role === 'ADMIN' || role === 'OFFICE MANAGER') {
        return fetchVisits(
          token,
          startDate,
          endDate,
          purpose,
          storeName,
          employeeName,
          sortColumn,
          sortDirection,
          currentPage,
          itemsPerPage
        );
      }
    },
    {
      enabled: !!token && (role === 'MANAGER' ? !!teamId : (role === 'ADMIN' || role === 'OFFICE MANAGER')),
      keepPreviousData: true,
    }
  );

  const visits = data?.content || [];
  const totalPages = data ? data.totalPages : 1;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleFilter = (filters: { storeName: string; employeeName: string; purpose: string }, clearFilters: boolean) => {
    setCurrentPage(1);
    setStoreName(filters.storeName);
    setEmployeeName(filters.employeeName);
    setPurpose(filters.purpose);
    if (clearFilters) {
      setStoreName('');
      setEmployeeName('');
      setPurpose('');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    const newValue = parseInt(value, 10);
    if (!isNaN(newValue)) {
      setItemsPerPage(newValue);
      setCurrentPage(1);
    }
  };

  const handleExport = (allVisits: Visit[]) => {
    const headers = selectedColumns
      .filter(column => column !== 'outcome')
      .map((column) => {
        switch (column) {
          case 'storeName':
            return 'Customer Name';
          case 'employeeName':
            return 'Executive';
          case 'visit_date':
            return 'Date';
          case 'purpose':
            return 'Purpose';
          case 'visitStart':
            return 'Visit Start';
          case 'visitEnd':
            return 'Visit End';
          case 'intent':
            return 'Intent';
          case 'storePrimaryContact':
            return 'Phone Number';
          case 'district':
            return 'District';
          case 'subDistrict':
            return 'Sub District';
          default:
            return column;
        }
      });

    const data = allVisits.map((visit: Visit) => {
      const row: any = {};
      selectedColumns
        .filter(column => column !== 'outcome')
        .forEach((column) => {
          switch (column) {
            case 'visitStart':
              row[column] = formatDateTime(visit.checkinDate, visit.checkinTime);
              break;
            case 'visitEnd':
              row[column] = formatDateTime(visit.checkoutDate, visit.checkoutTime);
              break;
            case 'storePrimaryContact':
              row[column] = visit.storePrimaryContact;
              break;
            case 'district':
              row[column] = visit.district;
              break;
            case 'subDistrict':
              row[column] = visit.subDistrict;
              break;
            default:
              row[column] = visit[column as keyof Visit];
          }
        });
      return Object.values(row);
    });

    stringify(data, { header: true, columns: headers }, (err, output) => {
      if (err) {
        console.error('Error converting data to CSV:', err);
        return;
      }
      const blob = new Blob([output], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'visits.csv';
      link.click();
    });
  };

  const handleColumnSelect = (column: string) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter((col) => col !== column));
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const [selectedColumns, setSelectedColumns] = useState([
    'storeName',
    'employeeName',
    'visit_date',
    'purpose',
    'outcome',
    'visitStart',
    'visitEnd',
    'intent',
    'city',
    'state',
    'storePrimaryContact',
    'district',
    'subDistrict',
  ]);

  const formatDateTime = (date: string | null | undefined, time: string | null | undefined) => {
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const formattedTime = format(
        new Date(`${date}T${hours}:${minutes}`),
        'dd MMM h:mm a'
      );
      return formattedTime;
    }
    return '';
  };

  const fetchAndExportAllVisits = async () => {
    if (role === 'MANAGER' && !teamId) return;
    if (role === 'MANAGER') {
      const allVisits = await fetchAllVisitsForTeam(
        token,
        teamId!,
        startDate,
        endDate,
        sortColumn,
        sortDirection
      );
      handleExport(allVisits);
    } else if (role === 'ADMIN' || role === 'OFFICE MANAGER') {
      const allVisits = await fetchVisits(
        token,
        startDate,
        endDate,
        purpose,
        storeName,
        employeeName,
        sortColumn,
        sortDirection,
        1,
        1000 // Fetch a large number of visits for export
      );
      handleExport(allVisits.content);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching visits: {(error as Error).message}</div>;
  }

  const renderPagination = () => {
    const pageNumbers = [];
    const displayPages = 5;
    const groupSize = 10;

    let startPage = Math.max(currentPage - Math.floor(displayPages / 2), 1);
    let endPage = startPage + displayPages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(endPage - displayPages + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <Pagination>
        <PaginationContent>
          {currentPage !== 1 && (
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
            />
          )}
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationLink>...</PaginationLink>
                </PaginationItem>
              )}
            </>
          )}
          {pageNumbers.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationLink>...</PaginationLink>
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
              </PaginationItem>
            </>
          )}
          {currentPage !== totalPages && (
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
            />
          )}
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Visits List</h2>

      <VisitsFilter
        onFilter={handleFilter}
        onColumnSelect={handleColumnSelect}
        onExport={fetchAndExportAllVisits}
        selectedColumns={selectedColumns}
        viewMode={viewMode}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        purpose={purpose}
        setPurpose={setPurpose}
        storeName={storeName}
        setStoreName={setStoreName}
        employeeName={employeeName}
        setEmployeeName={setEmployeeName}
      />

      <br />
      <VisitsTable
        visits={visits.length > 0 ? visits : visitsNavigate}
        selectedColumns={selectedColumns}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onSort={handleSort}
        onBulkAction={() => { }}
      />

      <div className="mt-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span>Items per page:</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {renderPagination()}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <VisitsList />
  </QueryClientProvider>
);

export default App;
