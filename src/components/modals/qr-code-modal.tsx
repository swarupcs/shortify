'use client';
import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Download, Loader2, QrCode } from 'lucide-react';

interface QRCodeModalProps { isOpen: boolean; onOpenChange: (open: boolean) => void; url: string; shortCode: string; }

export function QRCodeModal({ isOpen, onOpenChange, url, shortCode }: QRCodeModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string|null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generateQRCode = useCallback(async () => {
    if (!url) return; setIsGenerating(true);
    try { const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } }); setQrCodeDataUrl(dataUrl); }
    catch (error) { console.error('Failed to generate QR code', error); toast.error('Failed to generate QR code'); }
    finally { setIsGenerating(false); }
  }, [url]);
  useEffect(() => { if (isOpen && url) generateQRCode(); }, [isOpen, url, generateQRCode]);
  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a'); link.href = qrCodeDataUrl; link.download = `shortlink-${shortCode}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link); toast.success('QR code downloaded');
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm rounded-2xl'>
        <DialogHeader><div className='flex items-center gap-2'><div className='size-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'><QrCode className='size-4' /></div><DialogTitle>QR Code</DialogTitle></div></DialogHeader>
        <div className='flex flex-col items-center gap-4 py-2'>
          {isGenerating ? (
            <div className='flex items-center justify-center w-[300px] h-[300px] rounded-xl border border-border/60 bg-muted/30'><Loader2 className='size-6 animate-spin text-violet-600 dark:text-violet-400' /></div>
          ) : qrCodeDataUrl ? (
            <>
              <div className='rounded-xl overflow-hidden border border-border/60 p-3 bg-white'><Image src={qrCodeDataUrl} alt='QR code' width={280} height={280} unoptimized /></div>
              <p className='text-sm text-center text-muted-foreground px-2'>Scan to open <span className='font-mono text-violet-600 dark:text-violet-400'>/r/{shortCode}</span> on any device.</p>
              <Button onClick={downloadQRCode} className='w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'><Download className='size-4 mr-2' />Download QR Code</Button>
            </>
          ) : (
            <div className='flex items-center justify-center w-[300px] h-[300px] rounded-xl border border-border/60 bg-muted/30 text-muted-foreground text-sm'>Failed to generate QR code</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
