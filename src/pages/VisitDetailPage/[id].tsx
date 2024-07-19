import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { Button, Modal, Input, message, Dropdown, Menu } from 'antd';

import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import './VisitDetail.css';
import BrandTab from './BrandTab';

type Metric = {
  title: string;
  value: string;
};

type Task = {
  id: number;
  taskTitle: string;
  taskDesciption: string;
  taskType: string;
  dueDate: string;
  assignedToId: number;
  assignedToName: string;
  assignedById: number;
  assignedByName: string;
  storeId: number;
  storeName: string;
  storeCity: string;
  visitId: number;
  visitDate: string;
  status: string;
  priority: Priority;
  attachment: any[];
  attachmentResponse: any[];
  createdAt: string;
  updatedAt: string;
  createdTime: string;
  updatedTime: string;
};

type Priority = 'low' | 'medium' | 'high';

type VisitDetail = {
  id: number;
  storeName: string;
  employeeName: string;
  visit_date: string;
  purpose: string;
  priority: string;
  outcome: string | null;
  brandsInUse: string[];
  brandProCons: {
    id: number;
    brandName: string;
    pros: string[];
    cons: string[];
  }[];
  createdAt: string;
  updatedAt: string;
  storeId: number;
  employeeId: number;
  checkinLatitude?: number;
  checkinLongitude?: number;
  checkinTime?: string;
  checkoutTime?: string;
};

type Visit = {
  id: number;
  storeId: number;
  storeName: string;
  employeeId: number;
  employeeName: string;
  visit_date: string;
  purpose: string;
};

type BrandProCons = {
  id: number;
  brandName: string;
  pros: string[];
  cons: string[];
};

type Note = {
  id: number;
  content: string;
  employeeId: number;
  employeeName: string;
  storeId: number;
  storeName: string;
  visitId: number;
  createdDate: string;
  updatedDate: string;
  createdTime: string;
  updatedTime: string;
};

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
};

type Store = {
  id: number;
  storeName: string;
};

const VisitDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query || {};


  const [visitDetail, setVisitDetail] = useState<VisitDetail | null>(null);
  const [activeTab, setActiveTab] = useState('visits');

  const [activeInfoTab, setActiveInfoTab] = useState('visit-info');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [requirements, setRequirements] = useState<Task[]>([]);
  const [complaints, setComplaints] = useState<Task[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const token = useSelector((state: RootState) => state.auth.token);
  const [notes, setNotes] = useState<Note[]>([]);
  const [brands, setBrands] = useState<BrandProCons[]>([]);

  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const visitsPerPage = 3;

  const [searchQuery, setSearchQuery] = useState('');

  const [showAll, setShowAll] = useState(false);

  const [proConEditing, setProConEditing] = useState<{ [key: string]: boolean }>({});

  const [editingProCon, setEditingProCon] = useState<{ [key: string]: boolean }>({});

  const [checkinImages, setCheckinImages] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);


  const [editingNoteDetails, setEditingNoteDetails] = useState<{ employeeId: number; storeId: number } | null>(null);
  const [requirementPriorityFilter, setRequirementPriorityFilter] = useState('All');
  const [complaintPriorityFilter, setComplaintPriorityFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [filteredRequirements, setFilteredRequirements] = useState<Task[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Task[]>([]);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [activeRequirementTab, setActiveRequirementTab] = useState('general');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [newTask, setNewTask] = useState<Task>({
    id: 0,
    taskTitle: '',
    taskDesciption: '',
    dueDate: '',
    assignedToId: 0,
    assignedToName: '',
    assignedById: 97,
    assignedByName: '',
    storeId: 0,
    storeName: '',
    storeCity: '',
    visitId: Number(id),
    visitDate: '',
    status: 'Assigned',
    priority: 'low',
    taskType: 'requirement',
    attachment: [],
    attachmentResponse: [],
    createdAt: '',
    updatedAt: '',
    createdTime: '',
    updatedTime: '',
  });
  type BrandProCons = {
    id: number;
    brandName: string;
    pros: string[];
    cons: string[];
  };
  const indexOfLastVisit = currentPage * visitsPerPage;
  const indexOfFirstVisit = indexOfLastVisit - visitsPerPage;
  const currentVisits = visits.slice(indexOfFirstVisit, indexOfLastVisit);

  const totalPages = Math.ceil(visits.length / visitsPerPage);
  const statusColors: { [key: string]: string } = {
    Assigned: 'bg-blue-100 text-blue-800',
    'Work in Progress': 'bg-orange-100 text-orange-800',
    Complete: 'bg-green-100 text-green-800',
  };
  const renderPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => handlePageChange(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (
        (i === currentPage - 2 && i > 2) ||
        (i === currentPage + 2 && i < totalPages - 1)
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    return items;
  };
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getOutcomeStatus = (visit: VisitDetail | null): { emoji: React.ReactNode; status: string; color: string; isOngoing: boolean } => {
    if (visit?.checkinTime && visit?.checkoutTime) {
      return { emoji: '✅', status: 'Completed', color: 'bg-purple-100 text-purple-800', isOngoing: false };
    } else if (visit?.checkoutTime) {
      return { emoji: '⏱️', status: 'Checked Out', color: 'bg-orange-100 text-orange-800', isOngoing: false };
    } else if (visit?.checkinTime) {
      return { emoji: '🕰️', status: 'On Going', color: 'bg-green-100 text-green-800', isOngoing: true };
    }
    return { emoji: '📅', status: 'Assigned', color: 'bg-blue-100 text-blue-800', isOngoing: false };
  };

  const fetchEmployees = async () => {
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
  };

  const fetchStores = async () => {
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
  };

  useEffect(() => {
    filterTasks();
  }, [requirements, complaints, priorityFilter]);

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value);
  };

  const fetchVisitDetail = async (visitId: string) => {
    try {
      const response = await axios.get(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/getById?id=${visitId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      const data = response.data;
      setVisitDetail(data);
      setBrands(data.brandProCons);
      calculateVisitDuration(data.checkinTime, data.checkoutTime);
      fetchIntentLevel(visitId);
      fetchMonthlySales(visitId);
      fetchTasks(visitId, 'requirement', setRequirements);
      fetchTasks(visitId, 'complaint', setComplaints);
      fetchVisits(data.storeId);
      fetchCheckinImages(visitId, data.attachmentResponse);
      fetchNotes(visitId);
    } catch (error) {
      console.error('Error fetching visit detail:', error);
    }
  };

  const fetchCheckinImages = async (visitId: string, attachments: any[]) => {
    try {
      const checkinImageUrls = await Promise.all(
        attachments
          .filter((attachment: any) => attachment.tag === 'check-in')
          .map(async (attachment: any) => {
            const response = await axios.get(
              `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/downloadFile/${visitId}/check-in/${attachment.fileName}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                responseType: 'blob',
              }
            );
            return URL.createObjectURL(response.data);
          })
      );
      setCheckinImages(checkinImageUrls);
    } catch (error) {
      console.error('Error fetching check-in images:', error);
    }
  };

  const handleViewStore = () => {
    if (visitDetail && visitDetail.storeId) {
      router.push(`/CustomerDetailPage/${visitDetail.storeId}`);
    } else {
      message.error('Store information is not available');
    }
  };

  const fetchVisits = useCallback(
    async (storeId: number) => {
      try {
        const response = await fetch(
          `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/getByStore?id=${storeId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data: Visit[] = await response.json();
        const sortedVisits = data.sort(
          (a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
        );
        setVisits(sortedVisits);
        setIsLoading(false);
      } catch (error) {
        setError('Failed to fetch visits.');
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const visitId = getVisitId();
    if (visitId && token) {
      fetchVisitDetail(visitId);
    }
  }, [id, token]);

  const filterTasks = () => {
    const filterByPriority = (tasks: Task[]) => {
      if (priorityFilter === 'all') return tasks;
      return tasks.filter(task => task.priority === priorityFilter);
    };

    setFilteredRequirements(filterByPriority(requirements));
    setFilteredComplaints(filterByPriority(complaints));
  };

  const calculateVisitDuration = (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(`1970-01-01T${checkIn}Z`);
    const checkOutDate = new Date(`1970-01-01T${checkOut}Z`);
    const duration = new Date(checkOutDate.getTime() - checkInDate.getTime());
    const hours = duration.getUTCHours();
    const minutes = duration.getUTCMinutes();
    let visitDuration = '0';
    if (hours > 0 || minutes > 0) {
      visitDuration = `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ` : ''}${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`.trim();
    }

    setMetrics((prevMetrics) => {
      const updatedMetrics = prevMetrics.filter(metric => metric.title !== 'Visit Duration');
      return [
        ...updatedMetrics,
        { title: 'Visit Duration', value: visitDuration },
      ];
    });
  };

  const fetchIntentLevel = async (visitId: string) => {
    try {
      const response = await axios.get(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/intent-audit/getByVisit?id=${visitId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data;
      const recentIntent = data[data.length - 1]?.newIntentLevel || 'N/A';
      setMetrics((prevMetrics) => {
        const updatedMetrics = prevMetrics.filter(metric => metric.title !== 'Intent Level');
        return [
          ...updatedMetrics,
          { title: 'Intent Level', value: recentIntent },
        ];
      });
    } catch (error) {
      console.error('Error fetching intent level:', error);
    }
  };

  const fetchMonthlySales = async (visitId: string) => {
    try {
      const response = await axios.get(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/monthly-sale/getByVisit?visitId=${visitId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data;
      const recentSales = `${data[0].newMonthlySale.toLocaleString()} tons`;
      setMetrics((prevMetrics) => {
        const updatedMetrics = prevMetrics.filter(metric => metric.title !== 'Monthly Sales');
        return [
          ...updatedMetrics,
          { title: 'Monthly Sales', value: recentSales },
        ];
      });
    } catch (error) {
      console.error('Error fetching monthly sales:', error);
    }
  };

  const fetchTasks = async (
    visitId: string,
    type: string,
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  ) => {
    try {
      const response = await axios.get(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/task/getByVisit?type=${type}&visitId=${visitId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      setTasks(response.data);
    } catch (error) {
      console.error(`Error fetching ${type}s:`, error);
    }
  };

  const fetchNotes = async (visitId: string) => {
    try {
      const response = await axios.get(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/notes/getByVisit?id=${visitId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const addNote = () => {
    setIsEditMode(false);
    setNoteContent('');
    setIsModalVisible(true);
  };

  const editNote = (note: Note) => {
    setNoteContent(note.content);
    setIsEditMode(true);
    setEditingNoteId(note.id); // Ensure this is correctly set
    setEditingNoteDetails({ employeeId: note.employeeId, storeId: note.storeId });
    setIsModalVisible(true);
  };


  const saveNote = async () => {
    if (!noteContent.trim()) return;

    try {
      if (isEditMode && editingNoteId !== null) {
        if (editingNoteDetails) {
          await axios.put(
            `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/notes/edit?id=${editingNoteId}`,
            {
              content: noteContent,
              employeeId: editingNoteDetails.employeeId,
              storeId: editingNoteDetails.storeId,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const updatedNotes = notes.map((note) =>
            note.id === editingNoteId ? { ...note, content: noteContent } : note
          );
          setNotes(updatedNotes);
          message.success('Note updated successfully!');
        }
      } else if (visitDetail) {
        const response = await axios.post(
          'http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/notes/create',
          {
            content: noteContent,
            employeeId: visitDetail.employeeId,
            storeId: visitDetail.storeId,
            visitId: visitDetail.id,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const newNote: Note = {
          id: response.data.id,
          content: noteContent,
          createdDate: new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0],
          createdTime: new Date().toISOString(),
          updatedTime: new Date().toISOString(),
          employeeId: visitDetail.employeeId,
          employeeName: visitDetail.employeeName,
          storeId: visitDetail.storeId,
          storeName: visitDetail.storeName,
          visitId: visitDetail.id,
        };
        setNotes([newNote, ...notes]);
        message.success('Note added successfully!');
      }
      setIsModalVisible(false);
      setNoteContent('');
      setIsEditMode(false);
      setEditingNoteId(null);
    } catch (error) {
      console.error('Error saving note:', error);
      message.error('Error saving note.');
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await axios.delete(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/notes/delete?id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNotes(notes.filter((note) => note.id !== id));
      message.success('Note deleted successfully!');
    } catch (error) {
      console.error('Error deleting note:', error);
      message.error('Error deleting note.');
    }
  };

  const handleAddProCon = (brandName: string) => {
    setEditingProCon({ ...editingProCon, [brandName]: true });
  };

  const handleSaveProCon = async (brandName: string, pros: string[], cons: string[]) => {
    try {
      await axios.post(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/addProCons?visitId=${id}`,
        [
          {
            brandName,
            pros,
            cons,
          },
        ],
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      setEditingProCon({ ...editingProCon, [brandName]: false });
      setNewPro('');
      setNewCon('');
      fetchVisitDetail(id as string); // Refresh the visit details
    } catch (error) {
      console.error('Error saving Pro/Con:', error);
      message.error('Error saving Pro/Con.');
    }
  };

  const handleDeleteProCon = async (brandName: string) => {
    try {
      await axios.post(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/deleteProCons?visitId=${id}`,
        [
          {
            brandName,
          },
        ],
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      fetchVisitDetail(id as string); // Refresh the visit details
    } catch (error) {
      console.error('Error deleting Pro/Con:', error);
      message.error('Error deleting Pro/Con.');
    }
  };

  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    const initials = nameParts.map((part) => part[0]).join('');
    return initials.toUpperCase().slice(0, 2);
  };

  const handleNext = () => {
    setActiveRequirementTab('details');
  };

  const handleBack = () => {
    setActiveRequirementTab('general');
  };

  const createTask = async (taskType: string) => {
    try {
      const taskToCreate = {
        ...newTask,
        taskType,
        storeId: visitDetail?.storeId ?? 0, // Ensure storeId is a number
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
        storeId: visitDetail?.storeId ?? 0, // Ensure storeId is a number
      };

      if (taskType === 'requirement') {
        setRequirements(prevTasks => [
          { ...createdTask, storeId: createdTask.storeId ?? 0 }, // Ensure storeId is a number
          ...prevTasks,
        ]);
      } else {
        setComplaints(prevTasks => [
          { ...createdTask, storeId: createdTask.storeId ?? 0 }, // Ensure storeId is a number
          ...prevTasks,
        ]);
      }

      setNewTask({
        id: 0,
        taskTitle: '',
        taskDesciption: '',
        dueDate: '',
        assignedToId: 0,
        assignedToName: '',
        assignedById: 97,
        assignedByName: '',
        storeId: visitDetail?.storeId ?? 0, // Ensure storeId is a number
        storeName: '',
        storeCity: '',
        visitId: Number(id),
        visitDate: '',
        status: 'Assigned',
        priority: 'low',
        taskType: 'requirement',
        attachment: [],
        attachmentResponse: [],
        createdAt: '',
        updatedAt: '',
        createdTime: '',
        updatedTime: '',
      });
      setIsRequirementModalOpen(false);
      fetchTasks(id as string, taskType, taskType === 'requirement' ? setRequirements : setComplaints);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getVisitId = (): string => {
    if (typeof id === 'string') {
      return id;
    }
    if (Array.isArray(id)) {
      return id[0];
    }
    return '';
  };

  const getPriorityBadge = (priority: Priority) => {
    const priorityColors: { [key in Priority]: string } = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    const colorClass = priorityColors[priority] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`status-badge ${colorClass}`}>
        {priority}
      </span>
    );
  };

  const handleCompleteVisit = async () => {
    try {
      const response = await axios.put(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/checkout?id=${visitDetail?.id}`,
        {
          checkoutLatitude: 25,
          checkoutLongitude: -25,
          outcome: 'done'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      message.success('Checked out Successfully!');
      fetchVisitDetail(id as string); // Refresh the visit details
    } catch (error: any) {
      if (error.response) {
        if (error.response.data.includes('Cant check out without Checking in')) {
          message.error('Error Checking out: Cant check out without Checking in!');
        } else if (error.response.data.includes('Already Checked Out')) {
          message.error('Error Checking out: Already Checked Out!');
        } else {
          message.error('Error Checking out!');
        }
      } else {
        message.error('Error Checking out!');
      }
    }
  };
  const handleDeleteTask = async (taskId: number) => {
    try {
      await axios.delete(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/task/deleteById?taskId=${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setRequirements((prevRequirements) => prevRequirements.filter((req) => req.id !== taskId));
      setComplaints((prevComplaints) => prevComplaints.filter((complaint) => complaint.id !== taskId));
      message.success('Task deleted!');
    } catch (error) {
      console.error('Error deleting task:', error);
      message.error('Error Deleting Task: Task Not Found!');
    }
  };

  useEffect(() => {
    if (isRequirementModalOpen) {
      fetchEmployees();
      fetchStores();
    }
  }, [isRequirementModalOpen]);

  const handleStatusChange = async (taskId: number, newStatus: string, currentPriority: string) => {
    try {
      await axios.put(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/task/updateTask?taskId=${taskId}`,
        {
          status: newStatus,
          priority: currentPriority,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the local state with the new status
      setRequirements((prevRequirements) =>
        prevRequirements.map((req) =>
          req.id === taskId ? { ...req, status: newStatus } : req
        )
      );
      setComplaints((prevComplaints) =>
        prevComplaints.map((complaint) =>
          complaint.id === taskId ? { ...complaint, status: newStatus } : complaint
        )
      );
      message.success('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Error updating status.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      Assigned: 'bg-blue-100 text-blue-800',
      'Work in Progress': 'bg-orange-100 text-orange-800',
      Complete: 'bg-green-100 text-green-800',
    } as const;

    type StatusColor = keyof typeof statusColors;

    const colorClass = (status in statusColors)
      ? statusColors[status as StatusColor]
      : 'bg-gray-100 text-gray-800';

    return (
      <span className={`status-badge ${colorClass}`}>
        {status}
      </span>
    );
  };

  const visitStatus = getOutcomeStatus(visitDetail);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleImageClick = (image: string) => {
    setPreviewImage(image);
    setPreviewVisible(true);
  };

  return (
    <div className="main-content">
      <Head>
        <title>Visit Detail Page</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
      </Head>
      <div className="visit-details">
        <aside className="left-panel">
          <div className="back-button" onClick={() => router.push('/VisitsList')}>
            <i className="fas fa-arrow-left"></i> Back to visits
          </div>
          <div className="profile">
            <div className="avatar">
              <span>{getInitials(visitDetail?.employeeName || '')}</span>
            </div>
            <h2>{visitDetail?.employeeName}</h2>
            <p className="store-name">{visitDetail?.storeName}</p>
          </div>
          <div className="action-buttons">
            <button className="action-button" onClick={handleViewStore}>
              <i className="fas fa-store"></i> View Store
            </button>
            <button className="action-button" onClick={() => setIsRequirementModalOpen(true)}>
              <i className="fas fa-plus"></i> Add Requirement
            </button>
            <button className="action-button" onClick={() => {
              setNewTask({ ...newTask, taskType: 'complaint' });
              setIsRequirementModalOpen(true);
            }}>
              <i className="fas fa-plus"></i> Add Complaint
            </button>
          </div>
          <button
            className={`complete-visit-btn ${!visitStatus.isOngoing ? 'disabled' : ''}`}
            onClick={handleCompleteVisit}
            disabled={!visitStatus.isOngoing}
          >
            Complete Visit
          </button>

          <div className="last-activity">
            <i className="fas fa-clock"></i> Visit Duration:{' '}
            {metrics.find((metric) => metric.title === 'Visit Duration')?.value}
          </div>
          <div className="info-tabs">
            <div
              className={`info-tab ${activeInfoTab === 'visit-info' ? 'active' : ''}`}
              onClick={() => setActiveInfoTab('visit-info')}
            >
              Visit Info
            </div>
            <div
              className={`info-tab ${activeInfoTab === 'store-info' ? 'active' : ''}`}
              onClick={() => setActiveInfoTab('store-info')}
            >
              Store Info
            </div>
          </div>
          <div
            className={`info-content ${activeInfoTab === 'visit-info' ? 'active' : ''}`}
            id="visit-info"
          >
            <div className="info-item">
              <div className="info-label">
                <i className="fas fa-tasks"></i> Purpose
              </div>
              <div>{visitDetail?.purpose}</div>
            </div>
            <div className="info-item">
              <div className="info-label">
                <i className="fas fa-map-marker-alt"></i> Location
              </div>
              <div>
                {visitDetail?.checkinLatitude && visitDetail?.checkinLongitude ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${visitDetail.checkinLatitude},${visitDetail.checkinLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-link"
                  >
                    Location
                  </a>
                ) : (
                  <span>Location not available</span>
                )}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">
                <i className="fas fa-sign-in-alt"></i> Check-in
              </div>
              <div>
                {visitDetail?.checkinTime && !isNaN(new Date(visitDetail.checkinTime).getTime())
                  ? `${format(parseISO(visitDetail.checkinTime), "dd MMM ''yy")} ${format(parseISO(visitDetail.checkinTime), 'h:mm a')}`
                  : 'Check-in not available'}


              </div>
            </div>
            <div className="info-item">
              <div className="info-label">
                <i className="fas fa-sign-out-alt"></i> Check-out
              </div>
              <div>
                {visitDetail?.checkoutTime && !isNaN(new Date(visitDetail.checkoutTime).getTime())
                  ? `${format(parseISO(visitDetail.checkoutTime), "dd MMM ''yy")} ${format(parseISO(visitDetail.checkoutTime), 'h:mm a')}`
                  : 'Check-out not available'}


              </div>
            </div>
          </div>
          <div
            className={`info-content ${activeInfoTab === 'store-info' ? 'active' : ''}`}
            id="store-info"
          >
            <div className="info-item">
              <div className="info-label">
                <i className="fas fa-store"></i> Store Name
              </div>
              <div>{visitDetail?.storeName}</div>
            </div>
          </div>
        </aside>

        <section className="activity-details">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'visits' ? 'active' : ''}`}
              onClick={() => setActiveTab('visits')}
            >
              <i className="fas fa-calendar-check"></i> Visits
            </button>
            <button
              className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('metrics')}
            >
              <i className="fas fa-chart-line"></i> Metrics
            </button>
            <button
              className={`tab ${activeTab === 'brands' ? 'active' : ''}`}
              onClick={() => setActiveTab('brands')}
            >
              <i className="fas fa-tags"></i> Brands
            </button>
            <button
              className={`tab ${activeTab === 'requirements' ? 'active' : ''}`}
              onClick={() => setActiveTab('requirements')}
            >
              <i className="fas fa-clipboard-list"></i> Requirements
            </button>
            <button
              className={`tab ${activeTab === 'complaints' ? 'active' : ''}`}
              onClick={() => setActiveTab('complaints')}
            >
              <i className="fas fa-exclamation-circle"></i> Complaints
            </button>
          </div>

          <div className={`tab-content ${activeTab === 'visits' ? 'active' : ''}`} id="visits">
            <div className="filter-bar">
              <Input
                placeholder="Search by Visit Purpose"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 200 }}
              />
            </div>
            <div className="visits-list">
              {currentVisits.map((visit) => (
                <div key={visit.id} className="visit-item">
                  <div className="item-header">
                    <span className="item-title">{visit.purpose}</span>
                    <span className="item-status">
                      {format(parseISO(visit.visit_date), "dd MMM ''yy h:mm a")}
                    </span>
                  </div>
                  <div className="item-content">
                    <p>Employee: {visit.employeeName}</p>
                    <p>Store: {visit.storeName}</p>
                    <Link
                      href={`/VisitDetailPage/[id]`}
                      as={`/VisitDetailPage/${visit.id}`}
                      passHref
                    >
                      <div className="timeline-visit-id">Visit ID: {visit.id}</div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {visits.length > visitsPerPage && (
              <div className="mt-4">
                <Button onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show Less' : 'Show More'}
                </Button>
                {showAll && (
                  <Pagination>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    >
                      Previous
                    </PaginationPrevious>
                    <PaginationContent>
                      {renderPaginationItems()}
                    </PaginationContent>
                    <PaginationNext
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    >
                      Next
                    </PaginationNext>
                  </Pagination>
                )}
              </div>
            )}
          </div>

          <div className={`tab-content ${activeTab === 'metrics' ? 'active' : ''}`} id="metrics">
            <div className="metrics-grid">
              {metrics.map((metric, index) => (
                <div key={index} className="metric-card">
                  <h3>{metric.title}</h3>
                  <div className="value">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={`tab-content ${activeTab === 'brands' ? 'active' : ''}`} id="brands">
            <BrandTab
              brands={brands}
              setBrands={setBrands}
              visitId={getVisitId()}
              token={token}
              fetchVisitDetail={fetchVisitDetail}
            />
          </div>


          <div className={`tab-content ${activeTab === 'requirements' ? 'active' : ''}`} id="requirements">
            <div className="filter-bar">
              <Select value={priorityFilter} onValueChange={handlePriorityChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="requirements-list">
              {filteredRequirements.map((req, index) => (
                <div key={index} className="requirement-item">
                  <div className="item-header">
                    <span className="item-title primary-blue">{req.taskTitle}</span>
                    <div className="item-status-wrapper" style={{ display: 'flex', gap: '8px' }}>
                      {getPriorityBadge(req.priority)}
                      {getStatusBadge(req.status)}
                    </div>
                  </div>
                  <div className="item-footer">
                    <span>Due: {req.dueDate}</span>
                    <div className="assigned-to">
                      <div className="avatar">{getInitials(req.assignedToName)}</div>
                      <span>Assigned to {req.assignedToName}</span>
                    </div>
                    <Dropdown
                      overlay={
                        <Menu onClick={(e) => handleStatusChange(req.id, e.key, req.priority)}>
                          <Menu.Item key="Assigned">Assigned</Menu.Item>
                          <Menu.Item key="Work in Progress">Work in Progress</Menu.Item>
                          <Menu.Item key="Complete">Complete</Menu.Item>
                        </Menu>
                      }
                    >
                      <Button>{req.status}</Button>
                    </Dropdown>
                    <Button
                      type="link"
                      className="red-delete-icon"
                      icon={<i className="fas fa-trash-alt" />}
                      onClick={() => handleDeleteTask(req.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`tab-content ${activeTab === 'complaints' ? 'active' : ''}`} id="complaints">
            <div className="filter-bar">
              <Select value={priorityFilter} onValueChange={handlePriorityChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="complaints-list">
              {filteredComplaints.map((complaint, index) => (
                <div key={index} className="complaint-item">
                  <div className="item-header">
                    <span className="item-title primary-blue">{complaint.taskTitle}</span>
                    <div className="item-status-wrapper" style={{ display: 'flex', gap: '8px' }}>
                      {getPriorityBadge(complaint.priority)}
                      {getStatusBadge(complaint.status)}
                    </div>
                  </div>
                  <div className="item-footer">
                    <span>Reported: {complaint.dueDate}</span>
                    <div className="assigned-to">
                      <div className="avatar">{getInitials(complaint.assignedToName)}</div>
                      <span>Handled by {complaint.assignedToName}</span>
                    </div>
                    <Dropdown
                      overlay={
                        <Menu onClick={(e) => handleStatusChange(complaint.id, e.key, complaint.priority)}>
                          <Menu.Item key="Assigned">Assigned</Menu.Item>
                          <Menu.Item key="Work in Progress">Work in Progress</Menu.Item>
                          <Menu.Item key="Complete">Complete</Menu.Item>
                        </Menu>
                      }
                    >
                      <Button>{complaint.status}</Button>
                    </Dropdown>
                    <Button
                      type="link"
                      className="red-delete-icon"
                      icon={<i className="fas fa-trash-alt" />}
                      onClick={() => handleDeleteTask(complaint.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="right-panel">
          <div className="section-title">Check-in Images</div>
          <div className="image-gallery">
            {checkinImages.length > 0 ? (
              checkinImages.map((image, index) => (
                <Image
                  key={index}
                  src={image}
                  alt={`Check-in image ${index + 1}`}
                  className="rounded-lg shadow-md"
                  width={300}
                  height={200}
                  onClick={() => handleImageClick(image)}
                />
              ))
            ) : (
              <p>No images available</p>
            )}
          </div>
          <div className="section-title">Notes</div>
          <div className="notes-section">
            <Button className="add-note-btn" onClick={addNote}>
              <i className="fas fa-plus"></i> Add Note
            </Button>
            <div className="notes-list">
              {notes.map((note) => (
                <div key={note.id} className="note-item">
                  <div className="note-header">
                    <span className="note-date">{note.createdDate}</span>
                    <div className="note-actions">
                      <a href="#" onClick={() => editNote(note)}>
                        Edit
                      </a>
                      <a href="#" className="note-delete" onClick={() => deleteNote(note.id)}>Delete</a>
                    </div>
                  </div>
                  <div className="note-content">{note.content}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Modal
        title={isEditMode ? 'Edit Note' : 'Add Note'}
        visible={isModalVisible}
        onOk={saveNote}
        onCancel={() => setIsModalVisible(false)}
        okText={isEditMode ? 'Update' : 'Add'}
      >
        <Input.TextArea
          placeholder="Enter note content"
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          rows={4}
        />
      </Modal>

      <Dialog open={isRequirementModalOpen} onOpenChange={setIsRequirementModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create {newTask.taskType === 'requirement' ? 'Requirement' : 'Complaint'}</DialogTitle>
            <DialogDescription>Fill in the details.</DialogDescription>
          </DialogHeader>
          <Tabs value={activeRequirementTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="general" onClick={() => setActiveRequirementTab('general')}>General</TabsTrigger>
              <TabsTrigger value="details" onClick={() => setActiveRequirementTab('details')}>Details</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="taskTitle">{newTask.taskType === 'requirement' ? 'Requirement' : 'Complaint'} Title</Label>
                  <Input
                    id="taskTitle"
                    placeholder={`Enter ${newTask.taskType} title`}
                    value={newTask.taskTitle}
                    onChange={(e) => setNewTask({ ...newTask, taskTitle: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taskDesciption">{newTask.taskType === 'requirement' ? 'Requirement' : 'Complaint'} Description</Label>
                  <Input
                    id="taskDesciption"
                    placeholder={`Enter ${newTask.taskType} description`}
                    value={newTask.taskDesciption}
                    onChange={(e) => setNewTask({ ...newTask, taskDesciption: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newTask.taskType} onValueChange={(value) => setNewTask({ ...newTask, taskType: value })}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requirement">Requirement</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between mt-4">
                  <Button onClick={() => setIsRequirementModalOpen(false)} className="bg-gray-200 text-gray-800">Cancel</Button>
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
                  <Input
                    id="assignedToId"
                    value={visitDetail ? `${visitDetail.employeeName}` : ''}
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value as Priority })}>
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
                  <Input
                    id="storeId"
                    value={visitDetail ? `${visitDetail.storeName}` : ''}
                    disabled
                  />
                </div>
                <div className="flex justify-between mt-4">
                  <Button onClick={handleBack} className="bg-gray-200 text-gray-800">Back</Button>
                  <Button onClick={() => createTask(newTask.taskType)}>Create {newTask.taskType === 'requirement' ? 'Requirement' : 'Complaint'}</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Modal
        title={null}
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        centered
        bodyStyle={{ padding: 0, textAlign: 'center' }}
      >
        <img src={previewImage || ''} alt="Preview Image" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
      </Modal>
    </div>
  );
};

export default VisitDetailPage;

