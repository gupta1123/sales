'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { format, formatDuration, intervalToDuration } from "date-fns";
import "./SalesExecutivePage.css";
import { FaStore, FaCalendarAlt, FaCheck, FaClock, FaTimes } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import DateRange from '../DateRange';
import { useRouter } from 'next/router';
import {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';

interface Visit {
  id: number;
  storeId: number;
  storeName: string;
  storeLatitude: number;
  storeLongitude: number;
  employeeId: number;
  employeeName: string;
  visit_date: string;
  intent: number | null;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  visitLatitude: number | null;
  visitLongitude: number | null;
  checkinLatitude: number | null;
  checkinLongitude: number | null;
  checkoutLatitude: number | null;
  checkoutLongitude: number | null;
  checkinDate: string | null;
  checkoutDate: string | null;
  checkinTime: string | null;
  checkoutTime: string | null;
  purpose: string;
  outcome: string | null;
  feedback: string | null;
  createdAt: string | null;
  createdTime: string | null;
  updatedAt: string | null;
  updatedTime: string | null;
}

interface StatsDto {
  visitCount: number;
  fullDays: number;
  halfDays: number;
  absences: number;
}

const SalesExecutivePage: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);

  const [employeeData, setEmployeeData] = useState<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const visitsPerPage = 15;

  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getById?id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: {
          id: number;
          firstName: string;
          lastName: string;
          email: string;
          role: string;
        } = await response.json();
        setEmployeeData(data);
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    };

    if (token && id) {
      fetchEmployeeData();
    }
  }, [token, id]);

  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0], // today's date as start date
    endDate: new Date().toISOString().split('T')[0]   // today's date as end date
  });

  useEffect(() => {
    const fetchVisitsAndStats = async () => {
      if (token && id) {
        try {
          const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/getByDateRangeAndEmployeeStats?id=${id}&start=${dateRange.startDate}&end=${dateRange.endDate}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          setVisits(data.visitDto);
          setStats(data.statsDto);
        } catch (error) {
          console.error("Error fetching visits and stats:", error);
        }
      }
    };

    fetchVisitsAndStats();
  }, [token, id, dateRange]);

  // Get current visits
  const indexOfLastVisit = currentPage * visitsPerPage;
  const indexOfFirstVisit = indexOfLastVisit - visitsPerPage;
  const currentVisits = visits.slice(indexOfFirstVisit, indexOfLastVisit);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow">
        <div className="container mx-auto py-6 px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Visits</h1>
          <div className="flex items-center">
            <Avatar className="mr-2">
              <AvatarImage src="/path/to/field-officer-avatar.png" alt="Field Officer Avatar" />
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{employeeData?.firstName} {employeeData?.lastName}</h3>
              <p className="text-gray-500 text-sm">{employeeData?.email}</p>
              <p className="text-gray-500 text-sm">{employeeData?.role}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-8 px-4">
        <Card className="bg-white shadow-md rounded-lg mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Visit Metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg shadow-md p-6 text-blue-800 text-center">
                <div className="text-4xl font-bold mb-2">{stats?.visitCount}</div>
                <div className="text-lg font-semibold flex items-center justify-center">
                  <FaCheck className="mr-2" />
                  <span>Total Visits</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg shadow-md p-6 text-green-800 text-center">
                <div className="text-4xl font-bold mb-2">{stats?.fullDays}</div>
                <div className="text-lg font-semibold flex items-center justify-center">
                  <FaClock className="mr-2" />
                  <span>Full Days</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg shadow-md p-6 text-yellow-800 text-center">
                <div className="text-4xl font-bold mb-2">{stats?.halfDays}</div>
                <div className="text-lg font-semibold flex items-center justify-center">
                  <FaClock className="mr-2" />
                  <span>Half Days</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-100 to-red-200 rounded-lg shadow-md p-6 text-red-800 text-center">
                <div className="text-4xl font-bold mb-2">{stats?.absences}</div>
                <div className="text-lg font-semibold flex items-center justify-center">
                  <FaTimes className="mr-2" />
                  <span>Absences</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md rounded-lg">
          <CardContent className="p-6">
            <div className="mb-6">
              <DateRange setVisits={setVisits} setStats={setStats} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentVisits.map((visit) => {
                let status = 'Assigned';
                let statusColor = 'bg-blue-100 text-blue-800';
                let statusEmoji = ' ';

                if (visit.checkinDate && visit.checkinTime && visit.checkoutDate && visit.checkoutTime) {
                  status = 'Completed';
                  statusColor = 'bg-purple-100 text-purple-800';
                  statusEmoji = ' ';
                } else if (visit.checkoutDate && visit.checkoutTime) {
                  status = 'Checked Out';
                  statusColor = 'bg-orange-100 text-orange-800';
                  statusEmoji = ' ';
                } else if (visit.checkinDate && visit.checkinTime) {
                  status = 'On Going';
                  statusColor = 'bg-green-100 text-green-800';
                  statusEmoji = ' ';
                }

                return (
                  <Card key={visit.id} className="bg-white shadow-md rounded-lg p-4 cursor-pointer transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg" onClick={() => router.push(`/VisitDetailPage/${visit.id}`)}>
                    <CardContent>
                      <div className="mb-4">
                        <div className="bg-white rounded-lg p-3 shadow-md">
                          <div className="text-lg font-semibold">{visit.storeName}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-500">
                          <FaCalendarAlt className="inline-block mr-1" />
                          <span>{format(new Date(visit.visit_date), 'MMM d, yyyy')}</span>
                        </div>
                        <Badge className={`${statusColor} px-2 py-1 rounded-full font-semibold text-xs`}>
                          {statusEmoji} {status}
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <div className="flex items-center text-gray-500 text-xs">
                          <FaStore className="mr-1" />
                          <span>{visit.storeName}</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        {visit.scheduledStartTime && visit.scheduledEndTime && (
                          <div className="text-gray-500 text-xs">
                            <span className="font-semibold">Duration:</span> {formatDuration(intervalToDuration({ start: new Date(visit.scheduledStartTime), end: new Date(visit.scheduledEndTime) }))}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">
                          <span className="font-semibold">Purpose:</span> {visit.purpose}
                        </div>
                        {visit.intent !== null && (
                          <div className="text-gray-500 text-xs">
                            <span className="font-semibold">Intent Level:</span> {visit.intent}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationPrevious
                    onClick={() => {
                      if (currentPage > 1) {
                        paginate(currentPage - 1);
                      }
                    }}
                    className={currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}
                  />
                  {Array.from({ length: Math.ceil(visits.length / visitsPerPage) }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink isActive={currentPage === i + 1} onClick={() => paginate(i + 1)}>
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationNext
                    onClick={() => {
                      if (currentPage < Math.ceil(visits.length / visitsPerPage)) {
                        paginate(currentPage + 1);
                      }
                    }}
                    className={
                      currentPage === Math.ceil(visits.length / visitsPerPage)
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                    }
                  />
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SalesExecutivePage;