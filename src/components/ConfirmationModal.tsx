import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  isDanger = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#202322] rounded-2xl border border-[#E3E1DC] dark:border-white/10 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isDanger ? 'bg-[#FFDBD0] text-[#71280E]' : 'bg-[#BFECDD] text-[#1C463C]'
          }`}>
            <span className="material-symbols-outlined text-[20px]">
              {isDanger ? 'warning' : 'help'}
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#1E292A] dark:text-white">{title}</h3>
        </div>

        <p className="text-sm text-[#5A6567] dark:text-[#A0A8A5] mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[#5A6567] hover:text-[#1E292A] dark:text-[#A0A8A5] dark:hover:text-white rounded-lg hover:bg-[#F1EFEA] dark:hover:bg-white/5 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg text-white shadow-xs transition-transform active:scale-95 ${
              isDanger
                ? 'bg-[#BA1A1A] hover:bg-[#93000A]'
                : 'bg-[#1C463C] hover:bg-[#355E53]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
