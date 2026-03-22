'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerUser } from '@/server/actions/auth/register';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type RegisterFormValues = z.infer<typeof registerSchema>;

function getStrength(password: string) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++; if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++; if (/[0-9]/.test(password)) score++; if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', password: '', confirmPassword: '' } });
  const password = form.watch('password');
  const strength = getStrength(password);

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true); setError(null);
    try {
      const formData = new FormData();
      formData.append('name', data.name); formData.append('email', data.email); formData.append('password', data.password);
      const response = await registerUser(formData);
      if (!response.success) { setError(response.error || 'Registration failed.'); return; }
      router.push('/login?registered=true');
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setIsLoading(false); }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField control={form.control} name='name' render={({ field }) => (
          <FormItem><FormLabel className='text-sm font-medium'>Full name</FormLabel><FormControl><Input {...field} placeholder='Alex Johnson' autoComplete='name' disabled={isLoading} className='h-11 rounded-xl' /></FormControl><FormMessage className='text-xs' /></FormItem>
        )} />
        <FormField control={form.control} name='email' render={({ field }) => (
          <FormItem><FormLabel className='text-sm font-medium'>Email</FormLabel><FormControl><Input {...field} type='email' placeholder='you@example.com' autoComplete='email' disabled={isLoading} className='h-11 rounded-xl' /></FormControl><FormMessage className='text-xs' /></FormItem>
        )} />
        <FormField control={form.control} name='password' render={({ field }) => (
          <FormItem>
            <FormLabel className='text-sm font-medium'>Password</FormLabel>
            <FormControl><div className='relative'><Input {...field} type={showPassword ? 'text' : 'password'} placeholder='Min. 6 characters' autoComplete='new-password' disabled={isLoading} className='h-11 rounded-xl pr-10' /><button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors' tabIndex={-1}>{showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}</button></div></FormControl>
            {password && (<div className='space-y-1.5 pt-1'><div className='flex gap-1'>{[1,2,3,4].map((l) => (<div key={l} className={cn('h-1 flex-1 rounded-full transition-all duration-300', strength.score >= l ? strength.color : 'bg-border')} />))}</div>{strength.label && (<p className='text-xs text-muted-foreground'>Password strength: <span className={cn('font-medium', strength.label==='Weak'&&'text-red-500', strength.label==='Fair'&&'text-amber-500', strength.label==='Good'&&'text-blue-500', strength.label==='Strong'&&'text-emerald-500')}>{strength.label}</span></p>)}</div>)}
            <FormMessage className='text-xs' />
          </FormItem>
        )} />
        <FormField control={form.control} name='confirmPassword' render={({ field }) => (
          <FormItem><FormLabel className='text-sm font-medium'>Confirm password</FormLabel><FormControl><div className='relative'><Input {...field} type={showConfirm ? 'text' : 'password'} placeholder='Re-enter your password' autoComplete='new-password' disabled={isLoading} className='h-11 rounded-xl pr-10' /><button type='button' onClick={() => setShowConfirm(!showConfirm)} className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors' tabIndex={-1}>{showConfirm ? <EyeOff className='size-4' /> : <Eye className='size-4' />}</button></div></FormControl><FormMessage className='text-xs' /></FormItem>
        )} />
        {error && (<div className='flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm'><svg className='size-4 shrink-0' viewBox='0 0 20 20' fill='currentColor'><path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' /></svg>{error}</div>)}
        <Button type='submit' disabled={isLoading} className='w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold border-0 shadow-none'>
          {isLoading && <Loader2 className='size-4 animate-spin mr-2' />}{isLoading ? 'Creating account…' : 'Create free account'}
        </Button>
      </form>
    </Form>
  );
}
