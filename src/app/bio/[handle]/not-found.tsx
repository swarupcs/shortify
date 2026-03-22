import Link from 'next/link';
import { Link2 } from 'lucide-react';

export default function BioNotFound() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center px-4'>
      <div className='text-center'>
        <div className='size-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/20'>
          <Link2 className='size-8 text-white' />
        </div>
        <h1 className='text-2xl font-bold text-white mb-2'>Page not found</h1>
        <p className='text-white/70 text-sm mb-8 max-w-xs mx-auto'>
          This bio page doesn&apos;t exist or has been removed.
        </p>
        <Link
          href='/'
          className='inline-flex items-center gap-2 px-6 py-3 bg-white text-violet-700 font-semibold rounded-xl hover:bg-white/90 transition-colors text-sm'
        >
          Go to Shortify
        </Link>
      </div>
    </div>
  );
}
