'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays, differenceInDays } from 'date-fns';
import { CalendarIcon, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/router';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Task {
    id: number;
    taskTitle: string;
    taskDescription: string;
    dueDate: string;
    assignedToId: number;
    assignedToName: string;
    assignedById: number;
    status: string;
    priority: string;
    category: string;
    storeId: number;
    storeName: string;
    storeCity: string;
    taskType: string;
}

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
}

interface Store {
    id: number;
    storeName: string;
}

const Complaints = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState<Task>({
        id: 0,
        taskTitle: '',
        taskDescription: '',
        dueDate: '',
        assignedToId: 0,
        assignedToName: '',
        assignedById: 86,
        status: 'Assigned',
        priority: 'low',
        category: 'Complaint',
        storeId: 0,
        storeName: '',
        storeCity: '',
        taskType: 'complaint'
    });
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('general');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        employee: '',
        priority: '',
        status: '',
        search: '',
        startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [viewMode, setViewMode] = useState('card');
    const [isLoading, setIsLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const token = useSelector((state: RootState) => state.auth.token);
    const role = useSelector((state: RootState) => state.auth.role);
    const teamId = useSelector((state: RootState) => state.auth.teamId);

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage(null);
            }, 20000); // 20 seconds

            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    const handleDateChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };

        if (newFilters.startDate && newFilters.endDate) {
            const startDate = new Date(newFilters.startDate);
            const endDate = new Date(newFilters.endDate);

            if (differenceInDays(endDate, startDate) > 30) {
                setErrorMessage('Date range should not exceed 30 days');
                return;
            }
        }

        setFilters(newFilters);
    };

    const handleNext = () => {
        setActiveTab('details');
    };

    const handleBack = () => {
        setActiveTab('general');
    };

    const handleViewStore = (storeId: number) => {
        router.push(`/CustomerDetailPage/${storeId}`);
    };

    const handleViewFieldOfficer = (employeeId: number) => {
        router.push(`/SalesExecutive/${employeeId}`);
    };

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const formattedStartDate = format(new Date(filters.startDate), 'yyyy-MM-dd');
            const formattedEndDate = format(new Date(filters.endDate), 'yyyy-MM-dd');

            const url = role === 'MANAGER' ?
                `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/task/getByTeamAndDate?start=${formattedStartDate}&end=${formattedEndDate}&id=${teamId}` :
                `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/task/getByDate?start=${formattedStartDate}&end=${formattedEndDate}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();

            const filteredTasks = data
                .filter((task: any) => task.taskType === 'complaint')
                .map((task: any) => ({
                    ...task,
                    taskDescription: task.taskDescription,
                    assignedToName: task.assignedToName || 'Unknown',
                }))
                .sort((a: Task, b: Task) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

            setTasks(filteredTasks);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setIsLoading(false);
        }
    }, [role, filters, teamId, token]);

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await fetch('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getAll', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, [token]);

    const fetchStores = useCallback(async () => {
        try {
            const response = await fetch('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/names', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setStores(data);
        } catch (error) {
            console.error('Error fetching stores:', error);
        }
    }, [token]);

    useEffect(() => {
        fetchTasks();
    }, [token, currentPage, filters, fetchTasks]);

    useEffect(() => {
        if (isModalOpen) {
            fetchEmployees();
            fetchStores();
        }
    }, [isModalOpen, token, fetchEmployees, fetchStores]);

    useEffect(() => {
        applyFilters();
    }, [tasks, filters]);

    const applyFilters = () => {
        const filtered = tasks
            .filter(
                (task) =>
                    task.taskType === 'complaint' &&
                    (
                        (task.taskDescription?.toLowerCase() || '').includes(filters.search.toLowerCase()) ||
                        (task.storeName?.toLowerCase() || '').includes(filters.search.toLowerCase())
                    ) &&
                    (filters.employee === '' || filters.employee === 'all' ? true : task.assignedToId === parseInt(filters.employee)) &&
                    (filters.priority === '' || filters.priority === 'all' ? true : task.priority === filters.priority) &&
                    (filters.status === '' || filters.status === 'all' ? true : task.status === filters.status) &&
                    (filters.startDate === '' || new Date(task.dueDate) >= new Date(filters.startDate)) &&
                    (filters.endDate === '' || new Date(task.dueDate) <= new Date(filters.endDate))
            );

        setFilteredTasks(filtered);
    };

    const createTask = async () => {
        try {
            const taskToCreate = {
                ...newTask,
                dueDate: format(new Date(newTask.dueDate), 'yyyy-MM-dd'), // Ensuring only the date part is included
                taskType: 'complaint',
            };

            const response = await fetch('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/task/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(taskToCreate),
            });
            const data = await response.json();

            const createdTask = {
                ...newTask,
                id: data.id,
                assignedToName: employees.find(emp => emp.id === newTask.assignedToId)?.firstName + ' ' + employees.find(emp => emp.id === newTask.assignedToId)?.lastName || 'Unknown',
                storeName: stores.find(store => store.id === newTask.storeId)?.storeName || '',
            };

            setTasks(prevTasks => [createdTask, ...prevTasks]);

            setNewTask({
                id: 0,
                taskTitle: '',
                taskDescription: '',
                dueDate: '',
                assignedToId: 0,
                assignedToName: '',
                assignedById: 86,
                status: 'Assigned',
                priority: 'low',
                category: 'Complaint',
                storeId: 0,
                storeName: '',
                storeCity: '',
                taskType: 'complaint'
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const updateTaskStatus = async (taskId: number, newStatus: string) => {
        try {
            const response = await fetch(
                `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/task/updateTask?taskId=${taskId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (response.ok) {
                setTasks((prevTasks) =>
                    prevTasks.map((task) =>
                        task.id === taskId ? { ...task, status: newStatus } : task
                    )
                );
            } else {
                console.error('Failed to update task status');
            }
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    const deleteTask = async (taskId: number) => {
        console.log('Deleting task with ID:', taskId); // Log the taskId for debugging
        try {
            const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/task/deleteById?taskId=${taskId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                fetchTasks(); // Fetch tasks again after deleting
                console.log('Task deleted successfully');
            } else {
                const errorData = await response.json();
                console.error('Error Deleting Task:', errorData.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [key]: value,
        }));
    };

    const renderTag = (value: string | null | undefined, type: string) => {
        if (!value) {
            return null;
        }

        let className = 'tag ';
        switch (value.toLowerCase()) {
            case 'assigned':
                className += 'tag-blue';
                break;
            case 'work in progress':
                className += 'tag-yellow';
                break;
            case 'complete':
                className += 'tag-green';
                break;
            case 'low':
                className += 'tag-green';
                break;
            case 'medium':
                className += 'tag-orange';
                break;
            case 'high':
                className += 'tag-red';
                break;
            default:
                className += '';
                break;
        }
        return <span className={className}>{value}</span>;
    };

    const renderPagination = () => {
        const totalPages = Math.ceil(filteredTasks.length / 10);
        const pageNumbers = [];
        const displayPages = 5;

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
                    {currentPage !== 1 && <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />}
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
                            <PaginationLink isActive={page === currentPage} onClick={() => handlePageChange(page)}>
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
                    {currentPage !== totalPages && <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />}
                </PaginationContent>
            </Pagination>
        );
    };

    const renderComplaintCard = (task: Task) => (
        <Card key={task.id} className="mb-4 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ borderRadius: '12px' }}>
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1" style={{ letterSpacing: '-0.025em' }}>{task.storeName}</h3>
                        <p className="text-sm text-gray-500" style={{ fontWeight: 500 }}>{format(new Date(task.dueDate), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority.toLowerCase() === 'low' ? 'bg-green-100 text-green-800' :
                            task.priority.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            {task.priority}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleViewStore(task.storeId)} className="text-sm">
                                    View Store
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewFieldOfficer(task.assignedToId)} className="text-sm">
                                    View Field Officer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-sm text-red-600">
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <h4 className="text-base font-medium text-gray-700 mb-3" style={{ lineHeight: '1.4' }}>{task.taskTitle || 'Untitled Complaint'}</h4>

                <div className="flex justify-between mb-4 text-sm">
                    <div>
                        <span className="text-gray-500">Assigned to:</span>
                        <p className="font-medium text-gray-800">{task.assignedToName}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-gray-500">Store City:</span>
                        <p className="font-medium text-gray-800">{task.storeCity}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    <Select
                        value={task.status}
                        onValueChange={(value) => updateTaskStatus(task.id, value)}
                    >
                        <SelectTrigger className="w-[180px] h-9 text-sm">
                            <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Assigned">Assigned</SelectItem>
                            <SelectItem value="Work In Progress">Work In Progress</SelectItem>
                            <SelectItem value="Complete">Complete</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
    );

    const renderTableView = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredTasks.slice((currentPage - 1) * 10, currentPage * 10).map(task => (
                    <TableRow key={task.id}>
                        <TableCell>{task.taskTitle}</TableCell>
                        <TableCell>{task.taskDescription}</TableCell>
                        <TableCell>{task.assignedToName}</TableCell>
                        <TableCell>{task.priority}</TableCell>
                        <TableCell>{task.status}</TableCell>
                        <TableCell>{format(new Date(task.dueDate), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    return (
        <div className="container mx-auto py-12 outlined-container">
            <h1 className="text-3xl font-bold mb-6">Complaints Management</h1>
            <div className="mb-4 flex flex-col space-y-4">
                <div className="flex space-x-4">
                    <Input
                        placeholder="Search by description or store name"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-[150px]" // Custom width for the search input
                    />

                    <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Assigned">Assigned</SelectItem>
                            <SelectItem value="Work In Progress">Work In Progress</SelectItem>
                            <SelectItem value="Complete">Complete</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={`w-[200px] justify-start text-left font-normal ${!filters.startDate && 'text-muted-foreground'}`}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filters.startDate ? format(new Date(filters.startDate), 'PPP') : <span>Start Date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={filters.startDate ? new Date(filters.startDate) : undefined}
                                onSelect={(date) => handleDateChange('startDate', date?.toISOString() || '')}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={`w-[200px] justify-start text-left font-normal ${!filters.endDate && 'text-muted-foreground'}`}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filters.endDate ? format(new Date(filters.endDate), 'PPP') : <span>End Date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={filters.endDate ? new Date(filters.endDate) : undefined}
                                onSelect={(date) => handleDateChange('endDate', date?.toISOString() || '')}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={() => { setIsModalOpen(true); setActiveTab('general'); }} className="ml-4">
                        Log New Complaint
                    </Button>
                </div>
                {errorMessage && <p className="text-red-600 mt-2">{errorMessage}</p>}
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create Complaint</DialogTitle>
                        <DialogDescription>Fill in the complaint details.</DialogDescription>
                    </DialogHeader>
                    <Tabs value={activeTab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="general" onClick={() => setActiveTab('general')}>General</TabsTrigger>
                            <TabsTrigger value="details" onClick={() => setActiveTab('details')}>Details</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="taskTitle">Complaint Title</Label>
                                    <Input
                                        id="taskTitle"
                                        placeholder="Enter complaint title"
                                        value={newTask.taskTitle}
                                        onChange={(e) => setNewTask({ ...newTask, taskTitle: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="taskDescription">Complaint Description</Label>
                                    <Input
                                        id="taskDescription"
                                        placeholder="Enter complaint description"
                                        value={newTask.taskDescription}
                                        onChange={(e) => setNewTask({ ...newTask, taskDescription: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Complaint">Complaint</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-between mt-4">
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button onClick={handleNext}>Next</Button>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="details">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`w-[280px] justify-start text-left font-normal ${!newTask.dueDate && 'text-muted-foreground'}`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newTask.dueDate ? format(new Date(newTask.dueDate), 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={newTask.dueDate ? new Date(newTask.dueDate) : undefined}
                                                onSelect={(date) => setNewTask({ ...newTask, dueDate: date?.toISOString() || '' })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="assignedToId">Assigned To</Label>
                                    <Select
                                        value={newTask.assignedToId ? newTask.assignedToId.toString() : ''}
                                        onValueChange={(value) => {
                                            const selectedEmployee = employees.find(emp => emp.id === parseInt(value));
                                            setNewTask({ ...newTask, assignedToId: parseInt(value), assignedToName: selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'Unknown' });
                                        }}
                                    >
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Select an employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map((employee) => (
                                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                                    {employee.firstName} {employee.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Select a priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="storeId">Store</Label>
                                    <Select
                                        value={newTask.storeId ? newTask.storeId.toString() : ''}
                                        onValueChange={(value) => setNewTask({ ...newTask, storeId: parseInt(value) })}
                                    >
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Select a store" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stores.map((store) => (
                                                <SelectItem key={store.id} value={store.id.toString()}>
                                                    {store.storeName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-between mt-4">
                                    <Button variant="outline" onClick={handleBack}>Back</Button>
                                    <Button onClick={createTask}>Create Complaint</Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? (
                        <p>Loading...</p>
                    ) : filteredTasks.length === 0 ? (
                        <p>No complaints found.</p>
                    ) : (
                        filteredTasks.slice((currentPage - 1) * 10, currentPage * 10).map(renderComplaintCard)
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    {renderTableView()}
                </div>
            )}

            <div className="mt-8 flex justify-between items-center">
                {renderPagination()}
            </div>
        </div >
    );
};

export default Complaints;
