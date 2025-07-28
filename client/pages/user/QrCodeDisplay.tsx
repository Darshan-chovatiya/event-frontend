// components/QrCodeDisplay.tsx
import { Button } from '@/components/ui/button';
import { Download, QrCode } from 'lucide-react';

interface QrCodeDisplayProps {
  qrCodeUrl?: string;
  userId: string;
}

export const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({ qrCodeUrl, userId }) => {
  if (!qrCodeUrl) return null;

  return (
    <div className="mt-6 bg-gradient-to-r from-green-50/50 to-blue-50/50 rounded-2xl p-6 border border-green-100/50">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg mr-3">
          <QrCode className="h-4 w-4 text-white" />
        </div>
        Your QR Code
      </h3>
      <div className="flex flex-col items-center">
        <img 
          src={qrCodeUrl} 
          alt="User QR Code" 
          className="h-48 w-48 rounded-lg border-2 border-white shadow-lg bg-white p-2"
        />
        <div className="mt-4">
          <Button 
            variant="outline"
            onClick={() => {
              const link = document.createElement('a');
              link.href = qrCodeUrl;
              link.download = `qr-code-${userId}.png`;
              link.click();
            }}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download QR Code
          </Button>
        </div>
      </div>
    </div>
  );
};