import { useState } from 'react'
import TeacherDashboard from './modules/teacher/TeacherDashboard'
import ClassManagement from './modules/teacher/ClassManagement'
import GradeManagement from './modules/teacher/GradeManagement'
import ProgressTracking from './modules/teacher/ProgressTracking'
import BaoCaoGiangVien from './modules/teacher/TeacherReport'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <TeacherDashboard onNavigate={setCurrentPage} />
      case 'class-management':
        return <ClassManagement onNavigate={setCurrentPage} />
      case 'grade-management':
        return <GradeManagement onNavigate={setCurrentPage} />
      case 'progress-tracking':
        return <ProgressTracking onNavigate={setCurrentPage} />
      case 'reports-alerts':
        return <BaoCaoGiangVien onNavigate={setCurrentPage} />
      default:
        return <TeacherDashboard onNavigate={setCurrentPage} />
    }
  }

  return (
    <div>
      {renderCurrentPage()}
    </div>
  )
}

export default App
