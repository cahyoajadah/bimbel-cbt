// ============================================
// src/components/common/Modal.jsx
// ============================================
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md', // sm, md, lg, xl, full
  showCloseButton = true,
  footer,
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    // [UBAH INI] Gunakan viewport unit agar benar-benar full screen
    full: 'max-w-[98vw] w-full h-[95vh]', 
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          {/* Hapus p-4 jika mode full agar lebih maksimal, atau biarkan kecil */}
          <div className={clsx(
            "flex min-h-full items-center justify-center text-center",
            size === 'full' ? 'p-1' : 'p-4' 
          )}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={clsx(
                'transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all',
                'flex flex-col', // [PENTING] Agar header tetap di atas & body mengisi sisa tinggi
                sizes[size] || sizes.md
              )}>
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
                  <Dialog.Title className="text-lg font-bold leading-6 text-gray-900">
                    {title}
                  </Dialog.Title>
                  
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="rounded-full p-1 hover:bg-gray-200 transition-colors text-gray-500 focus:outline-none"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* CONTENT BODY */}
                <div className="flex-1 overflow-y-auto p-6 relative">
                  {children}
                </div>

                {/* FOOTER */}
                {footer && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2 shrink-0">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};