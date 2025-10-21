import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

interface TeacherLayoutProps {
    children: ReactNode;
    currentPage?: string;
    onNavigate?: (path: string) => void;
}

export default function TeacherLayout({ children, currentPage, onNavigate }: TeacherLayoutProps) {
    const navigate = useNavigate();

    const handleNavigation = (path: string) => {
        // If custom navigation handler is provided, use it
        if (onNavigate) {
            onNavigate(path);
        } else {
            // Otherwise, use router navigation
            navigate(path);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="flex pt-20">
                <Sidebar
                    currentPage={currentPage}
                    onNavigate={handleNavigation}
                />

                <main className="flex-1 ml-64 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}