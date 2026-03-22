import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Link2, Check } from 'lucide-react';

interface SignupSuggestionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  shortUrl: string;
}

export function SignupSuggestionDialog({
  isOpen,
  onOpenChange,
  shortUrl,
}: SignupSuggestionDialogProps) {
  const router = useRouter();

  const handleSignup = () => {
    onOpenChange(false);
    router.push('/register');
  };

  const handleSignin = () => {
    onOpenChange(false);
    router.push('/login');
  };

  const perks = [
    'Save all your shortened links',
    'Track link analytics',
    'Customize your shortened links',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md rounded-2xl'>
        <DialogHeader>
          <div className='flex items-center gap-2 mb-1'>
            <div className='size-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
              <Link2 className='size-4' />
            </div>
            <DialogTitle>URL Shortened Successfully!</DialogTitle>
          </div>
          <DialogDescription>
            Your link is ready to share. Create a free account to save and track
            it.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col space-y-4 py-2'>
          {/* Short URL display */}
          <div className='rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-3'>
            <p className='text-xs font-medium text-violet-600 dark:text-violet-400 mb-1'>
              Your shortened URL
            </p>
            <p className='break-all font-mono text-sm text-violet-700 dark:text-violet-300'>
              {shortUrl}
            </p>
          </div>

          {/* Perks list */}
          <div className='space-y-2'>
            <h4 className='text-sm font-medium text-foreground'>
              Create an account to:
            </h4>
            <ul className='space-y-1.5'>
              {perks.map((perk) => (
                <li
                  key={perk}
                  className='flex items-center gap-2 text-sm text-muted-foreground'
                >
                  <div className='size-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0'>
                    <Check className='size-2.5 text-emerald-600 dark:text-emerald-400' />
                  </div>
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className='flex flex-col sm:flex-row gap-2'>
          <Button
            variant='outline'
            className='sm:w-auto w-full border-border/60'
            onClick={() => onOpenChange(false)}
          >
            Maybe Later
          </Button>
          <Button
            variant='outline'
            className='sm:w-auto w-full border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30'
            onClick={handleSignin}
          >
            Log In
          </Button>
          <Button
            className='sm:w-auto w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'
            onClick={handleSignup}
          >
            Sign Up Free
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
