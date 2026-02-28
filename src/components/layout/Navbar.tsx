"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    BookOpen, Search, Bell, PenLine, BookMarked, Users,
    X, Loader2, Globe, Menu, Home, Image, ImageIcon, LogIn, LogOut, Crown
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession, signOut } from "next-auth/react";

interface SearchResult {
    notes: { id: string; title: string; category: string }[];
    books: { id: string; title: string; author: string; cover: string | null }[];
    gallery: { id: string; description: string | null; photoUrl: string }[];
}

interface Notification {
    id: string;
    type: string;
    title: string;
    subtitle?: string | null;
    href: string;
    isRead: boolean;
    createdAt: string;
}

function timeAgo(dateStr: string, lang: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (lang === "id") {
        if (m < 1) return "Baru saja";
        if (m < 60) return `${m} mnt lalu`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h} jam lalu`;
        return `${Math.floor(h / 24)} hari lalu`;
    } else {
        if (m < 1) return "Just now";
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    }
}

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { lang, setLang, t } = useLanguage();
    const { data: session } = useSession();
    const isLoggedIn = !!session?.user;
    const username = (session?.user as any)?.username as string | undefined;
    const role = (session?.user as any)?.role as string | undefined;

    // Mobile menu
    const [mobileOpen, setMobileOpen] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLInputElement>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [notifUnread, setNotifUnread] = useState(0);
    const notifRef = useRef<HTMLDivElement>(null);

    const doSearch = useCallback(async (q: string) => {
        if (!q || q.length < 2) { setSearchResults(null); setShowSearchDropdown(false); return; }
        setIsSearching(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const data: SearchResult = await res.json();
            setSearchResults(data);
            setShowSearchDropdown(true);
        } catch { setSearchResults(null); } finally { setIsSearching(false); }
    }, []);

    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => doSearch(searchQuery), 350);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [searchQuery, doSearch]);

    const fetchNotifications = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const res = await fetch("/api/notifications");
            const data: Notification[] = await res.json();
            setNotifications(data);
            setNotifUnread(data.filter(n => !n.isRead).length);
        } catch { /* silent */ }
    }, [isLoggedIn]);

    useEffect(() => {
        fetchNotifications();
        if (isLoggedIn) {
            const interval = setInterval(fetchNotifications, 15000);
            return () => clearInterval(interval);
        }
    }, [fetchNotifications, isLoggedIn]);

    const handleNotificationClick = async (href: string, id: string) => {
        // Optimistically mark as read locally
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setNotifUnread(prev => Math.max(0, prev - 1));

        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
        } catch (e) {
            console.error("Failed to mark notification as read", e);
        }

        setShowNotifPanel(false);
        router.push(href);
    };

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setNotifUnread(0);
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            });
        } catch (e) {
            console.error("Failed to mark all as read", e);
        }
    };

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchDropdown(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifPanel(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Close all on route change
    useEffect(() => {
        setShowSearchDropdown(false);
        setShowNotifPanel(false);
        setSearchQuery("");
        setMobileOpen(false);
        setMobileSearchOpen(false);
    }, [pathname]);

    // Focus mobile search input when opened
    useEffect(() => {
        if (mobileSearchOpen) setTimeout(() => mobileSearchRef.current?.focus(), 100);
    }, [mobileSearchOpen]);

    const handleSearchSelect = (href: string) => {
        setShowSearchDropdown(false);
        setSearchQuery("");
        setMobileSearchOpen(false);
        router.push(href);
    };

    const hasResults = searchResults && (searchResults.notes.length > 0 || searchResults.books.length > 0 || searchResults.gallery.length > 0);

    const navLinks = [
        { href: "/", key: "nav_home", Icon: Home },
        // Notes and Gallery are only for logged-in users
        ...(isLoggedIn ? [
            { href: "/notes", key: "nav_notes", Icon: PenLine },
        ] : []),
        { href: "/books", key: "nav_books", Icon: BookMarked },
        ...(isLoggedIn ? [
            { href: "/gallery", key: "nav_gallery", Icon: Image },
        ] : []),
    ];

    if (role === "king") {
        navLinks.push({ href: "/users", key: "nav_users", Icon: Users });
    }

    // Translation fallback for the new Users key
    const getNavLabel = (key: string) => {
        if (key === "nav_users") return "Users";
        return t(key);
    };

    // Shared search dropdown render
    const SearchDropdown = () => (
        <AnimatePresence>
            {showSearchDropdown && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                >
                    {!hasResults ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {lang === "id" ? `Tidak ada hasil untuk "${searchQuery}"` : lang === "jp" ? `"${searchQuery}" の結果はありません` : `No results for "${searchQuery}"`}
                        </div>
                    ) : (
                        <div className="max-h-[360px] overflow-y-auto">
                            {searchResults!.notes.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 flex items-center gap-1.5 border-b border-border">
                                        <PenLine className="h-3 w-3" /> {t("nav_notes")}
                                    </div>
                                    {searchResults!.notes.map((note) => (
                                        <button key={note.id} onClick={() => handleSearchSelect(`/notes/${note.id}`)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left">
                                            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <PenLine className="h-3.5 w-3.5 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium line-clamp-1">{note.title}</p>
                                                <p className="text-xs text-muted-foreground">{note.category}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {searchResults!.books.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 flex items-center gap-1.5 border-b border-border">
                                        <BookMarked className="h-3 w-3" /> {t("nav_books")}
                                    </div>
                                    {searchResults!.books.map((book) => (
                                        <button key={book.id} onClick={() => handleSearchSelect(`/books/${book.id}`)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left">
                                            {book.cover
                                                ? <img src={book.cover} alt={book.title} className="h-9 w-6 object-cover rounded-md shrink-0 border border-border" />
                                                : <div className="h-9 w-6 rounded-md bg-secondary/20 flex items-center justify-center shrink-0"><BookMarked className="h-3.5 w-3.5 text-secondary" /></div>}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                                                <p className="text-xs text-muted-foreground">{book.author}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {searchResults!.gallery && searchResults!.gallery.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 flex items-center gap-1.5 border-b border-border">
                                        <ImageIcon className="h-3 w-3" /> {lang === "id" ? "Galeri" : lang === "jp" ? "ギャラリー" : "Gallery"}
                                    </div>
                                    {searchResults!.gallery.map((img) => (
                                        <button key={img.id} onClick={() => handleSearchSelect(`/gallery`)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left">
                                            <img src={img.photoUrl} alt="Gallery" className="h-9 w-9 object-cover rounded-md shrink-0 border border-border" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium line-clamp-1">{img.description || (lang === "id" ? "Tanpa deskripsi" : lang === "jp" ? "説明なし" : "No description")}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="w-full max-w-[1600px] mx-auto flex h-16 items-center px-4 md:px-6 lg:px-10 gap-3">

                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 shrink-0 mr-2 lg:mr-6">
                        <div className="bg-primary/20 p-1.5 rounded-lg">
                            <BookOpen className="h-5 w-5 text-accent" />
                        </div>
                        <span className="font-bold text-base tracking-tight hidden sm:inline-block">{t("brand")}</span>
                    </Link>

                    {/* Desktop nav links */}
                    <nav className="hidden md:flex items-center gap-2 lg:gap-5 text-sm font-medium mr-auto">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link key={link.href} href={link.href}
                                    className={`transition-colors hover:text-accent flex items-center gap-1 lg:gap-1.5 whitespace-nowrap ${isActive ? "text-accent font-semibold" : "text-muted-foreground"}`}>
                                    {getNavLabel(link.key)}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Spacer on mobile */}
                    <div className="flex-1 md:hidden" />

                    {/* Desktop: Lang toggle + Search */}
                    <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
                        {/* Language toggle */}
                        <button
                            onClick={() => setLang(lang === "en" ? "id" : lang === "id" ? "jp" : "en")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-muted/50 hover:bg-muted text-xs font-medium transition-colors shrink-0"
                            title={lang === "en" ? "Ganti ke Bahasa Indonesia" : lang === "id" ? "日本語に切り替える" : "Switch to English"}
                        >
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{lang === "en" ? "🇺🇸 EN" : lang === "id" ? "🇮🇩 ID" : "🇯🇵 JP"}</span>
                        </button>

                        {/* Desktop search */}
                        <div ref={searchRef} className="relative flex-1">
                            <div className="relative">
                                {isSearching
                                    ? <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
                                    : <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />}
                                <input
                                    type="search" value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => { if (hasResults) setShowSearchDropdown(true); }}
                                    placeholder={t("nav_search_placeholder")}
                                    className="flex h-9 w-full rounded-full border border-input bg-muted/50 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9 pr-4"
                                />
                                {searchQuery && (
                                    <button onClick={() => { setSearchQuery(""); setShowSearchDropdown(false); }}
                                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <SearchDropdown />
                        </div>
                    </div>

                    {/* Mobile: Search icon button */}
                    <button
                        onClick={() => setMobileSearchOpen(v => !v)}
                        className="md:hidden inline-flex items-center justify-center rounded-full h-9 w-9 bg-muted/50 hover:bg-muted transition-colors"
                        aria-label="Search"
                    >
                        <Search className="h-4 w-4" />
                    </button>

                    {/* Notification Bell */}
                    <div ref={notifRef} className="relative shrink-0">
                        <button
                            onClick={() => { setShowNotifPanel(v => !v); }}
                            className="relative inline-flex items-center justify-center rounded-full h-9 w-9 bg-muted/50 hover:bg-muted transition-colors"
                            aria-label="Notifications"
                        >
                            <Bell className="h-4 w-4" />
                            {notifUnread > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                    {notifUnread > 9 ? "9+" : notifUnread}
                                </span>
                            )}
                        </button>
                        <AnimatePresence>
                            {showNotifPanel && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.15 }}
                                    className="absolute top-full mt-2 right-0 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                                >
                                    <div className="flex justify-between items-center px-4 py-3 border-b border-border/50">
                                        <h3 className="font-semibold text-foreground/90">{t("notif_title")}</h3>
                                        {notifUnread > 0 && (
                                            <button
                                                onClick={handleMarkAllRead}
                                                className="text-xs text-pink-400/90 hover:text-pink-500 hover:underline font-medium transition-colors"
                                            >
                                                {lang === "id" ? "Tandai semua dibaca" : lang === "jp" ? "すべて既読にする" : "Mark all as read"}
                                            </button>
                                        )}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-sm text-muted-foreground">
                                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                            {t("notif_empty")}
                                        </div>
                                    ) : (
                                        <div className="max-h-[360px] overflow-y-auto divide-y divide-border/50">
                                            {notifications.map((notif) => {
                                                const prefix = notif.type === "note" ? t("notif_new_note") : t("notif_new_book");
                                                const rawTitle = notif.title.includes(":") ? notif.title.split(":").slice(1).join(":").trim() : notif.title;
                                                return (
                                                    <Link key={notif.id} href={notif.href} onClick={() => setShowNotifPanel(false)}
                                                        className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${!notif.isRead ? "bg-primary/5" : ""}`}>
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${notif.type === "note" ? "bg-primary/20 text-primary" : notif.type === "gallery" ? "bg-amber-100 text-amber-600" : "bg-secondary/20 text-secondary"}`}>
                                                            {notif.type === "note" ? <PenLine className="h-4 w-4 drop-shadow-sm" /> : notif.type === "gallery" ? <ImageIcon className="h-4 w-4 drop-shadow-sm" /> : <BookMarked className="h-4 w-4 drop-shadow-sm" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <p className={`text-sm line-clamp-2 leading-snug ${!notif.isRead ? "font-bold text-foreground" : "font-medium text-foreground/90"}`}>{prefix} &ldquo;{rawTitle}&rdquo;</p>
                                                                {!notif.isRead && (
                                                                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{notif.subtitle} · {timeAgo(notif.createdAt, lang)}</p>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Desktop: Login or User Badge */}
                    <div className="hidden md:flex items-center gap-1.5 lg:gap-2 shrink-0">
                        {!isLoggedIn ? (
                            <Link href="/login"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                                <LogIn className="h-3.5 w-3.5" />
                                <span className="hidden lg:inline">{lang === "id" ? "Masuk" : lang === "jp" ? "ログイン" : "Login"}</span>
                                <span className="lg:hidden">Login</span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-1.5 lg:gap-2">
                                <div className="flex items-center gap-1.5 lg:gap-2 bg-muted/40 hover:bg-muted/60 border border-border/50 rounded-full py-1 pl-1 pr-2 lg:pr-3 transition-colors">
                                    <span className={`flex items-center gap-1.5 lg:gap-2 text-[10px] font-bold px-2.5 lg:px-3 py-1 rounded-full uppercase tracking-wider ${role === "king"
                                        ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50"
                                        : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700/50"
                                        } border`}>
                                        <Crown className={`h-3 w-3 ${role === "king" ? "text-amber-500" : "text-rose-500"}`} />
                                        <span className="hidden lg:inline">{role === "king" ? "King" : "Queen"}</span>
                                    </span>
                                    <span className="text-xs lg:text-sm font-medium leading-none max-w-[80px] lg:max-w-none truncate">{username}</span>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: window.location.origin + "/" })}
                                    title="Logout"
                                    className="inline-flex items-center justify-center rounded-full h-8 w-8 bg-muted/50 hover:bg-red-100 hover:text-red-600 transition-colors"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileOpen(v => !v)}
                        className="md:hidden inline-flex items-center justify-center rounded-full h-9 w-9 bg-muted/50 hover:bg-muted transition-colors"
                        aria-label="Menu"
                    >
                        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                </div>

                {/* Mobile search bar (expands below header) */}
                <AnimatePresence>
                    {mobileSearchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                            className="md:hidden border-t border-border/40 bg-background/80 backdrop-blur-md overflow-hidden"
                        >
                            <div className="px-4 py-3 relative" ref={searchRef}>
                                <div className="relative">
                                    {isSearching
                                        ? <Loader2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
                                        : <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />}
                                    <input
                                        ref={mobileSearchRef}
                                        type="search" value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => { if (hasResults) setShowSearchDropdown(true); }}
                                        placeholder={t("nav_search_placeholder")}
                                        className="flex h-9 w-full rounded-full border border-input bg-muted/50 pl-9 pr-9 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                    {searchQuery ? (
                                        <button onClick={() => { setSearchQuery(""); setShowSearchDropdown(false); }}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                                            <X className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <button onClick={() => setMobileSearchOpen(false)}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <SearchDropdown />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile slide-down menu */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                            className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-md overflow-hidden"
                        >
                            <nav className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 py-4 space-y-1">
                                {navLinks.map(({ href, key, Icon }) => {
                                    const isActive = pathname === href;
                                    return (
                                        <Link key={href} href={href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
                                                ? "bg-primary/10 text-accent font-semibold"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                                            <Icon className="h-4 w-4 shrink-0" />
                                            {getNavLabel(key)}
                                        </Link>
                                    );
                                })}

                                {/* Divider */}
                                <div className="border-t border-border/50 pt-3 mt-3">
                                    <button
                                        onClick={() => setLang(lang === "en" ? "id" : lang === "id" ? "jp" : "en")}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        <Globe className="h-4 w-4 shrink-0" />
                                        <span>{lang === "en" ? "🇺🇸 English" : lang === "id" ? "🇮🇩 Bahasa Indonesia" : "🇯🇵 日本語"}</span>
                                        <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full border border-border">
                                            {lang === "en" ? "Switch to ID" : lang === "id" ? "JPに切り替える" : "Switch to EN"}
                                        </span>
                                    </button>
                                </div>

                                {/* Auth row */}
                                <div className="border-t border-border/50 pt-3 mt-1">
                                    {!isLoggedIn ? (
                                        <Link href="/login"
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 transition-colors">
                                            <LogIn className="h-4 w-4 shrink-0" />
                                            {lang === "id" ? "Masuk ke C&C Journal" : lang === "jp" ? "C&C Journal にログイン" : "Login to C&C Journal"}
                                        </Link>
                                    ) : (
                                        <>
                                            <div className="px-4 py-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2.5 bg-muted/30 border border-border/50 rounded-full py-1.5 pl-1.5 pr-4">
                                                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${role === "king"
                                                        ? "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50"
                                                        : "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700/50"
                                                        }`}>
                                                        <Crown className={`h-3.5 w-3.5 ${role === "king" ? "text-amber-500" : "text-rose-500"}`} />
                                                        <span>{role === "king" ? "King" : "Queen"}</span>
                                                    </span>
                                                    <span className="text-sm font-medium">{username}</span>
                                                </div>
                                                <button
                                                    onClick={() => signOut({ callbackUrl: window.location.origin + "/" })}
                                                    className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    {lang === "id" ? "Keluar" : lang === "jp" ? "ログアウト" : "Logout"}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Mobile bottom navigation bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border/50 safe-area-bottom">
                <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
                    {navLinks.map(({ href, key, Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link key={href} href={href}
                                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isActive ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}>
                                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-primary/15" : ""}`}>
                                    <Icon className={`h-5 w-5 transition-all ${isActive ? "scale-110" : ""}`} />
                                </div>
                                <span className={`text-[10px] font-medium leading-none ${isActive ? "font-semibold" : ""}`}>
                                    {getNavLabel(key)}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
