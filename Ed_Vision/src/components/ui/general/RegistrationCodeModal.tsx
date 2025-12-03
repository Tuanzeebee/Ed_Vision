import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  registrationCode: string;
  onRegister?: () => void;
};

export default function RegistrationCodeModal({
  isOpen,
  onClose,
  registrationCode,
  onRegister,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
        
        <div className="px-6 py-5 text-center border-b border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <i className="fas fa-key text-blue-600 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Mã đăng ký phụ huynh</h3>
          <p className="mt-2 text-sm text-gray-500">
            Sử dụng mã này để đăng ký tài khoản phụ huynh
          </p>
        </div>

        <div className="px-6 py-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-3">
                Mã đăng ký
              </p>
              <div className="bg-white rounded-lg px-6 py-5 shadow-sm">
                <p className="text-4xl font-bold text-gray-900 tracking-widest font-mono">
                  {registrationCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-center gap-3">
          <Button
            type="button"
            onClick={() => {
              onRegister?.();
              onClose();
            }}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <i className="fas fa-user-plus mr-2"></i>
            Đăng ký ngay
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
