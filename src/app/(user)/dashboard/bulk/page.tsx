'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { shortenUrl } from '@/server/actions/urls/shorten-url';
import { Check, Copy, Download, Link2, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BulkResult { original: string; short: string|null; error: string|null; status: 'success'|'error'|'flagged'; }

export default function BulkShortenPage() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<BulkResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number|null>(null);

  const handleProcess = async () => {
    const lines = input.split('\n').map((l) => l.trim()).filter((l) => l.length > 0).slice(0, 20);
    if (lines.length === 0) { toast.error('Please enter at least one URL'); return; }
    setIsProcessing(true); setProgress(0); setResults([]);
    const newResults: BulkResult[] = [];
    for (let i = 0; i < lines.length; i++) {
      const url = lines[i]; setProgress(Math.round((i/lines.length)*100));
      try {
        const formData = new FormData(); formData.append('url', url);
        const response = await shortenUrl(formData);
        if (response.success && response.data) { newResults.push({ original: url, short: response.data.shortUrl, error: null, status: response.data.flagged ? 'flagged' : 'success' }); }
        else { newResults.push({ original: url, short: null, error: response.error || 'Failed to shorten', status: 'error' }); }
      } catch { newResults.push({ original: url, short: null, error: 'Unexpected error', status: 'error' }); }
      setResults([...newResults]);
    }
    setProgress(100); setIsProcessing(false);
    toast.success(`Processed ${lines.length} URL${lines.length !== 1 ? 's' : ''}`);
  };

  const copyResult = async (index: number, text: string) => { await navigator.clipboard.writeText(text); setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); };
  const copyAll = async () => { const successful = results.filter((r) => r.short).map((r) => `${r.original}\t${r.short}`).join('\n'); await navigator.clipboard.writeText(successful); toast.success('All results copied!'); };
  const downloadCSV = () => { const header = 'Original URL,Short URL,Status\n'; const rows = results.map((r) => `"${r.original}","${r.short||''}","${r.status}"`).join('\n'); const blob = new Blob([header+rows], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'shortened-urls.csv'; a.click(); URL.revokeObjectURL(url); };
  const urlCount = input.split('\n').map((l) => l.trim()).filter((l) => l.length > 0).length;

  return (
    <div className='container max-w-4xl mx-auto py-10 px-4'>
      <div className='mb-8'>
        <Link href='/dashboard' className='text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-4 w-fit'>← Back to Dashboard</Link>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'><div className='size-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'><Upload className='size-5' /></div>Bulk URL Shortener</h1>
        <p className='text-muted-foreground mt-2'>Shorten up to 20 URLs at once. Enter one URL per line.</p>
      </div>
      <div className='grid md:grid-cols-2 gap-6'>
        <Card className='border-border/60 rounded-2xl'>
          <CardHeader className='pb-3'><CardTitle className='text-base flex items-center gap-2'><Link2 className='size-4' />Input URLs</CardTitle><CardDescription>One URL per line, max 20 URLs</CardDescription></CardHeader>
          <CardContent className='space-y-4'>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={'https://example.com/long/url/1\nhttps://another.com/page/2'} className='min-h-[280px] font-mono text-xs resize-none' disabled={isProcessing} />
            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground'>{urlCount} URL{urlCount !== 1 ? 's' : ''} / 20 max</span>
              <Button onClick={handleProcess} disabled={isProcessing||urlCount===0} className='bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'>
                {isProcessing ? <><Loader2 className='size-4 mr-2 animate-spin' />Processing {progress}%</> : 'Shorten All'}
              </Button>
            </div>
            {isProcessing && <div className='h-1.5 bg-muted rounded-full overflow-hidden'><div className='h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300 rounded-full' style={{ width: `${progress}%` }} /></div>}
          </CardContent>
        </Card>
        <Card className='border-border/60 rounded-2xl'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div><CardTitle className='text-base'>Results</CardTitle><CardDescription>{results.length > 0 ? `${results.filter((r) => r.status==='success').length} succeeded, ${results.filter((r) => r.status==='error').length} failed` : 'Results will appear here'}</CardDescription></div>
              {results.length > 0 && <div className='flex items-center gap-2'><Button variant='outline' size='sm' onClick={copyAll} className='h-7 text-xs gap-1'><Copy className='size-3' />Copy All</Button><Button variant='outline' size='sm' onClick={downloadCSV} className='h-7 text-xs gap-1'><Download className='size-3' />CSV</Button></div>}
            </div>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-center'><div className='size-12 rounded-xl bg-muted flex items-center justify-center mb-3'><Link2 className='size-5 text-muted-foreground' /></div><p className='text-sm text-muted-foreground'>Enter URLs on the left and click &quot;Shorten All&quot;</p></div>
            ) : (
              <div className='space-y-2 max-h-[320px] overflow-y-auto pr-1'>
                {results.map((result, i) => (
                  <div key={i} className={cn('p-3 rounded-xl border text-xs space-y-1', result.status==='success'&&'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20', result.status==='flagged'&&'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20', result.status==='error'&&'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20')}>
                    <div className='flex items-center gap-1.5'>{result.status==='error' ? <X className='size-3 text-red-500 shrink-0' /> : <Check className='size-3 text-emerald-500 shrink-0' />}<span className='text-muted-foreground truncate flex-1'>{result.original}</span></div>
                    {result.short ? <div className='flex items-center gap-1.5 pl-4'><span className='font-mono font-medium text-violet-600 dark:text-violet-400 truncate flex-1'>{result.short}</span><button onClick={() => copyResult(i, result.short!)} className='shrink-0 text-muted-foreground hover:text-foreground transition-colors'>{copiedIndex===i ? <Check className='size-3 text-emerald-500' /> : <Copy className='size-3' />}</button></div>
                    : <p className='pl-4 text-red-600 dark:text-red-400'>{result.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
