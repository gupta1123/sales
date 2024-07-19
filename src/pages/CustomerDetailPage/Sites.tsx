import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Modal, Input, Select, message, Form, DatePicker } from 'antd';
import { MapPin, Users, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import './Sites.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface SitesProps {
    storeId: string;
    token: string;
}

interface Site {
    id: number;
    siteName: string;
    city: string;
    // requirement: number;
    status: string;
    startDate: string;
    endDate: string;
}

const Sites: React.FC<SitesProps> = ({ storeId, token }) => {
    const [sites, setSites] = useState<Site[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentSite, setCurrentSite] = useState<Site | null>(null);
    const [form] = Form.useForm();
    const [currentPage, setCurrentPage] = useState(1);
    const [showAll, setShowAll] = useState(false);
    const pageSize = 4;

    useEffect(() => {
        if (storeId) {
            fetchSites();
        }
    }, [storeId]);
    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < Math.ceil(sites.length / pageSize)) {
            setCurrentPage(prev => prev + 1);
        }
    };
    const fetchSites = async () => {
        try {
            const response = await axios.get<Site[]>(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/site/getByStore?id=${storeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSites(response.data);
        } catch (error) {
            console.error('Error fetching sites:', error);
        }
    };

    const handleAddSite = () => {
        setIsEditMode(false);
        setCurrentSite(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEditSite = (site: Site) => {
        setIsEditMode(true);
        setCurrentSite(site);
        form.setFieldsValue({
            ...site,
            dateRange: [dayjs(site.startDate), dayjs(site.endDate)]
        });
        setIsModalVisible(true);
    };

    const handleDeleteSite = async (siteId: number) => {
        try {
            await axios.delete(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/site/delete?id=${siteId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSites(sites.filter(site => site.id !== siteId));
            message.success('Site deleted successfully!');
        } catch (error) {
            console.error('Error deleting site:', error);
            message.error('Error deleting site.');
        }
    };

    const handleFormSubmit = async (values: any) => {
        const payload = {
            ...values,
            // requirement: Number(values.requirement),
            startDate: values.dateRange[0].format('YYYY-MM-DD'),
            endDate: values.dateRange[1].format('YYYY-MM-DD'),
            storeId: parseInt(storeId, 10),
        };
        try {
            if (isEditMode && currentSite) {
                await axios.put(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/site/edit?id=${currentSite.id}`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setSites(sites.map(site => (site.id === currentSite.id ? { ...site, ...payload } : site)));
                message.success('Site updated successfully!');
            } else {
                const response = await axios.post<number>('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/site/add', payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setSites([...sites, { ...payload, id: response.data } as Site]);
                message.success('Site added successfully!');
            }
            setIsModalVisible(false);
            form.resetFields();
        } catch (error) {
            console.error('Error submitting site:', error);
            message.error('Error submitting site.');
        }
    };

    const toggleShowAll = () => {
        setShowAll(!showAll);
        setCurrentPage(1);
    };

    const displayedSites = showAll ? sites.slice((currentPage - 1) * pageSize, currentPage * pageSize) : sites.slice(0, pageSize);

    return (
        <div className="sites-container">
            <Button onClick={handleAddSite} className="add-site-btn">+ Add Site</Button>
            <div className="sites-list">
                {displayedSites.map(site => (
                    <div key={site.id} className="site-card">
                        <div className="site-card-content">
                            <p className="site-name">{site.siteName}</p>
                            <p className="site-info"><MapPin size={14} /> {site.city}</p>
                            {/* <p className="site-info"><Users size={14} /> Requirement: {site.requirement}</p> */}
                            <p className="site-info"><Calendar size={14} /> {dayjs(site.startDate).format('DD/MM/YYYY')} - {dayjs(site.endDate).format('DD/MM/YYYY')}</p>
                        </div>
                        <div className="site-actions">
                            <div className={`status-indicator ${site.status}`}>
                                <span className="status-dot"></span>
                                {site.status}
                            </div>
                            <div className="action-buttons">
                                <Button type="link" className="edit-btn" onClick={() => handleEditSite(site)}>Edit</Button>
                                <Button type="link" danger onClick={() => handleDeleteSite(site.id)}>Delete</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {sites.length > pageSize && (
                <Button onClick={toggleShowAll} className="show-more-btn">
                    {showAll ? 'Show Less' : 'Show More'}
                </Button>
            )}
            {showAll && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={handlePrevious}
                                className={currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}
                            />

                            <PaginationNext
                                onClick={handleNext}
                                className={currentPage === Math.ceil(sites.length / pageSize) ? 'opacity-50 cursor-not-allowed' : ''}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            <Modal
                title={isEditMode ? 'Edit Site' : 'Add Site'}
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} onFinish={handleFormSubmit} layout="vertical">
                    <Form.Item name="siteName" label="Site Name" rules={[{ required: true, message: 'Please enter the site name' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="city" label="City" rules={[{ required: true, message: 'Please enter the city' }]}>
                        <Input />
                    </Form.Item>
                    {/* <Form.Item name="requirement" label="Requirement" rules={[{ required: true, message: 'Please enter the requirement' }]}>
                        <Input type="number" />
                    </Form.Item> */}
                    <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select the status' }]}>
                        <Select>
                            <Option value="active">Active</Option>
                            <Option value="inactive">Inactive</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="dateRange" label="Date Range" rules={[{ required: true, message: 'Please select the date range' }]}>
                        <RangePicker />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">{isEditMode ? 'Update Site' : 'Add Site'}</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Sites;