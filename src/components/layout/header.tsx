'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '../ui/button';
import {
  BarChart3Icon,
  Link2Icon,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  UserPlus,
  Link2,
  Shield,
} from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { ThemeToggle } from '../ui/theme-toggle';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function Header() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const pathname = usePathname();

  const isDashboard = pathname === '/dashboard';

  return (
    <header className='sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl'>
      <div className='container mx-auto flex items-center justify-between h-14 px-4'>
        {/* ── Logo ── */}
        <Link
          href='/'
          className='flex items-center gap-2 font-bold text-lg group'
        >
          <div className='size-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white group-hover:scale-105 transition-transform'>
            <Link2 className='size-4' />
          </div>
          <span className='bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'>
            ShortLink
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className='hidden md:flex items-center gap-1'>
          {isAuthenticated ? (
            // Logged-in: single "Dashboard" link — sub-tabs live inside the page
            <Link
              href='/dashboard'
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isDashboard
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
            >
              <LayoutDashboard className='size-3.5' />
              Dashboard
            </Link>
          ) : (
            // Guest: public stats page only
            <Link
              href='/stats'
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname === '/stats'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
            >
              <BarChart3Icon className='size-3.5' />
              Stats
            </Link>
          )}
        </nav>

        {/* ── Desktop right: theme + user ── */}
        <div className='hidden md:flex items-center gap-2'>
          <ThemeToggle />

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className='flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors'>
                  <Avatar className='size-7'>
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback className='text-xs bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300'>
                      {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-sm font-medium max-w-[120px] truncate'>
                    {session?.user?.name || session?.user?.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuLabel>
                  <p className='font-medium'>{session?.user?.name}</p>
                  <p className='text-xs font-normal text-muted-foreground truncate'>
                    {session?.user?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Tab shortcuts live here — not in the top nav bar */}
                <DropdownMenuItem asChild>
                  <Link href='/dashboard' className='cursor-pointer'>
                    <Link2Icon className='size-4 mr-2' />
                    My Links
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href='/dashboard?tab=analytics'
                    className='cursor-pointer'
                  >
                    <BarChart3Icon className='size-4 mr-2' />
                    Analytics
                  </Link>
                </DropdownMenuItem>
                {session?.user?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href='/admin' className='cursor-pointer'>
                      <Shield className='size-4 mr-2' />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className='text-destructive focus:text-destructive cursor-pointer'
                >
                  <LogOut className='size-4 mr-2' />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className='flex items-center gap-2'>
              <Button variant='ghost' size='sm' asChild>
                <Link href='/login' className='flex items-center gap-1.5'>
                  <LogIn className='size-3.5' />
                  Login
                </Link>
              </Button>
              <Button
                size='sm'
                asChild
                className='bg-violet-600 hover:bg-violet-700 text-white'
              >
                <Link href='/register' className='flex items-center gap-1.5'>
                  <UserPlus className='size-3.5' />
                  Sign up
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <div className='flex items-center gap-2 md:hidden'>
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon' className='size-9'>
                <Menu className='size-5' />
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-72'>
              <SheetHeader>
                <SheetTitle className='flex items-center gap-2'>
                  <div className='size-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
                    <Link2 className='size-3.5' />
                  </div>
                  ShortLink
                </SheetTitle>
              </SheetHeader>
              <nav className='flex flex-col gap-1 mt-6'>
                {isAuthenticated ? (
                  <>
                    <SheetClose asChild>
                      <Link
                        href='/dashboard'
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isDashboard
                            ? 'bg-muted text-foreground'
                            : 'hover:bg-muted',
                        )}
                      >
                        <Link2Icon className='size-4' />
                        My Links
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href='/dashboard?tab=analytics'
                        className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors'
                      >
                        <BarChart3Icon className='size-4' />
                        Analytics
                      </Link>
                    </SheetClose>
                    {session?.user?.role === 'admin' && (
                      <SheetClose asChild>
                        <Link
                          href='/admin'
                          className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors'
                        >
                          <Shield className='size-4' />
                          Admin Panel
                        </Link>
                      </SheetClose>
                    )}
                    <div className='mt-2 pt-2 border-t border-border'>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className='flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors'
                      >
                        <LogOut className='size-4' />
                        Sign out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link
                        href='/stats'
                        className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors'
                      >
                        <BarChart3Icon className='size-4' />
                        Stats
                      </Link>
                    </SheetClose>
                    <div className='mt-4 flex flex-col gap-2'>
                      <SheetClose asChild>
                        <Link
                          href='/login'
                          className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors justify-center'
                        >
                          <LogIn className='size-4' />
                          Login
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href='/register'
                          className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors justify-center'
                        >
                          <UserPlus className='size-4' />
                          Create Account
                        </Link>
                      </SheetClose>
                    </div>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
