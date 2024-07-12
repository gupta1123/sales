'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, Collapse } from 'antd';
import { Upload, message } from "antd";
import { InboxOutlined, CaretDownOutlined, PushpinOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined, WarningOutlined } from "@ant-design/icons";
import VisitsTimeline from "../VisitsTimeline";
import NotesSection from "../../components/NotesSection";
import LikesSection from "../../components/BrandsSection";
import BrandsSection from "../../components/LikesSection";
import PerformanceMetrics from "../../components/PerformanceMetrics";
import "./VisitDetail.css";
import Image from 'next/image';
import { ChevronUpIcon, ChevronDownIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const { Dragger } = Upload;
const { Option } = Select;
const { Panel } = Collapse;

interface Attachment {
  id: number;
  fileName: string;
  url: string;
  tag: string;
}

interface VisitData {
  id?: number;
  storeId?: number;
  storeName?: string;
  storeLatitude?: number;
  storeLongitude?: number;
  employeeId?: number;
  employeeName?: string;
  visit_date?: string;
  attachmentResponse?: Attachment[];
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  visitLatitude?: number | null;
  visitLongitude?: number | null;
  checkinLatitude?: number | null;
  checkinLongitude?: number | null;
  checkoutLatitude?: number | null;
  checkoutLongitude?: number | null;
  checkinDate?: string | null;
  checkoutDate?: string | null;
  checkinTime?: string | null;
  checkoutTime?: string | null;
  purpose?: string;
  outcome?: string | null;
  feedback?: string | null;
  createdAt?: string | null;
  createdTime?: string | null;
  updatedAt?: string | null;
  updatedTime?: string | null;
  intent?: string | null;
}

interface Task {
  id: number;
  taskTitle: string | null;
  taskDesciption: string;
  taskType: string;
  dueDate: string;
  assignedToId: number;
  assignedToName: string | null;
  assignedById: number;
  assignedByName: string;
  storeId: number;
  storeName: string;
  storeCity: string;
  visitId: number;
  visitDate: string;
  status: string;
  priority: string;
  attachment: any[];
  attachmentResponse: any[];
  createdAt: string;
  updatedAt: string;
  createdTime: string;
  updatedTime: string;
}

const VisitDetailPage = () => {
  const [visit, setVisit] = useState<VisitData | null>(null);
  const [checkinImages, setCheckinImages] = useState<string[]>([]);
  const [checkoutImages, setCheckoutImages] = useState<string[]>([]);
  const [intentLevel, setIntentLevel] = useState<string>('');
  const [monthlySales, setMonthlySales] = useState<string>('');
  const token = useSelector((state: RootState) => state.auth.token);
  const [checkInStatus, setCheckInStatus] = useState<'Assigned' | 'On Going' | 'Checked Out' | 'Completed'>('Assigned');
  const [requirements, setRequirements] = useState<Task[]>([]);
  const [complaints, setComplaints] = useState<Task[]>([]);

  const router = useRouter();
  const { id, returnState, returnEmployee } = router.query;

  const handleBack = () => {
    if (returnState && returnEmployee) {
      router.push({
        pathname: '/Dashboard',
        query: { state: returnState, employee: returnEmployee }
      });
    } else if (returnState) {
      router.push({
        pathname: '/Dashboard',
        query: { state: returnState }
      });
    } else {
      router.push('/Dashboard');
    }
  };

  const showBackButton = Boolean(returnState || returnEmployee);


  const getStatusIndicator = (status: 'Assigned' | 'On Going' | 'Checked Out' | 'Completed') => {
    switch (status) {
      case 'Assigned':
        return { icon: ' ', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
      case 'On Going':
        return { icon: ' ', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'Checked Out':
        return { icon: ' ', bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
      case 'Completed':
        return { icon: ' ', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      default:
        return { icon: '', bgColor: 'bg-transparent', textColor: 'text-gray-500' };
    }
  };

  useEffect(() => {
    const fetchVisitDetails = async () => {
      try {
        const response = await axios.get(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/getById?id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data) {
          setVisit(response.data);

          const attachmentResponse = response.data.attachmentResponse || [];
          const checkinImageUrls = await Promise.all(
            attachmentResponse
              .filter((attachment: any) => attachment.tag === 'check-in')
              .map(async (attachment: any) => {
                const response = await axios.get(
                  `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/downloadFile/${id}/check-in/${attachment.fileName}`,
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
          const checkoutImageUrls = await Promise.all(
            attachmentResponse
              .filter((attachment: any) => attachment.tag === 'check-out')
              .map(async (attachment: any) => {
                const response = await axios.get(
                  `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/downloadFile/${id}/check-out/${attachment.fileName}`,
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
          setCheckoutImages(checkoutImageUrls);

          if (response.data.checkoutTime) {
            setCheckInStatus('Completed');
          } else if (response.data.checkinTime) {
            setCheckInStatus('On Going');
          } else {
            setCheckInStatus('Assigned');
          }
        }
      } catch (error) {
        console.error('Error fetching visit details:', error);
      }
    };

    const fetchIntentLevel = async () => {
      try {
        const response = await axios.get(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/intent-audit/getByVisit?id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data && response.data.length > 0) {
          setIntentLevel(response.data[response.data.length - 1].newIntentLevel.toString());
        }
      } catch (error) {
        console.error('Error fetching intent level:', error);
      }
    };

    const fetchMonthlySales = async () => {
      try {
        const response = await axios.get(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/monthly-sale/getByVisit?visitId=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data && response.data.length > 0) {
          setMonthlySales(response.data[response.data.length - 1].newMonthlySale.toString());
        }
      } catch (error) {
        console.error('Error fetching monthly sales:', error);
      }
    };

    if (id && token) {
      fetchVisitDetails();
      fetchIntentLevel();
      fetchMonthlySales();
    }
  }, [id, token]);

  useEffect(() => {
    const fetchTasks = async (type: 'requirement' | 'complaint', setTasks: React.Dispatch<React.SetStateAction<Task[]>>) => {
      try {
        const response = await axios.get(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/task/getByVisit?type=${type}&visitId=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data) {
          setTasks(response.data);
        }
      } catch (error) {
        console.error(`Error fetching ${type}s:`, error);
      }
    };

    if (id && token) {
      fetchTasks('requirement', setRequirements);
      fetchTasks('complaint', setComplaints);
    }
  }, [id, token]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day}th ${month}`;
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const calculateVisitDuration = () => {
    if (visit?.checkinTime && visit?.checkoutTime) {
      const checkinTime = new Date(`2000-01-01T${visit.checkinTime}`);
      const checkoutTime = new Date(`2000-01-01T${visit.checkoutTime}`);
      const durationInSeconds = Math.round((checkoutTime.getTime() - checkinTime.getTime()) / 1000);

      if (durationInSeconds > 0) {
        const durationInMinutes = Math.floor(durationInSeconds / 60);

        if (durationInMinutes >= 60) {
          const hours = Math.floor(durationInMinutes / 60);
          const minutes = durationInMinutes % 60;
          return `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
        } else {
          return `${durationInMinutes} minute${durationInMinutes > 1 ? 's' : ''}`;
        }
      }
    }
    return '';
  };

  const getStatusIcon = (status: 'Assigned' | 'On Going' | 'Checked Out' | 'Completed') => {
    switch (status) {
      case 'Assigned':
        return <ClockCircleOutlined className="w-4 h-4 mr-2" />;
      case 'On Going':
        return <SyncOutlined className="w-4 h-4 mr-2" />;
      case 'Checked Out':
        return <CheckCircleOutlined className="w-4 h-4 mr-2" />;
      case 'Completed':
        return <CheckCircleOutlined className="w-4 h-4 mr-2" />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.onpopstate = () => {
        const previousPage = sessionStorage.getItem('previousPage');
        if (previousPage === 'EmployeeCard1') {
          router.replace('/Dashboard');
        }
      };
    }
  }, [router]);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await axios.put(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/task/updateTask?taskId=${taskId}`,
        {
          status: newStatus,
          priority: "Medium",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setRequirements((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
      );
      setComplaints((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
      );
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const renderTasks = (tasks: Task[], type: string) => {
    const getBadgeClass = (status: string) => {
      switch (status) {
        case 'Assigned':
          return 'status-badge status-assigned';
        case 'Work In Progress':
          return 'status-badge status-in-progress';
        case 'Completed':
          return 'status-badge status-completed';
        default:
          return 'status-badge';
      }
    };

    return (
      <div className="task-grid">
        {tasks.map((task) => (
          <Card key={task.id} className="task-card">
            <CardContent>
              <div className="task-header">
                <h3 className="task-title">
                  {type === 'requirement' ? <PushpinOutlined /> : <InboxOutlined />}
                  {task.taskTitle || 'Untitled Task'}
                </h3>
                <span className="task-date">{formatDate(task.dueDate)}</span>
              </div>
              <p className="task-description">{task.taskDesciption}</p>
              <div className="task-footer">
                <div className="task-assignee">
                  <Image
                    className="avatar"
                    src="https://github.com/shadcn.png"
                    alt={task.assignedToName || 'N/A'}
                    width={40}
                    height={40}
                  />
                  {task.assignedToName && <span className="task-assignee-name">{task.assignedToName}</span>}
                </div>
                <div className={`status-indicator ${getBadgeClass(task.status)}`}>
                  <Select
                    defaultValue={task.status}
                    style={{ width: '100%' }}
                    onChange={(value) => handleStatusChange(task.id, value)}
                  >
                    <Option value="Assigned">Assigned</Option>
                    <Option value="Work In Progress">In Progress</Option>
                    <Option value="Completed">Completed</Option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Visit Detail</h1>
        {showBackButton && (
          <Button variant="ghost" size="lg" onClick={handleBack}>
            <ArrowLeftIcon className="h-6 w-6" />
            Back to Dashboard
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex justify-end mb-6">
            {visit && visit.storeId && (
              <Link href={`/CustomerDetailPage/${visit.storeId}`}>
                <Button variant="outline">View Store</Button>
              </Link>
            )}
          </div>

          <Card className="mb-8 border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">Visit Summary</h2>
                  <p className="text-sm text-gray-500">Overview of the visit details</p>
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusIndicator(checkInStatus).bgColor} ${getStatusIndicator(checkInStatus).textColor}`}>
                    {getStatusIcon(checkInStatus)}
                    <span className="ml-2">{checkInStatus}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">Purpose</p>
                    <p className="text-lg font-semibold">{visit?.purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Assigned To</p>
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <p className="text-lg font-semibold">{visit?.employeeName}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">Store</p>
                    <div className="flex justify-between items-center bg-gray-100 rounded-lg p-4">
                      <p className="text-lg font-semibold">{visit?.storeName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <div className="flex items-center space-x-2">
                      <PushpinOutlined className="w-4 h-4 text-gray-500" />
                      {visit?.storeLatitude && visit?.storeLongitude ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${visit?.storeLatitude},${visit?.storeLongitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-semibold text-blue-500 hover:underline"
                        >
                          {visit?.storeLatitude}, {visit?.storeLongitude}
                        </a>
                      ) : (
                        <p className="text-lg font-semibold text-gray-500">Location not available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {visit?.checkinDate && visit?.checkinTime && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Check-in</p>
                      <p className="text-lg font-semibold">{formatDate(visit.checkinDate)} {formatTime(visit.checkinTime)}</p>
                    </div>
                  )}
                  {visit?.checkoutDate && visit?.checkoutTime && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Check-out</p>
                      <p className="text-lg font-semibold">{formatDate(visit.checkoutDate)} {formatTime(visit.checkoutTime)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceMetrics
                visitDuration={calculateVisitDuration()}
                intentLevel={intentLevel}
                monthlySales={monthlySales}
              />
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Check-in Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checkinImages.map((image, index) => (
                  <Image key={index} src={image} alt={`Check-in ${index + 1}`} className="rounded-lg shadow-md" width={300} height={200} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent>
              <Tabs defaultValue="brands">
                <TabsList>
                  <TabsTrigger value="brands">Brands</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                  <TabsTrigger value="complaints">Complaints</TabsTrigger>
                </TabsList>
                <TabsContent value="brands">
                  <LikesSection storeId={visit?.storeId?.toString() ?? '0'} />
                </TabsContent>
                <TabsContent value="requirements">
                  {renderTasks(requirements, 'requirement')}
                </TabsContent>
                <TabsContent value="complaints">
                  {renderTasks(complaints, 'complaint')}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Previous Visits</CardTitle>
            </CardHeader>
            <CardContent>
              {visit && visit.storeId && <VisitsTimeline storeId={visit.storeId.toString()} />}
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <NotesSection storeId={visit?.storeId?.toString() ?? '0'} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VisitDetailPage;