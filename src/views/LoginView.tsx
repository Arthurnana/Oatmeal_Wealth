import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    try {
      setLoggingIn(true);
      setErrorMsg('');
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setErrorMsg('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#171918] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1E2120] rounded-3xl border border-[#E3E1DC] dark:border-white/10 p-8 sm:p-10 shadow-[0px_8px_30px_rgb(0,0,0,0.06)] text-center relative overflow-hidden">
        {/* Soft background ambient gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#BFECDD]/30 dark:bg-[#355E53]/20 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Brand Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#1C463C] text-white flex items-center justify-center shadow-md mb-5">
            <span className="material-symbols-outlined text-[32px]">nature_people</span>
          </div>

          <span className="text-xs uppercase tracking-widest text-[#126967] dark:text-[#A2EDEA] font-bold mb-2">
            Oatmeal Wealth • Personal Vault
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E292A] dark:text-white tracking-tight mb-3">
            จัดการเงินของคุณให้ง่ายขึ้น
          </h1>

          <p className="text-sm text-[#5A6567] dark:text-[#A0A8A5] leading-relaxed mb-8 max-w-xs">
            “บันทึกรายรับรายจ่าย วิเคราะห์การเงิน และวางแผนการใช้เงินในที่เดียว”
          </p>

          {errorMsg && (
            <div className="w-full mb-5 p-3 rounded-xl bg-[#FFDAD6] text-[#93000A] text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full py-3.5 px-6 rounded-2xl bg-white dark:bg-[#282C2A] hover:bg-[#F4F3F0] dark:hover:bg-[#323735] text-[#1E292A] dark:text-white border border-[#E3E1DC] dark:border-white/10 font-bold text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-md active:scale-98 transition-all"
          >
            {loggingIn ? (
              <div className="w-5 h-5 border-2 border-[#1C463C] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loggingIn ? 'กำลังเชื่อมต่อระบบ...' : 'เข้าสู่ระบบด้วย Google'}</span>
          </button>

          {/* Feature Badges */}
          <div className="mt-8 pt-6 border-t border-[#E3E1DC]/60 dark:border-white/10 w-full grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-[20px] text-[#1C463C] dark:text-[#BFECDD] mb-1">
                cloud_done
              </span>
              <span className="text-[11px] font-medium text-[#5A6567] dark:text-[#A0A8A5]">
                ระบบคลาวด์
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-[20px] text-[#126967] dark:text-[#A2EDEA] mb-1">
                lock
              </span>
              <span className="text-[11px] font-medium text-[#5A6567] dark:text-[#A0A8A5]">
                ปลอดภัย 100%
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-[20px] text-[#D97757] mb-1">
                devices
              </span>
              <span className="text-[11px] font-medium text-[#5A6567] dark:text-[#A0A8A5]">
                ทุกอุปกรณ์
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
