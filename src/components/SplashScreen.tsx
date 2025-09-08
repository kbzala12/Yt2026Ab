
"use client";

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SplashScreen({ children, isLoaded }: { children: React.ReactNode, isLoaded: boolean }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (isLoaded) {
            // Start fading out when content is loaded
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 200); // Short delay before fading out
            return () => clearTimeout(timer);
        }
    }, [isLoaded]);

    return (
        <>
            {isVisible && (
                <div 
                    className={cn(
                        "fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-background transition-opacity duration-500",
                        isLoaded ? "opacity-0" : "opacity-100"
                    )}
                >
                    <div className="text-center">
                        <h1 className="text-6xl font-bold text-primary mb-4">kbyt</h1>
                        <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                    </div>
                </div>
            )}
            <div className={cn("transition-opacity duration-500", isLoaded ? "opacity-100" : "opacity-0")}>
                {children}
            </div>
        </>
    );
}
