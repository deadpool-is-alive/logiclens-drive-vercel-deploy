'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { useIsAuthenticated } from '@/lib/use-is-authenticated';
import { FolderOpen, LogOut, LogIn } from 'lucide-react';

export function Navbar() {
    const router = useRouter();
    const loggedIn = useIsAuthenticated();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-[var(--line)] bg-[var(--paper)]/80 backdrop-blur-lg supports-[backdrop-filter]:bg-[var(--paper)]/60">
            <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-6">
                <div className="flex gap-6 items-center">
                    <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold text-[var(--ink)] hover:opacity-80 transition-opacity">
                        <FolderOpen className="h-5 w-5 text-[var(--teal)]" />
                        DAM System
                    </Link>
                    <div className="hidden md:flex gap-1">
                        <Link href="/search" className="px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)] rounded-md transition-colors">
                            Search
                        </Link>
                        {loggedIn && (
                            <>
                                <Link href="/admin" className="px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)] rounded-md transition-colors">
                                    Admin
                                </Link>
                                <Link href="/trash" className="px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)] rounded-md transition-colors">
                                    Trash
                                </Link>
                            </>
                        )}
                    </div>
                </div>
                
                {loggedIn ? (
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] px-3 py-1.5 hover:bg-[var(--line)] rounded-md transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Log out
                    </button>
                ) : (
                    <Link 
                        href="/login" 
                        className="flex items-center gap-2 text-sm font-medium bg-[var(--ink)] text-[var(--paper)] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <LogIn className="h-4 w-4" />
                        Log in
                    </Link>
                )}
            </div>
        </nav>
    );
}