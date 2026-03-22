'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  BarChart3,
  Key,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Settings,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/layout/mode-toggle';

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isOnDashboard = pathname.startsWith('/dashboard');

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-14 items-center justify-between gap-4'>
        {/* ── Logo ── */}
        <Link href='/' className='flex items-center gap-2 shrink-0'>
          <div className='size-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
            <Link2 className='size-3.5' />
          </div>
          <span className='font-bold text-base'>Shortify</span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className='hidden md:flex items-center gap-1'>
          {session?.user ? (
            <Link
              href='/dashboard'
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isOnDashboard
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href='/stats'
              className='px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
            >
              Stats
            </Link>
          )}
        </nav>

        {/* ── Right side ── */}
        <div className='flex items-center gap-2'>
          <ModeToggle />

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='relative size-8 rounded-full p-0'
                >
                  <Avatar className='size-8'>
                    <AvatarImage
                      src={session.user.image ?? undefined}
                      alt={session.user.name ?? 'User'}
                    />
                    <AvatarFallback className='text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'>
                      {session.user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-52'>
                <DropdownMenuLabel className='font-normal'>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium truncate'>
                      {session.user.name}
                    </span>
                    <span className='text-xs text-muted-foreground truncate'>
                      {session.user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href='/dashboard' className='flex items-center gap-2'>
                    <LayoutDashboard className='size-4' /> My Links
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href='/dashboard?tab=analytics'
                    className='flex items-center gap-2'
                  >
                    <BarChart3 className='size-4' /> Analytics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href='/dashboard?tab=settings'
                    className='flex items-center gap-2'
                  >
                    <Key className='size-4' /> API Keys
                  </Link>
                </DropdownMenuItem>
                {session.user.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href='/admin' className='flex items-center gap-2'>
                        <Shield className='size-4' /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='text-destructive focus:text-destructive cursor-pointer'
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className='size-4 mr-2' />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className='hidden md:flex items-center gap-2'>
              <Button variant='ghost' size='sm' asChild>
                <Link href='/login'>Sign in</Link>
              </Button>
              <Button
                size='sm'
                className='bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'
                asChild
              >
                <Link href='/register'>Get started</Link>
              </Button>
            </div>
          )}

          {/* ── Mobile menu ── */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon' className='md:hidden size-8'>
                <Menu className='size-4' />
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-64'>
              <div className='flex flex-col gap-1 mt-6'>
                {session?.user ? (
                  <>
                    <div className='flex items-center gap-3 px-3 py-2 mb-2'>
                      <Avatar className='size-8'>
                        <AvatarImage src={session.user.image ?? undefined} />
                        <AvatarFallback className='text-xs'>
                          {session.user.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>
                          {session.user.name}
                        </p>
                        <p className='text-xs text-muted-foreground truncate'>
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      href='/dashboard'
                      className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors'
                    >
                      <LayoutDashboard className='size-4' /> My Links
                    </Link>
                    <Link
                      href='/dashboard?tab=analytics'
                      className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors'
                    >
                      <BarChart3 className='size-4' /> Analytics
                    </Link>
                    <Link
                      href='/dashboard?tab=settings'
                      className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors'
                    >
                      <Key className='size-4' /> API Keys
                    </Link>
                    {session.user.role === 'admin' && (
                      <Link
                        href='/admin'
                        className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors'
                      >
                        <Shield className='size-4' /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors mt-2'
                    >
                      <LogOut className='size-4' /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href='/login'
                      className='px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors'
                    >
                      Sign in
                    </Link>
                    <Link
                      href='/register'
                      className='px-3 py-2 rounded-lg text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-muted transition-colors'
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
