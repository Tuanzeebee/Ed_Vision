import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/parent/Parent_card";
import { Button } from "@/components/ui/parent/Parent_button";
import ContinueButton from "@/components/ui/parent/Parent_ContinueButton";
import AppointmentHeader from "@/components/ui/parent/Parent_AppointmentHeader";
import ProgressStepper from "@/components/ui/parent/Parent_ProgressStepper";
import iconMeeting from "@/assets/parent/iconMeeting.svg";
import iconVideoCall from "@/assets/parent/iconVideoCall.svg";
import iconPhone from "@/assets/parent/iconPhone.svg";
import iconClock from "@/assets/parent/iconClock.svg";
import iconLocation from "@/assets/parent/iconLocation.svg";
import iconWifi from "@/assets/parent/iconWifi.svg";
import iconCheck from "@/assets/parent/iconCheck.svg";
import iconChevronLeft from "@/assets/parent/iconChevronLeft.svg";
import Header from "../../components/layout/Header";

type MeetingType = "in-person" | "video-call" | "phone-call";

type Props = {
  onContinue?: (selectedType: MeetingType) => void;
  onBack?: () => void;
  onClose?: () => void;
};

export default function BookAppointmentStep1({ onContinue, onBack, onClose }: Props) {
  const [selectedType, setSelectedType] = useState<MeetingType>("in-person");
  const { t } = useTranslation(['parent', 'common']);

  const meetingOptions = [
    {
      id: "in-person" as MeetingType,
      title: t('parent:bookAppointment.step1.inPersonTitle'),
      description: t('parent:bookAppointment.step1.inPersonDescription'),
      duration: t('parent:bookAppointment.step1.inPersonDuration'),
      location: t('parent:bookAppointment.step1.inPersonLocation'),
      icon: iconMeeting,
    },
    {
      id: "video-call" as MeetingType,
      title: t('parent:bookAppointment.step1.videoCallTitle'),
      description: t('parent:bookAppointment.step1.videoCallDescription'),
      duration: t('parent:bookAppointment.step1.videoCallDuration'),
      location: t('parent:bookAppointment.step1.videoCallLocation'),
      icon: iconVideoCall,
    },
    {
      id: "phone-call" as MeetingType,
      title: t('parent:bookAppointment.step1.phoneCallTitle'),
      description: t('parent:bookAppointment.step1.phoneCallDescription'),
      duration: t('parent:bookAppointment.step1.phoneCallDuration'),
      location: t('parent:bookAppointment.step1.phoneCallLocation'),
      icon: iconPhone,
    },
  ];

  const handleContinue = () => {
    onContinue?.(selectedType);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      <AppointmentHeader onClose={onClose} />

      {/* Progress Steps */}
      <ProgressStepper currentStep={1} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              {t('parent:bookAppointment.step1.title')}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {t('parent:bookAppointment.step1.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {meetingOptions.map((option) => (
              <div
                key={option.id}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedType === option.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedType(option.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4 mt-1">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedType === option.id
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedType === option.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <img src={option.icon} alt="" className="w-5 h-5 mr-3 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{option.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-3">{option.description}</p>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <img src={iconClock} alt="" className="w-3.5 h-3.5 mr-1" />
                        <span>{option.duration}</span>
                      </div>
                      <div className="flex items-center">
                        {option.id === "in-person" && <img src={iconLocation} alt="" className="w-3.5 h-3.5 mr-1" />}
                        {option.id === "video-call" && <img src={iconWifi} alt="" className="w-3.5 h-3.5 mr-1" />}
                        {option.id === "phone-call" && <img src={iconCheck} alt="" className="w-3.5 h-3.5 mr-1" />}
                        <span>{option.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={!onBack}
              className={`flex items-center ${!onBack ? 'opacity-50 cursor-not-allowed hover:cursor-not-allowed' : ''}`}
            >
              <img src={iconChevronLeft} alt="" className="w-4 h-4 mr-2" />
              {t('common:navigation.back')}
            </Button>
            <div className="text-sm text-gray-500">
              {t('parent:bookAppointment.progress', { current: 1, total: 4 })}
            </div>
            <ContinueButton onClick={handleContinue} />
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-500">
              <span>Need help?</span>
              <a href="#" className="ml-4 text-blue-600 hover:underline">
                Contact Support
              </a>
            </div>
            <div className="flex items-center text-gray-500">
              <span>Secure booking powered by University Portal</span>
              <svg className="w-4 h-4 ml-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
