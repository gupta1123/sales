import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './Sidebar.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, resetState, AppDispatch, RootState } from '../store';
import { FiLogOut, FiHome, FiUsers, FiMap, FiUser, FiClipboard, FiDollarSign, FiSettings, FiBarChart2, FiMapPin } from 'react-icons/fi';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const role = useSelector((state: RootState) => state.auth.role);

  useEffect(() => {
    console.log('Current path:', router.pathname);
  }, [router.pathname]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(resetState());
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      router.push('/');
    } catch (error: any) {
      console.error('Error logging out:', error);
    }
  };

  const sidebarItems = [
    { href: '/Dashboard', icon: FiHome, label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'FIELD OFFICER'] },
    { href: '/VisitsList', icon: FiMap, label: 'Visits List', roles: ['ADMIN', 'MANAGER', 'FIELD OFFICER'] },
    { href: '/Expense', icon: FiDollarSign, label: 'Expenses', roles: ['ADMIN', 'FIELD OFFICER'] },
    { href: '/Attendance', icon: FiClipboard, label: 'Attendance', roles: ['ADMIN'] },
    { href: '/Requirements', icon: FiClipboard, label: 'Requirements', roles: ['ADMIN', 'MANAGER', 'FIELD OFFICER'] },
    { href: '/Complaints', icon: FiClipboard, label: 'Complaints', roles: ['ADMIN', 'MANAGER', 'FIELD OFFICER'] },
    { href: '/DailyPricing', icon: FiDollarSign, label: 'Daily Pricing', roles: ['ADMIN', 'MANAGER'] },
    { href: '/Reports', icon: FiBarChart2, label: 'Reports', roles: ['ADMIN'] },
    { href: '/CustomerListPage', icon: FiUsers, label: 'Customers', roles: ['ADMIN', 'MANAGER', 'FIELD OFFICER'] },
    { href: '/Employeelist', icon: FiUser, label: 'Employee List', roles: ['ADMIN'] },

    { href: '/Settings', icon: FiSettings, label: 'Settings', roles: ['ADMIN'] },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>Gajkesari</h2>
      </div>
      <div className={styles.sidebarContent}>
        <ul className={styles.sidebarList}>
          {sidebarItems.map((item) => (
            (role && item.roles.includes(role)) && (
              <li key={item.href} className={styles.sidebarItem}>
                <Link href={item.href} className={`${styles.sidebarLink} ${router.pathname === item.href ? styles.active : ''}`}>
                  <item.icon className={styles.sidebarIcon} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          ))}
        </ul>
      </div>
      <div className={styles.sidebarFooter}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          <FiLogOut className={styles.sidebarIcon} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
