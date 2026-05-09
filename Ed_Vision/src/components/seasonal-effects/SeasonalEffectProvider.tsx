import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { SeasonalEvent, SeasonalConfig, SeasonalEffectContextType } from "./types";
import { SEASONAL_EVENTS } from "./types";

import { useAuth } from "@/hooks/useAuth";

const SeasonalEffectContext = createContext<SeasonalEffectContextType | null>(null);

export const useSeasonalEffect = () => {
  const context = useContext(SeasonalEffectContext);
  if (!context) {
    throw new Error("useSeasonalEffect must be used within SeasonalEffectProvider");
  }
  return context;
};

// Hàm kiểm tra xem ngày hiện tại có nằm trong khoảng event không
const isDateInRange = (startDate: string, endDate: string): boolean => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const currentMMDD = `${String(currentMonth).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`;

  // Handle year wrap (e.g., event from 12-20 to 01-05)
  if (startDate >endDate) {
    return currentMMDD >= startDate || currentMMDD <= endDate;
  }

  return currentMMDD >= startDate && currentMMDD <= endDate;
};

// Lấy event hiện tại dựa trên ngày
const getCurrentEvent = (): SeasonalConfig | null => {
  for (const event of SEASONAL_EVENTS) {
    if (event.active && isDateInRange(event.startDate, event.endDate)) {
      return event;
    }
  }
  return null;
};

interface SeasonalEffectProviderProps {
  children: React.ReactNode;
  forceEvent?: SeasonalEvent; // Để test, có thể force event cụ thể
}

export const SeasonalEffectProvider: React.FC<SeasonalEffectProviderProps>= ({
  children,
  forceEvent,
}) => {
  // Lấy trạng thái đăng nhập
  const { isAuthenticated } = useAuth();
  
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    // Mặc định BẬT hiệu ứng, lấy từ localStorage nếu user đã thay đổi
    // Sử dụng key mới để force reset giá trị cũ 
    const saved = localStorage.getItem("seasonal-effects-v2");
    // Nếu chưa có giá trị trong localStorage, mặc định là true (BẬT)
    // Nếu có giá trị, parse từ string "true"/"false"
return saved === null ? true : saved === "true";
  });

  const config = useMemo(() => {
    if (forceEvent) {
      return SEASONAL_EVENTS.find((e) =>e.event === forceEvent) || null;
    }
    return getCurrentEvent();
  }, [forceEvent]);

  const currentEvent = config?.event || "NONE";

  const toggleEffects = () => {
    setIsEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem("seasonal-effects-v2", String(newValue));
      return newValue;
    });
  };

  // Kiểm tra performance - chỉ áp dụng cho lần đầu tiên, KHÔNG override preference của user
  useEffect(() => {
    const checkPerformance = () => {
      // Chỉ kiểm tra nếu user CHƯA có preference trong localStorage
      const userPreference = localStorage.getItem("seasonal-effects-v2");
      if (userPreference !== null) {
        // User đã có preference, không tự động tắt
        return;
      }

      // Kiểm tra số lõi CPU và memory
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      // @ts-ignore - deviceMemory không có trong type mặc định
      const deviceMemory = navigator.deviceMemory || 4;

      if (hardwareConcurrency < 2 || deviceMemory < 2) {
        setIsEnabled(false);
        localStorage.setItem("seasonal-effects-v2", "false");
      }
    };

    checkPerformance();
  }, []);

  const renderEffects = () => {
    // CHỈ HIỂN THỊ KHI CHƯA LOGIN
    if (isAuthenticated || !isEnabled || !config) return null;

    switch (config.event) {
      case "CHRISTMAS":
        return null;
      // Thêm các event khác sau
      case "LUNAR_NEW_YEAR":
        // TODO: Thêm hiệu ứng Tết
        return null;
      case "HALLOWEEN":
        // TODO: Thêm hiệu ứng Halloween
        return null;
      default:
        return null;
    }
  };

  return (
    <SeasonalEffectContext.Provider
      value={{
        currentEvent,
        config,
        isEnabled,
        toggleEffects,
      }}
    >
      {renderEffects()}
      {children}
    </SeasonalEffectContext.Provider>);
};

export default SeasonalEffectProvider;
