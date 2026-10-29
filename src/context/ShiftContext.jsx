import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getCurrentShift, openShift, closeShift } from '../services/shiftService';

const ShiftContext = createContext();

export const ShiftProvider = ({ children }) => {
  const { user, profile } = useAuth();
  const [activeShift, setActiveShift] = useState(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [lastClosedShift, setLastClosedShift] = useState(null);

  const refreshActiveShift = async () => {
    if (!user) {
      setActiveShift(null);
      setLoadingShift(false);
      return;
    }
    setLoadingShift(true);
    try {
      // Ambil shift yang berstatus 'open'
      const shift = await getCurrentShift(user?.id);
      setActiveShift(shift);
    } catch (err) {
      console.error('Gagal mengambil shift aktif:', err);
    } finally {
      setLoadingShift(false);
    }
  };

  useEffect(() => {
    refreshActiveShift();
  }, [user]);

  const openNewShift = async (startingCash, notes) => {
    try {
      const shift = await openShift({
        cashierId: user?.id,
        startingCash,
        notes,
      });
      setActiveShift(shift);
      setShowOpenShiftModal(false);
      return { success: true, data: shift };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const closeActiveShift = async (actualCash, notes) => {
    if (!activeShift) return { success: false, error: 'Tidak ada shift aktif' };
    try {
      const closed = await closeShift({
        shiftId: activeShift.id,
        actualCash,
        notes,
      });
      setLastClosedShift(closed);
      setActiveShift(null);
      setShowCloseShiftModal(false);
      return { success: true, data: closed };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <ShiftContext.Provider
      value={{
        activeShift,
        loadingShift,
        refreshActiveShift,
        openNewShift,
        closeActiveShift,
        showOpenShiftModal,
        setShowOpenShiftModal,
        showCloseShiftModal,
        setShowCloseShiftModal,
        lastClosedShift,
        setLastClosedShift,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
};

export const useShift = () => useContext(ShiftContext);

