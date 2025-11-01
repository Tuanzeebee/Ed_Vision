import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header chung với config cho teacher */}
            <Header
                showNavigation={false}
                isLandingPage={false}
                isAdminMode={false}
                isTeacherMode={true}
            />

            <div className="flex flex-1 relative">
                <Sidebar
                    currentPage={currentPage}
                    onNavigate={handleNavigation}
                />

                <div className="flex-1 ml-64 flex flex-col min-h-0">
                    <main className="flex-1 p-6">
                        {children}
                    </main>
                </div>
            </div>

            {/* Footer tràn qua sidebar - chỉ hiển thị khi scroll xuống cuối */}
            <Footer />
        </div>
    );
}