"use client";

import {
    createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode
} from "react";

interface MusicContextType {
    isPlaying: boolean;
    toggle: () => void;
    volume: number;
    setVolume: (v: number) => void;
    isReady: boolean;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function useMusic() {
    const ctx = useContext(MusicContext);
    if (!ctx) throw new Error("useMusic must be used inside MusicProvider");
    return ctx;
}

// YouTube video ID from https://youtu.be/3jvQpuk-9q4
const YT_VIDEO_ID = "3jvQpuk-9q4";

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

export function MusicProvider({ children }: { children: ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(40);
    const [isReady, setIsReady] = useState(false);
    const playerRef = useRef<any>(null);
    // Track whether user has ever clicked play (for autoplay policy)
    const hasInteractedRef = useRef(false);

    const initPlayer = useCallback(() => {
        if (playerRef.current) return;
        playerRef.current = new window.YT.Player("yt-music-player", {
            videoId: YT_VIDEO_ID,
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                rel: 0,
                loop: 1,
                playlist: YT_VIDEO_ID,
            },
            events: {
                onReady: (event: any) => {
                    event.target.setVolume(volume);
                    setIsReady(true);
                    // If user had music playing before navigation, resume
                    const saved = localStorage.getItem("cc-music-playing");
                    if (saved === "true" && hasInteractedRef.current) {
                        event.target.playVideo();
                        setIsPlaying(true);
                    }
                },
                onStateChange: (event: any) => {
                    // YT.PlayerState.ENDED = 0, PLAYING = 1, PAUSED = 2
                    if (event.data === 1) {
                        setIsPlaying(true);
                        localStorage.setItem("cc-music-playing", "true");
                    } else if (event.data === 2 || event.data === 0) {
                        setIsPlaying(false);
                        localStorage.setItem("cc-music-playing", "false");
                    }
                },
            },
        });
    }, [volume]);

    useEffect(() => {
        // Load YouTube IFrame API
        if (document.getElementById("yt-api-script")) {
            if (window.YT && window.YT.Player) {
                initPlayer();
            } else {
                window.onYouTubeIframeAPIReady = initPlayer;
            }
            return;
        }

        const tag = document.createElement("script");
        tag.id = "yt-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = initPlayer;
    }, [initPlayer]);

    const toggle = useCallback(() => {
        if (!playerRef.current || !isReady) return;
        hasInteractedRef.current = true;

        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    }, [isPlaying, isReady]);

    const setVolume = useCallback((v: number) => {
        setVolumeState(v);
        if (playerRef.current && isReady) {
            playerRef.current.setVolume(v);
        }
    }, [isReady]);

    return (
        <MusicContext.Provider value={{ isPlaying, toggle, volume, setVolume, isReady }}>
            {/* Hidden YouTube player — audio only via invisible iframe */}
            <div
                style={{ position: "fixed", top: "-9999px", left: "-9999px", width: 1, height: 1, pointerEvents: "none", visibility: "hidden", zIndex: -1 }}
                aria-hidden="true"
            >
                <div id="yt-music-player" />
            </div>
            {children}
        </MusicContext.Provider>
    );
}
