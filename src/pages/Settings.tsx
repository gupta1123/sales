'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import Salary from './Salary';
import Allowance from './Allowance';
import WorkingDays from './WorkingDays';
import Teams from './Teams'; // Import the Teams component
import { RootState } from '../store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import styles from './Settings.module.css';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('salary');
    const authToken = useSelector((state: RootState) => state.auth.token);

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">
                        Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex items-center space-x-4">
                        <button
                            className={`${styles.tabButton} ${activeTab === 'salary' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('salary')}
                        >
                            Salary
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'allowance' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('allowance')}
                        >
                            Allowance
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'workingDays' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('workingDays')}
                        >
                            Working Days
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'team' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('team')}
                        >
                            Team
                        </button>
                    </div>
                    <div className={styles.tabContent}>
                        {activeTab === 'salary' && <Salary authToken={authToken} />}
                        {activeTab === 'allowance' && <Allowance authToken={authToken} />}
                        {activeTab === 'workingDays' && <WorkingDays authToken={authToken} />}
                        {activeTab === 'team' && <Teams authToken={authToken} />} {/* Add the Teams component */}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}