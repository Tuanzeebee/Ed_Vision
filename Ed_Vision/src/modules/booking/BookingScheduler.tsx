import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChangeEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/lib/useToast'
import { TokenManager } from '@/lib/tokenManager'

type Props = {
  instructorId?: number // instructor_id (used to fetch availability)
  instructorAccountId?: number // account_id of instructor (used to fetch profile)
  student?: {
    fullName?: string
    studentCode?: string
    className?: string
    verified?: boolean
  }
}

// We'll load week days and slots from the backend API
// Minimal mapping helpers
type ApiTimeSlot = {
  slotId: number
  startTime: string
  endTime: string
  meetingType: string
  capacity: number
  isOpen: boolean
  autoAccept: boolean
  bookedCount?: number
  meetingLink?: string
  meetingLocation?: string
}

type ApiAvailability = {
  date: string // 'YYYY-MM-DD'
  dayOfWeek: number
  isAvailable?: boolean
  timeSlots: ApiTimeSlot[]
}

type MeetingPurposeOption = {
  value: string
  label: string
}

export default function BookingScheduler({ instructorId: propInstructorId, instructorAccountId, student }: Props) {
  const [searchParams] = useSearchParams()
  const { instructorId: instructorIdParam } = useParams<{ instructorId?: string }>()
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [selectedDateIdx, setSelectedDateIdx] = useState<number>(0)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<'online' | 'offline' | null>('online')
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [availabilities, setAvailabilities] = useState<ApiAvailability[]>([])
  const [weekDates, setWeekDates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // prefer explicit instructor id, fall back to route/query params, or advisor from student info
  const routeInstructorId = useMemo(() => {
    if (!instructorIdParam) return undefined
    const parsed = Number(instructorIdParam)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }, [instructorIdParam])
  const queryInstructorId = useMemo(() => {
    const raw = searchParams.get('instructorId')
    if (!raw) return undefined
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }, [searchParams])
  const explicitInstructorId = useMemo(() => {
    if (typeof propInstructorId === 'number') return propInstructorId
    if (typeof routeInstructorId === 'number') return routeInstructorId
    if (typeof queryInstructorId === 'number') return queryInstructorId
    return null
  }, [propInstructorId, routeInstructorId, queryInstructorId])
  const [activeInstructorId, setActiveInstructorId] = useState<number | null>(explicitInstructorId)
  const [activeInstructorAccountId, setActiveInstructorAccountId] = useState<number | null>(instructorAccountId ?? null)
  const [instructorProfile, setInstructorProfile] = useState<any | null>(null)
  const [slotDetails, setSlotDetails] = useState<any | null>(null)
  const [studentInfo, setStudentInfo] = useState<any | null>(student ?? null)
  const [studentInfoResolved, setStudentInfoResolved] = useState<boolean>(!!student)
  const [parentInfo, setParentInfo] = useState<any | null>(null)
  const [parentInfoResolved, setParentInfoResolved] = useState<boolean>(false)
  const [linkedStudents, setLinkedStudents] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const { t, i18n } = useTranslation('student')

  const PURPOSE_OPTIONS: MeetingPurposeOption[] = useMemo(
    () => [
      { value: 'study', label: t('appointments.management.purposes.studyAdvice', 'Study advising') },
      { value: 'progress', label: t('appointments.management.purposes.progressDiscussion', 'Progress discussion') },
      { value: 'thesis', label: t('appointments.management.purposes.thesisGuidance', 'Thesis guidance') },
      { value: 'other', label: t('appointments.management.purposes.other', 'Other') },
    ],
    [t],
  )
  const [meetingPurpose, setMeetingPurpose] = useState<string>(PURPOSE_OPTIONS[0].value)
  const [customPurpose, setCustomPurpose] = useState<string>('')
  const [contactFields, setContactFields] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: '',
  })
  const { toasts, error: pushErrorToast, warning: pushWarningToast, success: pushSuccessToast, info: pushInfoToast, hideToast } = useToast()
  const navigate = useNavigate()
  const [isBooking, setIsBooking] = useState(false)
  const [bookedSlotIds, setBookedSlotIds] = useState<number[]>([])
  const [dashboardPath, setDashboardPath] = useState('/student/instructions')

  // show backend or network errors to user briefly
  // (we'll render below calendar when present)

  const fetchStudentInfo = useCallback(async () => {
    if (studentInfoResolved) return
    // Skip if student prop is already provided (parent role passes student via prop)
    if (student) {
      setStudentInfo(student)
      setStudentInfoResolved(true)
      return
    }
    try {
      const token = localStorage.getItem('dev-token') || TokenManager.getToken() || localStorage.getItem('token')
      const r = await fetch('/api/booking/me/student', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!r.ok) return
      const text = await r.text()
      if (!text) return
      let parsed: any = null
      try {
        parsed = JSON.parse(text)
      } catch (e) {
        return
      }
      const st = parsed?.student ?? parsed
      // Only set studentInfo if we got valid student data (not {student: null} for parent role)
      if (st && st !== null && typeof st === 'object' && Object.keys(st).length > 1) {
        setStudentInfo(st)
      }
    } catch (e) {
      // ignore
    } finally {
      setStudentInfoResolved(true)
    }
  }, [studentInfoResolved, student])

  const fetchParentInfo = useCallback(async () => {
    if (parentInfoResolved) return
    try {
      const token = localStorage.getItem('dev-token') || TokenManager.getToken() || localStorage.getItem('token')
      const r = await fetch('/api/booking/me/parent', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!r.ok) return
      const text = await r.text()
      if (!text) return
      let parsed: any = null
      try {
        parsed = JSON.parse(text)
      } catch (e) {
        return
      }
      const parentData = Object.prototype.hasOwnProperty.call(parsed ?? {}, 'parent') ? parsed?.parent : parsed
      if (parentData) {
        setParentInfo(parentData)
      } else {
        setParentInfo(null)
      }
    } catch (e) {
      // ignore
    } finally {
      setParentInfoResolved(true)
    }
  }, [parentInfoResolved])

  useEffect(() => {
    let targetInstructorId: number | null = null
    let targetAccountId: number | null = null

    if (explicitInstructorId !== null) {
      targetInstructorId = explicitInstructorId
      targetAccountId = instructorAccountId ?? null
    } else if (studentInfo?.advisor?.instructorId) {
      targetInstructorId = studentInfo.advisor.instructorId
      targetAccountId = studentInfo.advisor.accountId ?? null
    }
    // Removed hardcoded fallback to instructor ID 3
    // If no instructor is found, targetInstructorId remains null

    if (targetInstructorId !== null && targetInstructorId !== activeInstructorId) {
      setActiveInstructorId(targetInstructorId)
      setAvailabilities([])
      setWeekDates([])
      setSelectedSlot(null)
      setSelectedDateIdx(0)
      setSlotDetails(null)
      setSelectedFormat('online')
    }

    if (targetAccountId !== activeInstructorAccountId) {
      setActiveInstructorAccountId(targetAccountId)
    }
  }, [explicitInstructorId, instructorAccountId, studentInfo, studentInfoResolved, activeInstructorId, activeInstructorAccountId])

  useEffect(() => {
    void fetchStudentInfo()
  }, [fetchStudentInfo])

  useEffect(() => {
    void fetchParentInfo()
  }, [fetchParentInfo])

  const fetchExistingAppointments = async () => {
    try {
      const token = localStorage.getItem('dev-token') || TokenManager.getToken() || localStorage.getItem('token')
      const response = await fetch('/api/booking', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!response.ok) return
      const text = await response.text()
      if (!text) {
        setBookedSlotIds([])
        return
      }
      try {
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed)) {
          const activeStatuses = new Set(['pending', 'confirmed'])
          const slotIds = parsed
            .map((appt: any) => {
              const status = (appt?.status ?? '').toString().toLowerCase()
              if (!activeStatuses.has(status)) return null
              const slotIdFromRoot = appt?.slot_id
              if (typeof slotIdFromRoot === 'number') return slotIdFromRoot
              const nestedSlotId = appt?.slot?.slot_id ?? appt?.slot?.slotId
              if (typeof nestedSlotId === 'number') return nestedSlotId
              return null
            })
            .filter((id): id is number => typeof id === 'number')
          const unique = Array.from(new Set(slotIds))
          setBookedSlotIds(unique)
        }
      } catch (parseError) {
        // ignore malformed payloads
      }
    } catch (error) {
      console.warn(t('bookingSchedules.error.loadAvailability'), error)
    }
  }

  const goToStep2 = () => {
    // before moving to confirmation, fetch fresh slot details (includes meeting link/location and instructor profile)
    const fetchSlot = async () => {
      if (!selectedSlot) return
      try {
        const res = await fetch(`/api/booking/slot/${selectedSlot}`)
        if (!res.ok) return
        const data = await res.json()
        setSlotDetails(data)
        // wire instructor profile if present (handle both shapes: { slot } or plain slot)
        const slot = data?.slot ?? data
        if (slot?.week?.instructor?.account?.profile) setInstructorProfile(slot.week.instructor.account.profile)
      } catch (e) {
        // ignore
      }
    }
    void fetchSlot()
    void fetchStudentInfo()
    void fetchParentInfo()
    void fetchExistingAppointments()
    setCurrentStep(2)
  }

  const goToStep1 = () => {
    setCurrentStep(1)
  }

  const toggleConfirm = (v?: boolean) => {
    setConfirmChecked(v ?? !confirmChecked)
  }

  const onConfirm = async () => {
    if (selectedSlot && bookedSlotIds.includes(selectedSlot)) {
      pushWarningToast(t('bookingSchedules.toast.slotAlreadyBooked'))
      return
    }
    if (isBooking) {
      pushInfoToast(t('bookingSchedules.toast.processingPrevious'))
      return
    }
    if (!canConfirm) {
      if (!isPurposeValid) {
        pushWarningToast(t('bookingSchedules.toast.missingPurpose'))
      } else if (!isContactValid) {
        pushWarningToast(t('bookingSchedules.toast.missingContact'))
      } else if (!isStudentSelectionValid) {
        pushWarningToast(t('bookingSchedules.toast.missingStudent'))
      }
      return
    }
    await doBooking()
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      pushSuccessToast(t('bookingSchedules.toast.copySuccess'))
    } catch (e) {
      console.error('Copy failed', e)
      pushErrorToast(t('bookingSchedules.toast.copyError'))
    }
  }

    // chosenDate / chosenSlot based on API data (weekDates holds the 7-day window; availabilities is a sparse list)
    const chosenDate: ApiAvailability | null = (() => {
      if (!weekDates || weekDates.length === 0) return null
      const map = new Map(availabilities.map((x: any) => [x.date, x]))
      const dateStr = weekDates[selectedDateIdx]
      return map.get(dateStr) || null
    })()
  const chosenSlot = (() => {
    if (!chosenDate || !selectedSlot) return null
    return chosenDate.timeSlots.find((s) => s.slotId === selectedSlot) || null
  })()

  // Function to fetch availability data
  const fetchAvailability = useCallback(async () => {
    if (!activeInstructorId) return
    
    setLoading(true)
    setError(null)
    try {
      // Calculate current week dates (Monday to Sunday)
      const now = new Date()
      const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000))
      const today = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth(), vietnamTime.getDate())
      
      // Get Monday of current week
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      const weekStart = new Date(today)
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)
      
      // Get Sunday of current week
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      // Format dates for API
      const startDate = weekStart.toISOString().split('T')[0]
      const endDate = weekEnd.toISOString().split('T')[0]
      
      console.log('Fetching availability for current week:', startDate, 'to', endDate)
      
      const res = await fetch(`/api/instructor-availability/${activeInstructorId}?startDate=${startDate}&endDate=${endDate}&autoCreate=false&_t=${Date.now()}`)
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        // Received HTML (likely index.html) — proxy not configured or backend not running
        const txt = await res.text()
        throw new Error(`Expected JSON but received ${contentType}. Response starts with: ${txt.slice(0, 120)}`)
      }
      const data = await res.json()
      // Expect data.availabilities: AvailabilityDateResponse[]
      const mapped: ApiAvailability[] = (data.availabilities || []).map((d: any) => ({
        date: d.date,
        dayOfWeek: d.dayOfWeek,
        isAvailable: !!d.is_available,
        timeSlots: (d.timeSlots || []).map((t: any) => ({
          slotId: t.slotId,
          startTime: t.startTime,
          endTime: t.endTime,
          meetingType: t.meetingType,
          capacity: t.capacity,
          isOpen: t.isOpen,
          autoAccept: t.autoAccept,
          bookedCount: t.bookedCount,
          meetingLink: t.meetingLink || t.meeting_link || null,
          meetingLocation: t.meetingLocation || t.meeting_location || null,
        })),
      }))

      setAvailabilities(mapped)
      // Always show current week (Mon..Sun) regardless of data availability
      const dates: string[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart)
        d.setDate(weekStart.getDate() + i)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        dates.push(`${y}-${m}-${dd}`)
      }
      setWeekDates(dates)

        // Only auto-select first available date on initial load (when selectedDateIdx is 0 and no dates were loaded before)
        if (weekDates.length === 0) {
          let selIdx = 0
          const map = new Map(mapped.map((x: any) => [x.date, x]))
          
          // Get today in Vietnam timezone (GMT+7)
          const currentTime = new Date()
          const vietnamTimeCurrent = new Date(currentTime.getTime() + (7 * 60 * 60 * 1000) + (currentTime.getTimezoneOffset() * 60 * 1000))
          const todayCurrent = new Date(vietnamTimeCurrent.getFullYear(), vietnamTimeCurrent.getMonth(), vietnamTimeCurrent.getDate())
          
          for (let i = 0; i < dates.length; i++) {
            const dateObj = new Date(dates[i] + 'T00:00:00Z')
            const isPast = dateObj < todayCurrent
            const d = map.get(dates[i])
            
            // Only select if not in the past and has availability
            if (!isPast && d && ((d.timeSlots && d.timeSlots.length > 0) || d.isAvailable)) {
              selIdx = i
              break
            }
          }
          setSelectedDateIdx(selIdx)
        }
    } catch (e: any) {
      if (e?.message) {
        setError(`${t('bookingSchedules.error.loadAvailability')} ${e.message}`)
      } else {
        setError(t('bookingSchedules.error.loadAvailability'))
      }
    } finally {
      setLoading(false)
    }
  }, [activeInstructorId])

  // fetch availability on mount
  useEffect(() => {
    fetchAvailability()
  }, [activeInstructorId, fetchAvailability])

  // Auto-refresh when date changes (crosses midnight) - optimized to avoid API spam
  useEffect(() => {
    const scheduleNextMidnightCheck = () => {
      const now = new Date()
      const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000))
      
      // Calculate time until next midnight in Vietnam timezone
      const tomorrow = new Date(vietnamTime)
      tomorrow.setDate(vietnamTime.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const timeUntilMidnight = tomorrow.getTime() - vietnamTime.getTime()
      
      console.log(`Next midnight check in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`)
      
      return setTimeout(() => {
        const currentDate = vietnamTime.toDateString()
        const storedDate = sessionStorage.getItem('currentBookingDate')
        
        if (storedDate !== currentDate) {
          console.log('Date changed at midnight, refreshing booking data')
          sessionStorage.setItem('currentBookingDate', currentDate)
          // Trigger re-fetch by updating a dummy state
          setAvailabilities([])
          setWeekDates([])
          
          // Re-run the fetch effect
          if (activeInstructorId) {
            const fetchAvailability = async () => {
              setLoading(true)
              setError(null)
              try {
                // Calculate current week dates (Monday to Sunday)
                const now = new Date()
                const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000))
                const today = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth(), vietnamTime.getDate())
                
                // Get Monday of current week
                const day = today.getDay()
                const diff = today.getDate() - day + (day === 0 ? -6 : 1)
                const weekStart = new Date(today)
                weekStart.setDate(diff)
                weekStart.setHours(0, 0, 0, 0)
                
                // Get Sunday of current week
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekStart.getDate() + 6)
                weekEnd.setHours(23, 59, 59, 999)
                
                // Format dates for API
                const startDate = weekStart.toISOString().split('T')[0]
                const endDate = weekEnd.toISOString().split('T')[0]
                
                console.log('Midnight refresh: loading availability for current week:', startDate, 'to', endDate)
                
                const res = await fetch(`/api/instructor-availability/${activeInstructorId}?startDate=${startDate}&endDate=${endDate}&autoCreate=false&_t=${Date.now()}`)
                if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
                const contentType = res.headers.get('content-type') || ''
                if (!contentType.includes('application/json')) {
                  const txt = await res.text()
                  throw new Error(`Expected JSON but received ${contentType}. Response starts with: ${txt.slice(0, 120)}`)
                }
                const data = await res.json()
                const mapped: ApiAvailability[] = (data.availabilities || []).map((d: any) => ({
                  date: d.date,
                  dayOfWeek: d.dayOfWeek,
                  isAvailable: !!d.is_available,
                  timeSlots: (d.timeSlots || []).map((t: any) => ({
                    slotId: t.slotId,
                    startTime: t.startTime,
                    endTime: t.endTime,
                    meetingType: t.meetingType,
                    capacity: t.capacity,
                    isOpen: t.isOpen,
                    autoAccept: t.autoAccept,
                    bookedCount: t.bookedCount,
                    meetingLink: t.meetingLink || t.meeting_link || null,
                    meetingLocation: t.meetingLocation || t.meeting_location || null,
                  })),
                }))

                setAvailabilities(mapped)
                // Always show current week (Mon..Sun) regardless of data availability
                const dates: string[] = []
                for (let i = 0; i < 7; i++) {
                  const d = new Date(weekStart)
                  d.setDate(weekStart.getDate() + i)
                  const y = d.getFullYear()
                  const m = String(d.getMonth() + 1).padStart(2, '0')
                  const dd = String(d.getDate()).padStart(2, '0')
                  dates.push(`${y}-${m}-${dd}`)
                }
                setWeekDates(dates)
                
                // Check if currently selected date is still available after refresh
                const map = new Map(mapped.map((x: any) => [x.date, x]))
                const currentSelectedDate = dates[selectedDateIdx]
                if (currentSelectedDate) {
                  const currentSelectedData = map.get(currentSelectedDate)
                  const currentDateObj = new Date(currentSelectedDate + 'T00:00:00Z')
                  const isCurrentPast = currentDateObj < today
                  const isCurrentAvailable = !isCurrentPast && currentSelectedData && ((currentSelectedData.timeSlots && currentSelectedData.timeSlots.length > 0) || currentSelectedData.isAvailable)
                  
                  if (!isCurrentAvailable) {
                    // Reset selection
                    setSelectedDateIdx(0)
                    setSelectedSlot(null)
                    setSelectedFormat(null)
                  }
                }
              } catch (e: any) {
                  if (e?.message) {
                    setError(`${t('bookingSchedules.error.loadAvailability')} ${e.message}`)
                  } else {
                    setError(t('bookingSchedules.error.loadAvailability'))
                  }
              } finally {
                setLoading(false)
              }
            }
            fetchAvailability()
          }
        }
        
        // Schedule next check
        scheduleNextMidnightCheck()
      }, timeUntilMidnight)
    }
    
    // Initialize current date in sessionStorage
    const now = new Date()
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000))
    const currentDate = vietnamTime.toDateString()
    sessionStorage.setItem('currentBookingDate', currentDate)
    
    // Start the scheduling
    const timeoutId = scheduleNextMidnightCheck()
    
    return () => clearTimeout(timeoutId)
  }, [activeInstructorId])

  // fetch instructor profile when account id is provided
  useEffect(() => {
    const accountIdToFetch = activeInstructorAccountId ?? instructorAccountId ?? null
    if (!accountIdToFetch) return
    let mounted = true
    const fetchProfile = async () => {
      try {
  const res = await fetch(`/api/instructor-availability/profile/${accountIdToFetch}`)
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setInstructorProfile(data)
      } catch (e) {
        // ignore for now
      }
    }
    fetchProfile()
    return () => { mounted = false }
  }, [activeInstructorAccountId, instructorAccountId])

  useEffect(() => {
    const advisorProfile = studentInfo?.advisor
    if (!advisorProfile) return
  setInstructorProfile((prev: any) => {
      if (prev && Object.keys(prev).length > 0) return prev
      return {
        full_name: advisorProfile.fullName ?? advisorProfile.full_name ?? null,
        academic_title: advisorProfile.academicTitle ?? null,
        position: advisorProfile.position ?? null,
        employee_code: advisorProfile.employeeCode ?? null,
        avatar_url: advisorProfile.avatarUrl ?? null,
        email: advisorProfile.email ?? null,
        instructor_id: advisorProfile.instructorId ?? null,
        account_id: advisorProfile.accountId ?? null,
      }
    })
  }, [studentInfo])

  useEffect(() => {
    if (!parentInfo) return
    setContactFields((prev) => ({
      name: prev.name || parentInfo.fullName || parentInfo.full_name || '',
      phone: prev.phone || parentInfo.phoneNumber || parentInfo.phone_number || '',
      email: prev.email || parentInfo.email || '',
      relationship: prev.relationship || parentInfo.relationship_type || '',
    }))
  }, [parentInfo])

  useEffect(() => {
    if (!parentInfo) {
      setLinkedStudents([])
      setSelectedStudentId(null)
      setContactFields({ name: '', phone: '', email: '', relationship: '' })
      return
    }
    let cancelled = false
    const loadParentStudents = async () => {
      try {
        const token = localStorage.getItem('dev-token') || TokenManager.getToken() || localStorage.getItem('token')
        const r = await fetch('/api/booking/me/parent/students', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!r.ok) return
        const text = await r.text()
        if (!text) return
        let parsed: any = null
        try {
          parsed = JSON.parse(text)
        } catch (e) {
          return
        }
        if (cancelled) return
        const list = parsed?.students ?? []
        if (Array.isArray(list) && list.length > 0) {
          setLinkedStudents(list)
          setStudentInfoResolved(false)
        } else {
          setLinkedStudents([])
          setSelectedStudentId(null)
          setStudentInfo(null)
          setStudentInfoResolved(true)
        }
      } catch (e) {
        // ignore
        if (!cancelled) setStudentInfoResolved(true)
      }
    }
    void loadParentStudents()
    return () => {
      cancelled = true
    }
  }, [parentInfo])

  useEffect(() => {
    if (!linkedStudents || linkedStudents.length === 0) return
    setSelectedStudentId((prev) => {
      const existing = linkedStudents.find((st) => st.studentId === prev)
      if (existing) return prev
      const firstId = linkedStudents[0]?.studentId ?? null
      return firstId
    })
  }, [linkedStudents])

  useEffect(() => {
    if (!linkedStudents || linkedStudents.length === 0) return
    if (!selectedStudentId) return
    const selected = linkedStudents.find((st) => st.studentId === selectedStudentId)
    if (selected) {
      setStudentInfo(selected)
      setContactFields((prev) => ({
        ...prev,
        relationship: prev.relationship || selected.relationship || '',
      }))
      setStudentInfoResolved(true)
    }
  }, [linkedStudents, selectedStudentId])

  // helper to group slots by period for rendering
  const groupSlots = (dateIdx: number) => {
    const map = new Map(availabilities.map((x: any) => [x.date, x]))
    const dateStr = weekDates[dateIdx]
    const date = map.get(dateStr)
    if (!date) return { morning: [], afternoon: [], evening: [] }
    const morning: ApiTimeSlot[] = []
    const afternoon: ApiTimeSlot[] = []
    const evening: ApiTimeSlot[] = []

    for (const s of date.timeSlots) {
      const hour = Number(s.startTime.split(':')[0])
      if (hour < 12) morning.push(s)
      else if (hour < 17) afternoon.push(s)
      else evening.push(s)
    }
    return { morning, afternoon, evening }
  }

  const doBooking = async () => {
    if (!selectedSlot) {
      pushWarningToast(t('bookingSchedules.toast.selectSlotBeforeBooking'))
      return
    }
  const token = localStorage.getItem('dev-token') || TokenManager.getToken() || localStorage.getItem('token')
    setIsBooking(true)
    const slotIdBeingBooked = selectedSlot
    try {
      const body: Record<string, any> = {
        slotId: selectedSlot,
        meetingType: selectedFormat,
        meetingPurpose:
          meetingPurpose === 'other'
            ? customPurpose.trim() || undefined
            : PURPOSE_OPTIONS.find((opt) => opt.value === meetingPurpose)?.label,
      }
      if (isParentRole) {
        const name = contactFields.name.trim()
        const phone = contactFields.phone.trim()
        const email = contactFields.email.trim()
        const relationship = contactFields.relationship.trim()
        if (selectedStudentId) body.studentId = selectedStudentId
        if (name) body.contactName = name
        if (phone) body.contactPhone = phone
        if (email) body.contactEmail = email
        if (relationship) body.relationshipToStudent = relationship
      }
  const res = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const txt = await res.text()
        let responseMessage = txt
        try {
          const parsed = txt ? JSON.parse(txt) : null
          if (parsed && typeof parsed === 'object') {
            responseMessage = parsed?.message || parsed?.error || txt
          }
        } catch (parseError) {
          // keep original text when parsing fails
        }

        if ((responseMessage || '').toLowerCase().includes('time slot is full')) {
          throw new Error('SLOT_FULL')
        }

        throw new Error(responseMessage || `Unable to book (code ${res.status}).`)
      }
      setShowSuccessModal(true)
      setBookedSlotIds((prev) => (prev.includes(slotIdBeingBooked) ? prev : [...prev, slotIdBeingBooked]))
      void fetchExistingAppointments()
    } catch (e) {
      let rawMessage = e instanceof Error ? e.message : String(e)

      if (rawMessage === 'SLOT_FULL') {
        pushErrorToast(t('bookingSchedules.toast.slotFull'))
        return
      }

      if (rawMessage && rawMessage.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(rawMessage)
          rawMessage = parsed?.message || parsed?.error || ''
        } catch (parseError) {
          // leave rawMessage as-is when JSON parsing fails
        }
      }

      const normalized = (rawMessage || '').trim()
      const detail = normalized && normalized.toLowerCase() !== 'error' ? ` ${normalized}` : ''
      pushErrorToast(t('bookingSchedules.toast.bookingFailed') + detail)
    } finally {
      setIsBooking(false)
    }
  }

  // grouped slots for the selected date (lookup from sparse availabilities list)
  const groupedSlots = groupSlots(selectedDateIdx)
  const groupedTotal = groupedSlots.morning.length + groupedSlots.afternoon.length + groupedSlots.evening.length
  const onContactFieldChange = (field: 'name' | 'phone' | 'email' | 'relationship') => (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setContactFields((prev) => ({ ...prev, [field]: value }))
  }

  const currentSlotMeta = (() => {
    const raw = (slotDetails?.slot ?? slotDetails) as any
    const link =
      raw?.transient_meeting_link ??
      raw?.transientMeetingLink ??
      raw?.meeting_link ??
      raw?.meetingLink ??
      chosenSlot?.meetingLink ??
      null
    const location =
      raw?.meeting_location ??
      raw?.meetingLocation ??
      chosenSlot?.meetingLocation ??
      null
    return {
      meetingLink: link,
      meetingLocation: location,
    }
  })()
  const isOnlineFormat = selectedFormat !== 'offline'
  const participationLabel = isOnlineFormat ? t('bookingSchedules.participation.labelLink') : t('bookingSchedules.participation.labelLocation')
  const participationValue = isOnlineFormat
    ? currentSlotMeta.meetingLink || t('bookingSchedules.participation.noLink')
    : currentSlotMeta.meetingLocation || t('bookingSchedules.participation.noLocation')
  const participationCopyValue = isOnlineFormat ? currentSlotMeta.meetingLink : currentSlotMeta.meetingLocation
  const selectedPurposeLabel = meetingPurpose === 'other'
    ? customPurpose.trim() || t('appointments.management.purposes.other')
    : PURPOSE_OPTIONS.find((opt) => opt.value === meetingPurpose)?.label ?? t('appointments.management.purposes.studyAdvice')
  const isPurposeValid = meetingPurpose !== 'other' || customPurpose.trim().length > 0
  const isParentRole = !!parentInfo
  const hasBookedSelectedSlot = selectedSlot !== null && bookedSlotIds.includes(selectedSlot)
  const isContactValid = !isParentRole || contactFields.name.trim().length > 0
  const isStudentSelectionValid = !isParentRole || selectedStudentId !== null
  const canConfirm =
    confirmChecked &&
    isPurposeValid &&
    isContactValid &&
    isStudentSelectionValid &&
    !hasBookedSelectedSlot &&
    !isBooking

  // Auto-select first available slot when date changes and no slot is selected
  useEffect(() => {
    // Only run if we don't have a selected slot
    if (selectedSlot !== null) return
    if (!weekDates || weekDates.length === 0) return
    
    const map = new Map(availabilities.map((x: any) => [x.date, x]))
    const dateStr = weekDates[selectedDateIdx]
    const date = map.get(dateStr)
    
    if (date && date.timeSlots && date.timeSlots.length > 0) {
      // Find the first valid slot (open and not at capacity)
      const firstValidSlot = date.timeSlots.find((slot: ApiTimeSlot) => 
        slot.isOpen && ((slot.bookedCount ?? 0) < slot.capacity)
      )
      
      if (firstValidSlot) {
        setSelectedSlot(firstValidSlot.slotId)
        setSelectedFormat(firstValidSlot.meetingType === 'online' ? 'online' : 'offline')
      }
    }
  }, [selectedDateIdx, weekDates, availabilities, selectedSlot])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let path = '/student/instructions'

    if (isParentRole) {
      path = '/parent/dashboard'
    } else if (studentInfo) {
      path = '/student/instructions'
    }

    try {
      const rawUser = localStorage.getItem('user')
      if (rawUser) {
        const parsedUser = JSON.parse(rawUser)
        const roleCode =
          parsedUser?.roleRel?.code ||
          parsedUser?.role ||
          parsedUser?.role_code ||
          parsedUser?.roleCode ||
          ''
        const normalizedRole = typeof roleCode === 'string' ? roleCode.toLowerCase() : ''
        if (normalizedRole.includes('parent')) {
          path = '/parent/dashboard'
        } else if (normalizedRole.includes('teacher')) {
          path = '/teacher/dashboard'
        } else if (normalizedRole.includes('admin')) {
          path = '/admin/dashboard'
        } else if (normalizedRole.includes('student')) {
          path = '/student/instructions'
        }
      }
    } catch (error) {
      // ignore malformed user payload
    }

    setDashboardPath(path)
  }, [isParentRole, studentInfo])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <Header showNavigation={true} />

      {/* Main Content */}
      <main className="flex-1">
        <div className="p-4 bg-white min-h-screen">
          {/* Back Button - positioned below header with blue styling */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/appointments')}
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('bookingSchedules.back')}
            </button>
          </div>

          <div className="bg-white rounded-xl overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5">
            <div className="flex items-center justify-center mb-2">
              <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow transition-all ${
                      currentStep === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep === 1 ? '1' : ''}
                  </div>
                  <span className={`font-semibold text-xs transition-colors ${currentStep === 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                    {t('bookingSchedules.step.chooseTime')}
                  </span>
                </div>
                <div className="w-8 sm:w-12 h-0.5 bg-gray-200 rounded-full"></div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      currentStep === 2 ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    2
                  </div>
                  <span className={`font-semibold text-xs transition-colors ${currentStep === 2 ? 'text-blue-600' : 'text-gray-500'}`}>
                    {t('bookingSchedules.step.confirm')}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-700 h-1.5 rounded-full transition-all duration-300"
                style={{ width: currentStep === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto py-4 sm:py-5">
          <div className="p-4 sm:p-5">
            {currentStep === 1 && (
              <div id="step1" className="animate-in fade-in duration-300">
                {!activeInstructorId && !loading ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                      <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{t('bookingSchedules.noAdvisor.title')}</h2>
                    <p className="text-sm text-gray-600 mb-4">{t('bookingSchedules.noAdvisor.subtitle')}</p>
                  </div>
                ) : (
                  <>
                <div className="text-center mb-5">
                  <div className="relative mb-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <button
                      onClick={() => {
                        setLoading(true);
                        setError(null);
                        fetchAvailability();
                      }}
                      disabled={loading}
                      className="absolute top-0 right-0 flex items-center justify-center w-8 h-8 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      title={t('bookingSchedules.refresh')}
                    >
                      <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5">{t('bookingSchedules.title')}</h1>
                  <p className="text-xs sm:text-sm text-gray-600">{t('bookingSchedules.subtitle')}</p>
                </div>

                {/* Weekly Calendar */}
                <div className="mb-5">
                  <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {weekDates.length > 0 ? (() => {
                        const firstDate = new Date(weekDates[0] + 'T00:00:00Z')
                        const lastDate = new Date(weekDates[weekDates.length - 1] + 'T00:00:00Z')
                        const firstDay = firstDate.getUTCDate()
                        const lastDay = lastDate.getUTCDate()
                        const firstMonth = firstDate.getUTCMonth() + 1
                        const lastMonth = lastDate.getUTCMonth() + 1
                        const year = firstDate.getUTCFullYear()

                        const startLabel = firstMonth === lastMonth ? `${firstDay}` : `${firstDay} Tháng ${firstMonth}`
                        const endLabel = firstMonth === lastMonth ? `${lastDay} Tháng ${firstMonth}, ${year}` : `${lastDay} Tháng ${lastMonth}, ${year}`

                        return t('bookingSchedules.weekRange', { start: startLabel, end: endLabel })
                      })() : t('bookingSchedules.weekRange', { start: '', end: '' })}
                    </div>
                  </h2>

                  {groupedTotal === 0 && (
                    <div className="text-center text-sm text-gray-600 py-4">{t('bookingSchedules.noSlots')}</div>
                  )}

                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-3">
                    {loading && <div className="col-span-7 text-center text-xs">{t('bookingSchedules.loading')}</div>}
                    {!loading && availabilities.length === 0 && (
                      <div className="col-span-7 text-center text-xs">{t('bookingSchedules.noSlots')}</div>
                    )}
                                    {!loading && weekDates.map((dateStr, idx) => {
                                      const dateObj = new Date(dateStr + 'T00:00:00Z')
                                      const shortMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
                                      const short = shortMap[dateObj.getUTCDay()]
                                      const dayNum = dateObj.getUTCDate()
                                      const map = new Map(availabilities.map((x: any) => [x.date, x]))
                                      const d = map.get(dateStr)
                                      
                                      // Check if date is in the past (before today in Vietnam timezone GMT+7)
                                      const now = new Date()
                                      const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000))
                                      const today = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth(), vietnamTime.getDate())
                                      const isPast = dateObj < today
                                      
                                      const available = !isPast && !!(d && ((d.timeSlots && d.timeSlots.length > 0) || d.isAvailable))
                                      return (
                                        <div
                                          key={dateStr}
                                          role="button"
                                          onClick={() => {
                                            if (available) {
                                              setSelectedDateIdx(idx)
                                              // Reset slot selection when changing date
                                              setSelectedSlot(null)
                                              setSelectedFormat('online')
                                            }
                                          }}
                                          className={`rounded-lg p-2 text-center transition-all cursor-pointer ${
                                            !available || isPast
                                              ? 'bg-gray-100 border border-gray-200 opacity-50 cursor-not-allowed'
                                              : selectedDateIdx === idx
                                                ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md scale-105'
                                                : 'bg-white border-2 border-gray-200 hover:shadow-md hover:border-blue-300 hover:scale-105'
                                          }`}
                                        >
                                          <div className={`text-xs mb-0.5 font-medium ${selectedDateIdx === idx ? 'text-white' : 'text-gray-500'}`}>
                                            {short}
                                          </div>
                                          <div className={`text-sm font-bold ${selectedDateIdx === idx ? 'text-white' : 'text-gray-900'}`}>
                                            {dayNum}
                                          </div>
                                        </div>
                                      )
                                    })}
                  </div>

                  <div className="flex items-center justify-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full" />
                      <span className="text-gray-700 font-medium">{t('bookingSchedules.selected')}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full" />
                      <span className="text-gray-700 font-medium">{t('bookingSchedules.unavailable')}</span>
                    </div>
                    {error && <div className="text-red-600 text-xs">{error}</div>}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center">
                    <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {t('bookingSchedules.availableSlots')}
                  </h2>

                  {/* Morning */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('bookingSchedules.morning')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {groupedSlots.morning.map((s) => {
                        const isDisabled = !s.isOpen || ((s.bookedCount ?? 0) >= s.capacity)
                        
                        return (
                        <div
                          key={s.slotId}
                          onClick={() => {
                            if (isDisabled) return // Block clicking on disabled slots
                            setSelectedSlot(s.slotId)
                            setSelectedFormat(s.meetingType === 'online' ? 'online' : 'offline')
                          }}
                          className={`relative rounded-lg p-3 transition-all ${
                            isDisabled
                              ? 'bg-gray-100 border-2 border-gray-200 opacity-60 cursor-not-allowed'
                              : selectedSlot === s.slotId
                                ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md cursor-pointer'
                                : 'bg-white border-2 border-gray-200 hover:shadow-md hover:border-blue-300 cursor-pointer'
                          }`}
                        >
                          <span className={`absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${selectedSlot === s.slotId ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {s.bookedCount ?? 0}/{s.capacity}
                          </span>
                          <div className="flex items-center justify-between mb-2">
                            <div className={`font-bold text-sm ${selectedSlot === s.slotId ? 'text-white' : 'text-gray-900'}`}>
                              {s.startTime} – {s.endTime}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-1.5 items-center">
                            {s.meetingType === 'both' ? (
                              <div className="w-full">
                                <div className="text-xs text-gray-600 mb-1.5 font-medium">{t('bookingSchedules.format.label')}</div>
                                <div className="flex space-x-1.5">
                                  <div
                                    data-format="offline"
                                    data-slot={s.slotId}
                                    onClick={(e) => {
                                      if (isDisabled) return
                                      e.stopPropagation()
                                      setSelectedSlot(s.slotId)
                                      setSelectedFormat('offline')
                                    }}
                                    className={`format-option border rounded-md px-2 py-1 text-center flex-1 ${
                                      isDisabled
                                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : selectedSlot === s.slotId && selectedFormat === 'offline'
                                          ? 'border-blue-200 bg-blue-600 text-white cursor-pointer'
                                          : 'border-blue-200 bg-white text-gray-700 cursor-pointer hover:bg-blue-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center space-x-1">
                                      {isDisabled ? (
                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                      ) : (
                                        <svg className={`w-3 h-3 ${selectedSlot === s.slotId && selectedFormat === 'offline' ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                      )}
                                      <span className={`text-xs font-semibold ${selectedSlot === s.slotId && selectedFormat === 'offline' ? 'text-white' : 'text-gray-700'}`}>{t('bookingSchedules.format.offline')}</span>
                                    </div>
                                  </div>

                                  <div
                                    data-format="online"
                                    data-slot={s.slotId}
                                    onClick={(e) => {
                                      if (isDisabled) return
                                      e.stopPropagation()
                                      setSelectedSlot(s.slotId)
                                      setSelectedFormat('online')
                                    }}
                                    className={`format-option border border-green-200 rounded-md px-2 py-1 text-center flex-1 ${
                                      isDisabled
                                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : selectedSlot === s.slotId && selectedFormat === 'online'
                                          ? 'bg-green-600 text-white cursor-pointer'
                                          : 'bg-white cursor-pointer hover:bg-green-50' 
                                    }`}
                                  >
                                    <div className="flex items-center justify-center space-x-1">
                                      {isDisabled ? (
                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                      ) : (
                                        <svg className={`w-3 h-3 ${selectedSlot === s.slotId && selectedFormat === 'online' ? 'text-white' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18" />
                                        </svg>
                                      )}
                                      <span className={`text-xs font-semibold ${selectedSlot === s.slotId && selectedFormat === 'online' ? 'text-white' : 'text-gray-700'}`}>{t('bookingSchedules.format.online')}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${selectedSlot === s.slotId ? 'bg-white/20 text-white' : s.meetingType === 'online' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {s.meetingType === 'online' ? t('bookingSchedules.format.online') : t('bookingSchedules.format.offline')}
                              </span>
                            )}
                          </div>

                          {selectedSlot === s.slotId && selectedFormat === 'online' && (
                                <div className="text-xs text-white/90 cursor-pointer flex items-center font-medium mt-2 underline">
                              {s.meetingType === 'online' ? '' : ''}
                            </div>
                          )}
                          
                          {!s.isOpen && (
                            <div className="text-xs text-red-500 font-medium mt-1">
                              {t('bookingSchedules.unavailable')}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Afternoon */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('bookingSchedules.afternoon')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {groupedSlots.afternoon.map((s) => {
                        const isDisabled = !s.isOpen || ((s.bookedCount ?? 0) >= s.capacity)
                        
                        return (
                        <div
                          key={s.slotId}
                          onClick={() => {
                            if (isDisabled) return // Block clicking on disabled slots
                            setSelectedSlot(s.slotId)
                            setSelectedFormat(s.meetingType === 'online' ? 'online' : 'offline')
                          }}
                          className={`relative rounded-lg p-3 transition-all ${
                            isDisabled
                              ? 'bg-gray-100 border-2 border-gray-200 opacity-60 cursor-not-allowed'
                              : selectedSlot === s.slotId
                                ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md cursor-pointer'
                                : 'bg-white border-2 border-gray-200 hover:shadow-md hover:border-blue-300 cursor-pointer'
                          }`}
                        >
                          <span className={`absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${selectedSlot === s.slotId ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {s.bookedCount ?? 0}/{s.capacity}
                          </span>
                          <div className="flex items-center justify-between mb-2">
                            <div className={`font-bold text-sm ${selectedSlot === s.slotId ? 'text-white' : 'text-gray-900'}`}>
                              {s.startTime} – {s.endTime}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-1.5 items-center">
                            {s.meetingType === 'both' ? (
                              <div className="w-full">
                                <div className="text-xs text-gray-600 mb-1.5 font-medium">{t('bookingSchedules.format.label')}</div>
                                <div className="flex space-x-1.5">
                                  <div
                                    data-format="offline"
                                    data-slot={s.slotId}
                                    onClick={(e) => {
                                      if (isDisabled) return
                                      e.stopPropagation()
                                      setSelectedSlot(s.slotId)
                                      setSelectedFormat('offline')
                                    }}
                                    className={`format-option border border-blue-200 rounded-md px-2 py-1 text-center flex-1 ${
                                      isDisabled
                                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : selectedSlot === s.slotId && selectedFormat === 'offline'
                                          ? 'bg-blue-600 text-white cursor-pointer'
                                          : 'bg-white cursor-pointer hover:bg-blue-50' 
                                    }`}
                                  >
                                    <div className="flex items-center justify-center space-x-1">
                                      {isDisabled ? (
                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                      ) : (
                                        <svg className={`w-3 h-3 ${selectedSlot === s.slotId && selectedFormat === 'offline' ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                      )}
                                      <span className={`text-xs font-semibold ${selectedSlot === s.slotId && selectedFormat === 'offline' ? 'text-white' : 'text-gray-700'}`}>{t('bookingSchedules.format.offline')}</span>
                                    </div>
                                  </div>

                                  <div
                                    data-format="online"
                                    data-slot={s.slotId}
                                    onClick={(e) => {
                                      if (isDisabled) return
                                      e.stopPropagation()
                                      setSelectedSlot(s.slotId)
                                      setSelectedFormat('online')
                                    }}
                                    className={`format-option border border-green-200 rounded-md px-2 py-1 text-center flex-1 ${
                                      isDisabled
                                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : selectedSlot === s.slotId && selectedFormat === 'online'
                                          ? 'bg-green-600 text-white cursor-pointer'
                                          : 'bg-white cursor-pointer hover:bg-green-50' 
                                    }`}
                                  >
                                    <div className="flex items-center justify-center space-x-1">
                                      {isDisabled ? (
                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                      ) : (
                                        <svg className={`w-3 h-3 ${selectedSlot === s.slotId && selectedFormat === 'online' ? 'text-white' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18" />
                                        </svg>
                                      )}
                                      <span className={`text-xs font-semibold ${selectedSlot === s.slotId && selectedFormat === 'online' ? 'text-white' : 'text-gray-700'}`}>{t('bookingSchedules.format.online')}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  selectedSlot === s.slotId ? 'bg-white/20 text-white' : s.meetingType === 'online' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {s.meetingType === 'online' ? t('bookingSchedules.format.online') : t('bookingSchedules.format.offline')}
                              </span>
                            )}
                          </div>
                            {selectedSlot === s.slotId && selectedFormat === 'online' && (
                            <div className="text-xs text-white/90 cursor-pointer flex items-center font-medium mt-2 underline">
                              {s.meetingType === 'online' ? t('bookingSchedules.linkReminder') : ''}
                            </div>
                          )}
                          
                          {!s.isOpen && (
                            <div className="text-xs text-red-500 font-medium mt-1">
                              {t('bookingSchedules.unavailable')}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Evening */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                      {t('bookingSchedules.evening')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {groupedSlots.evening.map((s) => {
                        const isDisabled = !s.isOpen || ((s.bookedCount ?? 0) >= s.capacity)
                        
                        return (
                        <div
                          key={s.slotId}
                          onClick={() => {
                            if (isDisabled) return // Block clicking on disabled slots
                            setSelectedSlot(s.slotId)
                            setSelectedFormat(s.meetingType === 'online' ? 'online' : 'offline')
                          }}
                          className={`relative rounded-lg p-3 transition-all ${
                            isDisabled
                              ? 'bg-gray-100 border-2 border-gray-200 opacity-60 cursor-not-allowed'
                              : selectedSlot === s.slotId
                                ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md cursor-pointer'
                                : 'bg-white border-2 border-gray-200 hover:shadow-md hover:border-blue-300 cursor-pointer'
                          }`}
                        >
                          <span className={`absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${selectedSlot === s.slotId ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {s.bookedCount ?? 0}/{s.capacity}
                          </span>
                          <div className="flex items-center justify-between mb-2">
                            <div className={`font-bold text-sm ${selectedSlot === s.slotId ? 'text-white' : 'text-gray-900'}`}>
                              {s.startTime} – {s.endTime}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-1.5 items-center">
                            {s.meetingType === 'both' ? (
                              <div className="w-full">
                                <div className="text-xs text-gray-600 mb-1.5 font-medium">{t('bookingSchedules.format.label')}</div>
                                <div className="flex space-x-1.5">
                                  <div
                                    data-format="offline"
                                    data-slot={s.slotId}
                                    onClick={(e) => {
                                      if (isDisabled) return
                                      e.stopPropagation()
                                      setSelectedSlot(s.slotId)
                                      setSelectedFormat('offline')
                                    }}
                                    className={`format-option border border-blue-200 rounded-md px-2 py-1 text-center flex-1 ${
                                      isDisabled
                                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : selectedSlot === s.slotId && selectedFormat === 'offline'
                                          ? 'bg-blue-600 text-white cursor-pointer'
                                          : 'bg-white cursor-pointer hover:bg-blue-50' 
                                    }`}
                                  >
                                    <div className="flex items-center justify-center space-x-1">
                                      {isDisabled ? (
                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                      ) : (
                                        <svg className={`w-3 h-3 ${selectedSlot === s.slotId && selectedFormat === 'offline' ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                      )}
                                      <span className={`text-xs font-semibold ${selectedSlot === s.slotId && selectedFormat === 'offline' ? 'text-white' : 'text-gray-700'}`}>{t('bookingSchedules.format.offline')}</span>
                                    </div>
                                  </div>

                                  <div
                                    data-format="online"
                                    data-slot={s.slotId}
                                    onClick={(e) => {
                                      if (isDisabled) return
                                      e.stopPropagation()
                                      setSelectedSlot(s.slotId)
                                      setSelectedFormat('online')
                                    }}
                                    className={`format-option border border-green-200 rounded-md px-2 py-1 text-center flex-1 ${
                                      isDisabled
                                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : selectedSlot === s.slotId && selectedFormat === 'online'
                                          ? 'bg-green-600 text-white cursor-pointer'
                                          : 'bg-white cursor-pointer hover:bg-green-50' 
                                    }`}
                                  >
                                    <div className="flex items-center justify-center space-x-1">
                                      <svg className={`w-3 h-3 ${selectedSlot === s.slotId && selectedFormat === 'online' ? 'text-white' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      <span className={`text-xs font-semibold ${selectedSlot === s.slotId && selectedFormat === 'online' ? 'text-white' : 'text-gray-700'}`}>{t('bookingSchedules.format.online')}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  selectedSlot === s.slotId ? 'bg-white/20 text-white' : s.meetingType === 'online' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {s.meetingType === 'online' ? t('bookingSchedules.format.online') : t('bookingSchedules.format.offline')}
                              </span>
                            )}
                          </div>
                          {selectedSlot === s.slotId && selectedFormat === 'online' && (
                            <div className="text-xs text-white/90 cursor-pointer flex items-center font-medium mt-2 underline">
                              {s.meetingType === 'online' ? t('bookingSchedules.linkReminder') : ''}
                            </div>
                          )}
                          
                          {!s.isOpen && (
                            <div className="text-xs text-red-500 font-medium mt-1">
                              {t('bookingSchedules.unavailable')}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                    <button
                      onClick={goToStep1}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                      disabled
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>{t('bookingSchedules.back')}</span>
                    </button>

                    <div className="text-xs text-gray-500 font-semibold">
                      <span>{t('bookingSchedules.stepLabel', { current: currentStep, total: 2 })}</span>
                    </div>

                    <button
                      onClick={goToStep2}
                      disabled={groupedTotal === 0}
                      className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-1.5 transition-all active:scale-95 text-xs ${groupedTotal === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:shadow-lg text-white'}`}
                    >
                      <span>{t('bookingSchedules.continue')}</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                </>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div id="step2" className="animate-in fade-in duration-300">
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 mb-3 shadow">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5">{t('bookingSchedules.step.confirm')}</h1>
                  <p className="text-xs sm:text-sm text-gray-600">{t('bookingSchedules.confirmSubtitle')}</p>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 sm:p-5 mb-4 text-white shadow-lg animate-in slide-in-from-bottom duration-500">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="inline-flex items-center px-2 py-1 bg-white/20 rounded-lg text-xs font-semibold mb-2 backdrop-blur-sm">
                        {t('bookingSchedules.summarySession')}
                      </div>
                      <h2 className="text-base sm:text-lg font-bold mb-1">
                        {(() => {
                          const slot = slotDetails?.slot ?? slotDetails
                          const instructorFromSlot = slot?.week?.instructor?.account?.profile?.full_name
                          const advisorName = studentInfo?.advisor?.fullName || studentInfo?.advisor?.full_name
                          return (
                            instructorFromSlot ||
                            instructorProfile?.full_name ||
                            advisorName ||
                            (instructorProfile
                              ? (instructorProfile.full_name || instructorProfile.employee_code || (instructorProfile.instructor_id ? t('bookingSchedules.advisor.withId', { id: instructorProfile.instructor_id }) : t('bookingSchedules.advisor.label')))
                              : activeInstructorId
                                ? t('bookingSchedules.advisor.withId', { id: activeInstructorId })
                                : t('bookingSchedules.advisor.label'))
                          )
                        })()}
                      </h2>
                      <p className="text-white/90 text-xs">
                        {(() => {
                          const slot = slotDetails?.slot ?? slotDetails
                          return slot?.week?.instructor?.academic_title || instructorProfile?.academic_title || instructorProfile?.position || t('bookingSchedules.advisor.role')
                        })()}
                      </p>
                    </div>
                    
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="text-xs opacity-90 mb-1">{t('bookingSchedules.summary.date')}</div>
                      <div className="font-bold text-xs">
                        {chosenDate ? new Date(chosenDate.date).toLocaleDateString(i18n.language) : ''}
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="text-xs opacity-90 mb-1">{t('bookingSchedules.summary.time')}</div>
                      <div className="font-bold text-xs">{chosenSlot ? `${chosenSlot.startTime} – ${chosenSlot.endTime}` : ''}</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="text-xs opacity-90 mb-1">{t('bookingSchedules.summary.format')}</div>
                      <div className="font-bold text-xs">{selectedFormat === 'online' ? t('bookingSchedules.format.online') : t('bookingSchedules.format.offline')}</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="text-xs opacity-90 mb-1">{t('bookingSchedules.summary.purpose')}</div>
                      <div className="font-bold text-xs truncate" title={selectedPurposeLabel}>
                        {selectedPurposeLabel}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-3 mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 animate-in slide-in-from-bottom delay-100 duration-500">
                    <div className="flex items-start">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-2 mr-3">
                        {isOnlineFormat ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-700 mb-1.5">{participationLabel}</div>
                        <div
                          className={`text-xs font-semibold flex items-center mb-2 ${participationCopyValue ? 'text-blue-600 hover:underline' : 'text-gray-500'}`}
                        >
                          {participationValue}
                        </div>
                        <button
                          onClick={() => {
                            if (participationCopyValue) copyToClipboard(participationCopyValue)
                          }}
                          disabled={!participationCopyValue}
                          className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all active:scale-95 ${
                            participationCopyValue
                              ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:shadow-lg'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {participationCopyValue ? (isOnlineFormat ? t('bookingSchedules.participation1.copyLink') : t('bookingSchedules.participation1.copyLocation')) : t('bookingSchedules.participation1.noCopyInfo')}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 animate-in slide-in-from-bottom delay-200 duration-500">
                    <div className="flex items-start">
                      <div className="bg-purple-600 rounded-lg p-2 mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 space-y-2">
                              <label className="text-xs font-semibold text-gray-700 block">{t('bookingSchedules.purposeLabel')}</label>
                        <select
                          value={meetingPurpose}
                          onChange={(e) => {
                            setMeetingPurpose(e.target.value)
                            if (e.target.value !== 'other') setCustomPurpose('')
                          }}
                          className="w-full border border-purple-300 rounded-lg text-xs px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-700 font-medium"
                        >
                          {PURPOSE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {meetingPurpose === 'other' && (
                          <input
                            type="text"
                            value={customPurpose}
                            onChange={(e) => setCustomPurpose(e.target.value)}
                            placeholder={t('bookingSchedules.placeholder.enterPurpose')}
                            className="w-full border border-purple-300 rounded-lg text-xs px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-700 font-medium"
                          />
                        )}
                        {meetingPurpose === 'other' && customPurpose.trim().length === 0 && (
                          <p className="text-[11px] text-purple-700">{t('bookingSchedules.validation.enterSpecificPurpose')}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 animate-in slide-in-from-bottom delay-300 duration-500">
                    <div className="flex items-start">
                      <div className="bg-emerald-600 rounded-lg p-2 mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-700 mb-2">{t('bookingSchedules.studentInfo.title')}</div>
                        <div className="space-y-1.5 text-xs">
                          {studentInfo ? (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">{t('bookingSchedules.studentInfo.fullName')}</span>
                                <span className="font-bold text-gray-900">{studentInfo.fullName || studentInfo.full_name || '—'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">{t('bookingSchedules.studentInfo.studentCode')}</span>
                                <span className="font-bold text-gray-900">{studentInfo.studentCode || studentInfo.student_code || '—'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">{t('bookingSchedules.studentInfo.class')}</span>
                                <span className="font-bold text-gray-900">{studentInfo.className || '—'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">{t('bookingSchedules.studentInfo.status')}</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  {studentInfo.verified || studentInfo.status === 'active' ? t('bookingSchedules.studentInfo.verified') : t('bookingSchedules.studentInfo.unverified')}
                                </span>
                              </div>
                              {isParentRole && linkedStudents.length > 0 && (
                                <div className="mt-3 w-full text-left">
                                  <label className="text-[11px] font-medium text-gray-600 block mb-1">{t('bookingSchedules.parent.selectStudentLabel')}</label>
                                  <select
                                    value={selectedStudentId ?? ''}
                                    onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full border border-emerald-200 rounded-lg text-xs px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-700"
                                  >
                                    <option value="" disabled>{t('bookingSchedules.parent.selectStudentPlaceholder')}</option>
                                    {linkedStudents.map((st) => (
                                      <option key={st.studentId} value={st.studentId}>
                                        {st.fullName || st.full_name || st.student_code}
                                      </option>
                                    ))}
                                  </select>
                                  {!isStudentSelectionValid && (
                                    <p className="text-[11px] text-emerald-700 mt-1">{t('bookingSchedules.parent.selectionRequiredText')}</p>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="text-sm text-gray-700">{t('bookingSchedules.noStudentInfo')}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isParentRole && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 animate-in slide-in-from-bottom delay-350 duration-500">
                      <div className="flex items-start">
                        <div className="bg-amber-500 rounded-lg p-2 mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm6 4a6 6 0 10-12 0 6 6 0 0012 0zM8 12a4 4 0 11-8 0 4 4 0 018 0zm2 4a6 6 0 00-12 0 6 6 0 006 6h2"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700">{t('bookingSchedules.parent.contactInfoTitle')}</span>
                            <span className="text-[11px] text-amber-700">{t('bookingSchedules.parent.contactEditableNote')}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-medium text-gray-600 block mb-1">{t('bookingSchedules.parent.nameLabel')}</label>
                              <input
                                type="text"
                                value={contactFields.name}
                                onChange={onContactFieldChange('name')}
                                placeholder={t('bookingSchedules.parent.placeholder.name')}
                                className="w-full border border-amber-300 rounded-lg text-xs px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-700"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-medium text-gray-600 block mb-1">{t('bookingSchedules.parent.phoneLabel')}</label>
                              <input
                                    type="text"
                                    value={customPurpose}
                                    onChange={(e) => setCustomPurpose(e.target.value)}
                                    placeholder={t('bookingSchedules.placeholder.enterPurpose')}
                                    className="w-full border border-purple-200 rounded-lg text-xs px-3 py-2 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-white text-gray-700"
                                  />
                            </div>
                            <div>
                              <label className="text-[11px] font-medium text-gray-600 block mb-1">{t('bookingSchedules.parent.emailLabel')}</label>
                              <input
                                type="email"
                                value={contactFields.email}
                                onChange={onContactFieldChange('email')}
                                placeholder="phuhuynh@email.com"
                                className="w-full border border-amber-300 rounded-lg text-xs px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-700"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-medium text-gray-600 block mb-1">{t('bookingSchedules.parent.relationshipLabel')}</label>
                              <input
                                type="text"
                                value={contactFields.relationship}
                                onChange={onContactFieldChange('relationship')}
                                placeholder={t('bookingSchedules.parent.placeholder.relationshipExample')}
                                className="w-full border border-amber-300 rounded-lg text-xs px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-700"
                              />
                            </div>
                          </div>
                          {!isContactValid && (
                            <p className="text-[11px] text-amber-700">{t('bookingSchedules.validation.enterParentName')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 shadow-sm mb-4 animate-in slide-in-from-bottom delay-300 duration-500">
                  <label className="flex items-start space-x-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={confirmChecked}
                      onChange={(e) => toggleConfirm(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs text-gray-700 leading-relaxed">
                      {t('bookingSchedules.confirmationPrefix')}{' '}
                      <span className="text-blue-600 font-bold">{t('bookingSchedules.confirmationPolicy')}</span>. {t('bookingSchedules.confirmationSuffix')}
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={goToStep1}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold flex items-center space-x-1.5 transition-all text-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>{t('bookingSchedules.back')}</span>
                  </button>

                  <div className="text-xs text-gray-500 font-semibold">
                    <span>{t('bookingSchedules.stepLabel', { current: 2, total: 2 })}</span>
                  </div>

                  <button
                    onClick={onConfirm}
                    disabled={!canConfirm}
                    className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-1.5 transition-all text-xs active:scale-95 ${
                      canConfirm ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                      <span>{isBooking ? t('bookingSchedules.processing') : t('bookingSchedules.bookButton')}</span>
                  </button>
                  {hasBookedSelectedSlot && (
                    <p className="text-[11px] text-amber-700 mt-2 text-right">
                      {t('bookingSchedules.toast.slotAlreadyBooked')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="mb-5 animate-bounce">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{t('bookingSchedules.success')}</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
              {t('bookingSchedules.successDescription', {
                date: chosenDate ? new Date(chosenDate.date).toLocaleDateString(i18n.language || 'en-US') : '',
                time: chosenSlot ? `${chosenSlot.startTime} – ${chosenSlot.endTime}` : '',
              })}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 animate-in slide-in-from-bottom delay-100 duration-500">
              <div className="flex items-start text-left">
                <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                  <div className="text-xs sm:text-sm text-gray-700">
                  <p className="font-bold text-gray-900 mb-1.5">{t('bookingSchedules.success')}</p>
                  <p className="text-gray-600">{t('bookingSchedules.successInfo')}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false)
                navigate('/appointments')
              }}
              className="w-full px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:shadow-xl text-white rounded-xl font-bold transition-all text-sm active:scale-95"
            >
              {t('bookingSchedules.back')}
            </button>
          </div>
        </div>
      )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </div>
  )
}




