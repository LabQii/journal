"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "id" | "en" | "jp";

interface LanguageContextType {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
    return ctx;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>("en");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("cc-lang") as Lang | null;
        if (saved === "en" || saved === "id" || saved === "jp") setLangState(saved);
        setMounted(true);
    }, []);

    const setLang = (l: Lang) => {
        setLangState(l);
        localStorage.setItem("cc-lang", l);
    };

    const t = (key: string): string => {
        // Before mount: always return English so content is visible immediately
        // and server/client text output matches (avoids React #418 hydration error
        // which only fires when server="en" but client renders a different locale)
        const dict = mounted ? (lang === "en" ? en : lang === "id" ? id : jp) : en;
        return (dict as Record<string, string>)[key] ?? key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

// ─── Indonesian ────────────────────────────────────────────────────────────────
const id: Record<string, string> = {
    // Brand
    brand: "C&C Journal",
    tagline: "Ruang kecil kita untuk menyimpan setiap cerita.",

    // Navbar
    nav_home: "Home",
    nav_notes: "Notes",
    nav_books: "Books",
    nav_gallery: "Gallery",
    nav_search_placeholder: "Cari catatan, buku...",

    // Notif panel
    notif_title: "Notifikasi",
    notif_period: "7 hari terakhir",
    notif_empty: "Belum ada aktivitas terbaru",
    notif_new_note: "Catatan baru:",
    notif_new_book: "Buku baru:",

    // Home – Hero
    home_badge: "Ruang digital kita berdua",
    home_h1_a: "Simpan Setiap Cerita di",
    home_h1_brand: "C&C Journal",
    home_subtitle: "Selamat datang di C&C Journal — ruang kecil kita untuk menyimpan setiap cerita, tawa, dan perjalanan yang kita lewati bersama.",
    home_cta_note: "Tulis Catatan",
    home_cta_books: "Jelajahi Buku",

    // Home – Sections
    home_recent_notes: "Catatan Terbaru",
    home_latest_books: "Buku Terbaru",
    home_view_all: "Lihat semua",
    home_no_notes: "Belum ada catatan",
    home_no_notes_sub: "Mulai menulis catatan pertamamu.",
    home_create_note: "Buat Catatan",
    home_no_books: "Belum ada buku",
    home_no_books_sub: "Mulai membangun perpustakaan kita.",
    home_go_library: "Ke Perpustakaan",
    home_read_more: "Baca selengkapnya",
    home_read_book: "Baca Buku",
    home_new_book: "Buku Baru",
    home_new_part: "Bagian Baru",
    lang_toggle_en: "English",
    lang_toggle_id: "Indonesia",
    lang_toggle_jp: "日本語",

    // Notes page
    notes_title: "Notes",
    notes_all: "Semua Catatan",
    notes_new: "Catatan Baru",
    notes_search: "Cari catatan...",
    notes_no_results: "Tidak ada catatan",
    notes_no_results_cat: "Belum ada catatan di kategori ini",
    notes_no_results_hint: "Muliskan catatan pertamamu.",
    notes_no_results_cat_hint: "Kategori ini masih kosong. Yuk mulai menulis!",
    notes_save: "Simpan Catatan",
    notes_cancel: "Batal",
    notes_title_placeholder: "Judul Catatan",
    notes_content_placeholder: "Tuliskan perasaanmu...",
    notes_category: "Kategori",
    notes_image_url: "URL Gambar",
    notes_image_optional: "(opsional — kosongkan untuk gambar default kategori)",
    notes_default_cat_img: "Gambar default kategori",
    notes_edit_title: "Edit Catatan",
    notes_save_changes: "Simpan Perubahan",
    notes_delete_title: "Hapus Catatan",
    notes_delete_confirm: "Yakin ingin menghapus catatan ini? Tindakan ini tidak bisa dibatalkan.",
    notes_delete_btn: "Hapus",
    notes_network_error: "Terjadi kesalahan jaringan.",

    // Comments
    comment_title: "Komentar",
    comment_write: "Tulis komentar",
    comment_write_placeholder: "Bagikan pikiranmu...",
    comment_post: "Kirim Komentar",
    comment_reply: "Balas",
    comment_reply_placeholder: "Tulis balasan...",
    comment_send_reply: "Kirim",
    comment_cancel: "Batal",
    comment_delete: "Hapus",
    comment_delete_confirm: "Yakin ingin menghapus komentar ini?",
    comment_empty: "Belum ada komentar. Jadilah yang pertama!",
    comment_search: "Cari komentar...",
    comment_no_results: "Tidak ada komentar yang cocok.",
    comment_login_prompt: "untuk meninggalkan komentar.",
    comment_login_link: "Masuk",
    comment_required: "Komentar tidak boleh kosong.",
    comment_error_network: "Terjadi kesalahan jaringan.",
    comment_just_now: "Baru saja",
    comment_minutes_ago: "menit lalu",
    comment_hours_ago: "jam lalu",
    comment_days_ago: "hari lalu",
    comment_edit: "Edit",
    comment_edit_placeholder: "Edit komentar...",
    comment_save: "Simpan",

    // Form Validation
    validation_required: "Wajib diisi.",
    validation_title_required: "Judul wajib diisi.",
    validation_content_required: "Konten wajib diisi.",
    validation_author_required: "Penulis wajib diisi.",
    validation_cover_required: "Gambar sampul wajib diunggah.",
    validation_desc_required: "Deskripsi wajib diisi.",
    validation_photo_required: "Foto wajib dipilih.",

    // Books page
    books_h1: "Perpustakaan Kita",
    books_subtitle: "Bab dalam perjalanan kita — cerita yang lebih panjang, kenangan yang lebih dalam, dan momen yang tak ingin kita lupakan.",
    books_add: "Tambah Buku",
    books_empty: "Perpustakaan masih kosong",
    books_empty_hint: "Tambahkan buku pertama kita.",
    books_parts: "Bagian",
    books_new_title: "Buku Baru",
    books_form_title: "Judul",
    books_form_author: "Penulis",
    books_form_cover: "URL Cover (opsional)",
    books_form_desc: "Deskripsi",
    books_form_status: "Status",
    books_status_ongoing: "Berlangsung",
    books_status_completed: "Selesai",
    books_create: "Buat Buku",
    books_cancel: "Batal",
    books_read_now: "BACA SEKARANG",

    // Gallery page
    gallery_h1: "Galeri Kenangan",
    gallery_subtitle: "Kumpulan momen yang tertangkap — karena ada kenangan yang pantas untuk dilihat, bukan hanya diingat.",
    gallery_add: "Tambah Foto",
    gallery_empty: "Belum ada foto",
    gallery_empty_hint: "Tambahkan foto kenangan pertama kita.",
    gallery_photo_url: "URL Foto",
    gallery_desc: "Deskripsi (opsional)",
    gallery_desc_placeholder: "Momen indah bersama...",
    gallery_save: "Tambah Foto",
    gallery_cancel: "Batal",
    gallery_edit_title: "Edit Foto",
    gallery_save_changes: "Simpan Perubahan",
    gallery_delete_title: "Hapus Foto",
    gallery_delete_confirm: "Yakin ingin menghapus foto ini? Tindakan ini tidak bisa dibatalkan.",
    gallery_delete_btn: "Hapus",
    gallery_photo_details: "Detail Foto",
    gallery_curation: "C&C Curation",
    gallery_curated: "Kenangan Kita",

    // Footer
    footer_desc: "Ruang digital kita berdua — menyimpan setiap cerita, tawa, dan perjalanan yang kita lewati bersama.",
    footer_journal: "Jurnal",
    footer_latest: "Catatan Terbaru",
    footer_stories: "Cerita Perjalanan",
    footer_memories: "Kenangan Foto",
    footer_books: "Koleksi Buku",
    footer_moments: "Momen Spesial",
    footer_moments2: "Kisah Kita",
    footer_moments3: "Refleksi",
    footer_newsletter: "Tetap Terhubung",
    footer_newsletter_desc: "Ikuti setiap perjalanan dan cerita baru di C&C Journal.",
    footer_newsletter_placeholder: "Email kamu",
    footer_newsletter_btn: "Ikuti",
    footer_copyright: "© 2026 C&C Journal. Seluruh hak dilindungi.",
    footer_terms: "Janji Kami",
    footer_privacy: "Privasi",
};

// ─── English ──────────────────────────────────────────────────────────────────
const en: Record<string, string> = {
    brand: "C&C Journal",
    tagline: "Our little digital space to keep every story.",

    nav_home: "Home",
    nav_notes: "Notes",
    nav_books: "Books",
    nav_gallery: "Gallery",
    nav_search_placeholder: "Search notes, books...",

    notif_title: "Notifications",
    notif_period: "Last 7 days",
    notif_empty: "No recent activity yet",
    notif_new_note: "New note:",
    notif_new_book: "New book:",

    home_badge: "Our digital space for two",
    home_h1_a: "Every Story Lives in",
    home_h1_brand: "C&C Journal",
    home_subtitle: "Welcome to C&C Journal — our little digital space to keep every story, laugh, and moment we've shared.",
    home_cta_note: "Create Note",
    home_cta_books: "Explore Books",

    home_recent_notes: "Recent Notes",
    home_latest_books: "Latest Books",
    home_view_all: "View all",
    home_no_notes: "No notes yet",
    home_no_notes_sub: "Start writing your first note.",
    home_create_note: "Create Note",
    home_no_books: "No books yet",
    home_no_books_sub: "Start building our library.",
    home_go_library: "Go to Library",
    home_read_more: "Read more",
    home_read_book: "Read Book",
    home_new_book: "New Book",
    home_new_part: "New Part",
    lang_toggle_en: "English",
    lang_toggle_id: "Indonesia",
    lang_toggle_jp: "日本語",

    notes_title: "Notes",
    notes_all: "All Notes",
    notes_new: "New Note",
    notes_search: "Search notes...",
    notes_no_results: "No notes yet",
    notes_no_results_cat: "No notes in this category",
    notes_no_results_hint: "Write your first note.",
    notes_no_results_cat_hint: "This category is empty. Start writing!",
    notes_save: "Save Note",
    notes_cancel: "Cancel",
    notes_title_placeholder: "Note Title",
    notes_content_placeholder: "Write your thoughts...",
    notes_category: "Category",
    notes_image_url: "Image URL",
    notes_image_optional: "(optional — leave empty for category default)",
    notes_default_cat_img: "Default image for category",
    notes_edit_title: "Edit Note",
    notes_save_changes: "Save Changes",
    notes_delete_title: "Delete Note",
    notes_delete_confirm: "Are you sure you want to delete this note? This action cannot be undone.",
    notes_delete_btn: "Delete",
    notes_network_error: "A network error occurred.",

    // Comments
    comment_title: "Comments",
    comment_write: "Write a comment",
    comment_write_placeholder: "Share your thoughts...",
    comment_post: "Post Comment",
    comment_reply: "Reply",
    comment_reply_placeholder: "Write a reply...",
    comment_send_reply: "Reply",
    comment_cancel: "Cancel",
    comment_delete: "Delete",
    comment_delete_confirm: "Are you sure you want to delete this comment?",
    comment_empty: "No comments yet. Be the first!",
    comment_search: "Search comments...",
    comment_no_results: "No comments match your search.",
    comment_login_prompt: "to leave a comment.",
    comment_login_link: "Login",
    comment_required: "Comment cannot be empty.",
    comment_error_network: "Network error. Please try again.",
    comment_just_now: "Just now",
    comment_minutes_ago: "m ago",
    comment_hours_ago: "h ago",
    comment_days_ago: "d ago",
    comment_edit: "Edit",
    comment_edit_placeholder: "Edit your comment...",
    comment_save: "Save",

    // Form Validation
    validation_required: "Required.",
    validation_title_required: "Title is required.",
    validation_content_required: "Content is required.",
    validation_author_required: "Author is required.",
    validation_cover_required: "Cover image is required.",
    validation_desc_required: "Description is required.",
    validation_photo_required: "Please select a photo.",

    books_h1: "Our Library",
    books_subtitle: "Chapters of our journey — longer stories, deeper memories, and meaningful moments we never want to forget.",
    books_add: "Add New Book",
    books_empty: "Your library is empty",
    books_empty_hint: "Add the first book to our library.",
    books_parts: "Parts",
    books_new_title: "New Book",
    books_form_title: "Title",
    books_form_author: "Author",
    books_form_cover: "Cover URL (optional)",
    books_form_desc: "Description",
    books_form_status: "Status",
    books_status_ongoing: "Ongoing",
    books_status_completed: "Completed",
    books_create: "Create Book",
    books_cancel: "Cancel",
    books_read_now: "READ NOW",

    gallery_h1: "Memory Gallery",
    gallery_subtitle: "A collection of captured moments — because some memories deserve to be seen, not just remembered.",
    gallery_add: "Add Photo",
    gallery_empty: "No photos yet",
    gallery_empty_hint: "Add your first memory photo.",
    gallery_photo_url: "Photo URL",
    gallery_desc: "Description (optional)",
    gallery_desc_placeholder: "A beautiful moment together...",
    gallery_save: "Add Photo",
    gallery_cancel: "Cancel",
    gallery_edit_title: "Edit Photo",
    gallery_save_changes: "Save Changes",
    gallery_delete_title: "Delete Photo",
    gallery_delete_confirm: "Are you sure you want to delete this photo? This action cannot be undone.",
    gallery_delete_btn: "Delete",
    gallery_photo_details: "Photo Details",
    gallery_curation: "C&C Curation",
    gallery_curated: "Our Memory",

    footer_desc: "Our digital archive — keeping every story, laugh, and journey we share together.",
    footer_journal: "Journal",
    footer_latest: "Recent Notes",
    footer_stories: "Our Stories",
    footer_memories: "Photo Memories",
    footer_books: "Book Collection",
    footer_moments: "Special Moments",
    footer_moments2: "Our Journey",
    footer_moments3: "Reflections",
    footer_newsletter: "Stay Connected",
    footer_newsletter_desc: "Follow every journey and new story at C&C Journal.",
    footer_newsletter_placeholder: "Your email",
    footer_newsletter_btn: "Join",
    footer_copyright: "© 2026 C&C Journal. All rights reserved.",
    footer_terms: "Our Promise",
    footer_privacy: "Privacy",
};

// ─── Japanese ─────────────────────────────────────────────────────────────────
const jp: Record<string, string> = {
    brand: "C&C Journal",
    tagline: "すべての物語を保存する私たちの小さな空間。",

    nav_home: "ホーム",
    nav_notes: "ノート",
    nav_books: "本",
    nav_gallery: "ギャラリー",
    nav_search_placeholder: "ノート本を検索...",

    notif_title: "通知",
    notif_period: "過去7日間",
    notif_empty: "最近のアクティビティはありません",
    notif_new_note: "新しいノート:",
    notif_new_book: "新しい本:",

    home_badge: "私たちのデジタルの場所",
    home_h1_a: "すべての物語はここに",
    home_h1_brand: "C&C Journal",
    home_subtitle: "C&C Journalへようこそ — 私たちが共有したすべての物語、笑い、そして瞬間を保存するためのデジタルスペースです。",
    home_cta_note: "ノートを作成",
    home_cta_books: "本を探索",

    home_recent_notes: "最近のノート",
    home_latest_books: "最新の本",
    home_view_all: "すべて見る",
    home_no_notes: "ノートはまだありません",
    home_no_notes_sub: "最初のノートを書き始めましょう。",
    home_create_note: "ノートを作成",
    home_no_books: "本はまだありません",
    home_no_books_sub: "私たちのライブラリを作り始めましょう。",
    home_go_library: "ライブラリへ",
    home_read_more: "続きを読む",
    home_read_book: "本を読む",
    home_new_book: "新しい本",
    home_new_part: "新しいパート",
    lang_toggle_en: "English",
    lang_toggle_id: "Indonesia",
    lang_toggle_jp: "日本語",

    notes_title: "ノート",
    notes_all: "すべてのノート",
    notes_new: "新しいノート",
    notes_search: "ノートを検索...",
    notes_no_results: "ノートはまだありません",
    notes_no_results_cat: "このカテゴリにはノートがありません",
    notes_no_results_hint: "最初のノートを書きましょう。",
    notes_no_results_cat_hint: "このカテゴリは空です。書き始めましょう！",
    notes_save: "ノートを保存",
    notes_cancel: "キャンセル",
    notes_title_placeholder: "ノートのタイトル",
    notes_content_placeholder: "あなたの考えを書いてください...",
    notes_category: "カテゴリ",
    notes_image_url: "画像URL",
    notes_image_optional: "(オプション — 空白の場合はカテゴリのデフォルトになります)",
    notes_default_cat_img: "カテゴリのデフォルト画像",
    notes_edit_title: "ノートを編集",
    notes_save_changes: "変更を保存",
    notes_delete_title: "ノートを削除",
    notes_delete_confirm: "このノートを削除してもよろしいですか？この操作は元に戻せません。",
    notes_delete_btn: "削除",
    notes_network_error: "ネットワークエラーが発生しました。",

    // Comments
    comment_title: "コメント",
    comment_write: "コメントを書く",
    comment_write_placeholder: "あなたの考えをシェアしてください...",
    comment_post: "コメントを投稿",
    comment_reply: "返信",
    comment_reply_placeholder: "返信を書いてください...",
    comment_send_reply: "返信する",
    comment_cancel: "キャンセル",
    comment_delete: "削除",
    comment_delete_confirm: "このコメントを削除してもよろしいですか？",
    comment_empty: "まだコメントはありません。最初のコメントをどうぞ！",
    comment_search: "コメントを検索...",
    comment_no_results: "該当するコメントはありません。",
    comment_login_prompt: "コメントを残すには",
    comment_login_link: "ログイン",
    comment_required: "コメントは空にできません。",
    comment_error_network: "ネットワークエラー。もう一度お試しください。",
    comment_just_now: "たった今",
    comment_minutes_ago: "分前",
    comment_hours_ago: "時間前",
    comment_days_ago: "日前",
    comment_edit: "編集",
    comment_edit_placeholder: "コメントを編集...",
    comment_save: "保存",

    // Form Validation
    validation_required: "必須項目です。",
    validation_title_required: "タイトルは必須です。",
    validation_content_required: "内容は必須です。",
    validation_author_required: "著者は必須です。",
    validation_cover_required: "カバー画像は必須です。",
    validation_desc_required: "説明は必須です。",
    validation_photo_required: "写真を選択してください。",

    books_h1: "私たちのライブラリ",
    books_subtitle: "私たちの旅の章 — 決して忘れたくない長い物語、深い思い出、そして意味のある瞬間。",
    books_add: "新しい本を追加",
    books_empty: "ライブラリは空です",
    books_empty_hint: "ライブラリに最初の本を追加してください。",
    books_parts: "パート",
    books_new_title: "新しい本",
    books_form_title: "タイトル",
    books_form_author: "著者",
    books_form_cover: "カバーURL (オプション)",
    books_form_desc: "説明",
    books_form_status: "ステータス",
    books_status_ongoing: "進行中",
    books_status_completed: "完了",
    books_create: "本を作成",
    books_cancel: "キャンセル",
    books_read_now: "今すぐ読む",

    gallery_h1: "メモリーギャラリー",
    gallery_subtitle: "捉えられた瞬間のコレクション — 思い出されるだけでなく、見られる価値のある思い出があるから。",
    gallery_add: "写真を追加",
    gallery_empty: "写真はまだありません",
    gallery_empty_hint: "最初の思い出の写真を追加してください。",
    gallery_photo_url: "写真URL",
    gallery_desc: "説明 (オプション)",
    gallery_desc_placeholder: "一緒に過ごした美しい瞬間...",
    gallery_save: "写真を追加",
    gallery_cancel: "キャンセル",
    gallery_edit_title: "写真を編集",
    gallery_save_changes: "変更を保存",
    gallery_delete_title: "写真を削除",
    gallery_delete_confirm: "この写真を削除してもよろしいですか？この操作は元に戻せません。",
    gallery_delete_btn: "削除",
    gallery_photo_details: "写真の詳細",
    gallery_curation: "C&Cキュレーション",
    gallery_curated: "私たちの思い出",

    footer_desc: "私たちのデジタルアーカイブ — 私たちが共有するすべての物語、笑い、そして旅を保存します。",
    footer_journal: "ジャーナル",
    footer_latest: "最近のノート",
    footer_stories: "私たちの物語",
    footer_memories: "写真の思い出",
    footer_books: "本のコレクション",
    footer_moments: "特別な瞬間",
    footer_moments2: "私たちの旅",
    footer_moments3: "振り返り",
    footer_newsletter: "つながりを保つ",
    footer_newsletter_desc: "C&C Journalのすべての旅と新しい物語をフォローしてください。",
    footer_newsletter_placeholder: "あなたのメールアドレス",
    footer_newsletter_btn: "参加する",
    footer_copyright: "© 2026 C&C Journal. All rights reserved.",
    footer_terms: "私たちの約束",
    footer_privacy: "プライバシー",
};
