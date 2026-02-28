export interface Note {
  id: string;
  title: string;
  preview: string;
  content: string;
  date: string;
  tags: string[];
  category: "Personal" | "Work" | "Ideas" | "Design";
  isFavorite: boolean;
  galleryImage?: string;
}

export interface BookPart {
  id: string;
  title: string;
  content: string;
  readTime: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  shortDescription: string;
  synopsis: string;
  totalParts: number;
  lastUpdated: string;
  parts: BookPart[];
}

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  date: string;
  category: "Lifestyle" | "Travel" | "Nature" | "Architecture";
}

export const notesData: Note[] = [
  {
    id: "1",
    title: "Morning Calm Reflections",
    preview: "Today I woke up feeling a strange sense of peace. The morning light hitting the rose petals in the garden...",
    content: "Today I woke up feeling a strange sense of peace. The morning light hitting the rose petals in the garden reminded me that beauty exists in small moments. I need to capture more of these feelings before they fade away.",
    date: "Oct 24, 2023",
    tags: ["Reflection", "Morning"],
    category: "Personal",
    isFavorite: true,
    galleryImage: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Quarterly Project Goals",
    preview: "Outlining the vision for the next three months. Focus on community engagement and aesthetic refinement...",
    content: "Outlining the vision for the next three months.\n\n1. Focus on community engagement.\n2. Aesthetic refinement across all touchpoints.\n3. Increase organic reach through consistent posting.",
    date: "Oct 22, 2023",
    tags: ["Planning", "Goals"],
    category: "Work",
    isFavorite: false,
    galleryImage: "https://images.unsplash.com/photo-1512314889357-e157c22f938d?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Hidden Lakes of the North",
    preview: "Packing list and itinerary for the upcoming mountain retreat. I can't wait to see the sunrise over the...",
    content: "Packing list and itinerary for the upcoming mountain retreat.\n\n- Hiking boots\n- Tent and sleeping bags\n- Camera gear\n\nI can't wait to see the sunrise over the pristine waters.",
    date: "Oct 20, 2023",
    tags: ["Travel", "Itinerary"],
    category: "Ideas",
    isFavorite: true,
    galleryImage: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=800&auto=format&fit=crop",
  }
];

export const booksData: Book[] = [
  {
    id: "1",
    title: "Petals of Wisdom",
    author: "Elena Thorne",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
    shortDescription: "A collection of thoughts on finding clarity in chaos.",
    synopsis: "Petals of Wisdom takes the reader on a journey through the chaotic modern world, teaching mindfulness and presence through the metaphor of a blooming garden.",
    totalParts: 12,
    lastUpdated: "2H AGO",
    parts: [
      { id: "1", title: "Part 1: The Seed", content: "Before you can bloom, you must be planted in the dirt...", readTime: "5 min" },
      { id: "2", title: "Part 2: The Sprout", content: "Breaking through the surface is the hardest part...", readTime: "8 min" },
    ]
  },
  {
    id: "2",
    title: "The Soft Silhouette",
    author: "Julian Moss",
    coverImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop",
    shortDescription: "Exploring minimalism in daily life.",
    synopsis: "A guide to stripping away the unnecessary to reveal the beautiful essence of your true self.",
    totalParts: 8,
    lastUpdated: "1D AGO",
    parts: [
      { id: "1", title: "Part 1: Less is More", content: "We carry so much weight that does not belong to us...", readTime: "10 min" }
    ]
  },
  {
    id: "3",
    title: "Midnight Blush",
    author: "Sarah K. Rose",
    coverImage: "https://images.unsplash.com/photo-1511108690759-009324a90311?q=80&w=800&auto=format&fit=crop",
    shortDescription: "A romance written under the stars.",
    synopsis: "When two insomniac creators meet in a 24-hour cafe, they discover that their best work happens between midnight and dawn.",
    totalParts: 24,
    lastUpdated: "3D AGO",
    parts: [
      { id: "1", title: "Part 1: Sleepless", content: "The neon sign continued to buzz overhead...", readTime: "15 min" }
    ]
  },
  {
    id: "4",
    title: "Echoes of Spring",
    author: "Marcus Bloom",
    coverImage: "https://images.unsplash.com/photo-1505362534571-0ceca2e21eb2?q=80&w=800&auto=format&fit=crop",
    shortDescription: "Rebirth and new beginnings.",
    synopsis: "A collection of poems about starting over and finding beauty in the thaw.",
    totalParts: 15,
    lastUpdated: "5D AGO",
    parts: [
      { id: "1", title: "Part 1: The Melt", content: "Winter held on with icy fingers, but the sun was stronger...", readTime: "3 min" }
    ]
  }
];

export const galleryData: GalleryImage[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop",
    title: "Golden Hour in Paris",
    date: "Oct 12, 2023",
    category: "Travel"
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop",
    title: "Minimalist Haven",
    date: "Oct 10, 2023",
    category: "Lifestyle"
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
    title: "Coastal Serenity",
    date: "Oct 08, 2023",
    category: "Nature"
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop",
    title: "Urban Geometry",
    date: "Oct 05, 2023",
    category: "Architecture"
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
    title: "Ethereal Gaze",
    date: "Oct 02, 2023",
    category: "Lifestyle"
  },
  {
    id: "6",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop",
    title: "Forest Sanctuary",
    date: "Sep 30, 2023",
    category: "Nature"
  },
  {
    id: "7",
    url: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop",
    title: "Morning Rituals",
    date: "Sep 28, 2023",
    category: "Lifestyle"
  },
  {
    id: "8",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop",
    title: "Alpine Reflection",
    date: "Sep 25, 2023",
    category: "Travel"
  }
];
