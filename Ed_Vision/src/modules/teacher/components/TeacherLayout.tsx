import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Sidebar from './Sidebar';
import { QRSessionProvider } from '../contexts/QRSessionContext';
import MinimizedQRBar from './MinimizedQRBar';

interface TeacherLayoutProps {
    children: ReactNode;
    currentPage?: string;
    onNavigate?: (path: string) =>void;
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
        <QRSessionProvider>
            <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
                {/* Header cố định trên cùng */}
                <Header
                    showNavigation={false}
                    isLandingPage={false}
                    isAdminMode={false}
                    isTeacherMode={true}
                />

                {/* Body: Sidebar + Main */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar - cố định width, ẩn scrollbar nhưng vẫn scroll được */}
                    <aside className="w-64 min-w-[256px] max-w-[256px] flex-shrink-0 h-full bg-white border-r border-gray-200 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <Sidebar
                            currentPage={currentPage}
                            onNavigate={handleNavigation}
                        />
                    </aside>

                    {/* Main content - có scroll riêng */}
                    <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                        {children}
                    </main>
                </div>

                {/* Global Minimized QR Bar */}
                <MinimizedQRBar />
            </div>
        </QRSessionProvider>);
}