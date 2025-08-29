
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { X, Loader2, Gift, Ban, CheckCircle, Play } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { awardVideoWatchCoins } from "@/app/actions";
import { cn } from "@/lib/utils";

const REWARD_DURATION_SECONDS = 180; // 3 minutes
const DAILY_COIN_LIMIT = 1500;

interface User {
  id: string;
  username: string;
  coins: number;
  dailyCoins?: number;
}

export default function WatchPage() {
  const params = useParams();
  const videoId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [timeWatched, setTimeWatched] = useState(0);
  const [isRewardClaimed, setIsRewardClaimed] = useState(false);
  const [isDailyLimitReached, setIsDailyLimitReached] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  
  const playerRef = useRef<any>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if ((parsedUser.dailyCoins || 0) >= DAILY_COIN_LIMIT) {
          setIsDailyLimitReached(true);
      }
    }

    const claimedRewards = JSON.parse(localStorage.getItem('claimedRewards') || '{}');
    if (claimedRewards[videoId]) {
        setIsRewardClaimed(true);
    }
    
    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
            'autoplay': 0, 'rel': 0, 'modestbranding': 1, 'iv_load_policy': 3, 'controls': 0
        },
        events: {
            'onReady': () => {
                setIsLoading(false)
            },
            'onStateChange': (event: any) => {
                if (timerIntervalRef.current) {
                  clearInterval(timerIntervalRef.current);
                }
                if (event.data === (window as any).YT.PlayerState.PLAYING) {
                  if (!isPlaying) setIsPlaying(true); // Sync state if autoplay starts it
                  if (isRewardClaimed || isDailyLimitReached || isTimerFinished) return;
                  timerIntervalRef.current = setInterval(() => {
                    setTimeWatched(prev => prev + 1);
                  }, 1000);
                } else {
                   // When paused or ended, clear interval
                   if (event.data !== (window as any).YT.PlayerState.PLAYING) {
                        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                   }
                }
            }
        }
      });
    }

    if (!(window as any).YT || !(window as any).YT.Player) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [videoId, isPlaying]);

  useEffect(() => {
    if (timeWatched >= REWARD_DURATION_SECONDS && !isTimerFinished) {
      setIsTimerFinished(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, [timeWatched, isTimerFinished]);
  
  const handlePlay = () => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
        playerRef.current.setOption('playerVars', 'controls', 1);
        setIsPlaying(true);
    }
  }
  
  const claimReward = async () => {
    if (!user || isRewardClaimed || isDailyLimitReached) return;
    setIsClaiming(true);

    const result = await awardVideoWatchCoins(user.id);
    if(result.success && result.user) {
        setIsRewardClaimed(true);
        toast({
            title: "🎉 Reward Claimed!",
            description: "You have received 30 coins for watching the video.",
        });
        
        const claimedRewards = JSON.parse(localStorage.getItem('claimedRewards') || '{}');
        claimedRewards[videoId] = true;
        localStorage.setItem('claimedRewards', JSON.stringify(claimedRewards));

        const updatedUser = { ...user, ...result.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        if((updatedUser.dailyCoins || 0) >= DAILY_COIN_LIMIT) {
          setIsDailyLimitReached(true);
        }

    } else {
        toast({
            title: "Error",
            description: result.error || "Failed to award reward.",
            variant: "destructive"
        });
        if (result.error && result.error.includes("limit")) {
             setIsDailyLimitReached(true);
        }
    }
    setIsClaiming(false);
  };

  if (!videoId) {
    return <div className="flex items-center justify-center h-screen bg-black"><p className="text-white">Video ID not found.</p></div>
  }

  const timerProgress = Math.min((timeWatched / REWARD_DURATION_SECONDS) * 100, 100);
  const minutesLeft = Math.floor((REWARD_DURATION_SECONDS - timeWatched) / 60);
  const secondsLeft = (REWARD_DURATION_SECONDS - timeWatched) % 60;

  const renderRewardSection = () => {
    if (isDailyLimitReached) {
      return (
        <div className="text-orange-600 flex items-center gap-2 p-4 bg-orange-50 rounded-lg">
            <Ban />
            <p>You have reached the daily earning limit of {DAILY_COIN_LIMIT} coins.</p>
        </div>
      );
    }
    if (isRewardClaimed) {
      return (
        <div className="text-green-600 flex items-center gap-2 p-4 bg-green-50 rounded-lg">
          <CheckCircle />
          <p>You have already claimed the reward for this video.</p>
        </div>
      );
    }
    if (isTimerFinished) {
      return (
        <div className="text-center space-y-2">
            <p className="font-semibold">You can now claim your reward!</p>
            <Button onClick={claimReward} disabled={isClaiming} size="lg">
                {isClaiming ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Gift className="mr-2 h-4 w-4"/>}
                {isClaiming ? 'Claiming...' : 'Claim your 30 Coins'}
            </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
          <div>
            <p className="text-muted-foreground mb-2">Watch for 3 minutes to earn 30 coins.</p>
            <Progress value={timerProgress} className="mb-2" />
            <p className="text-sm text-right text-muted-foreground">
                {minutesLeft}:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft} remaining
            </p>
          </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="w-full bg-black relative flex-shrink-0">
          <div className="aspect-video max-w-7xl mx-auto relative group">
              {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
              )}
              <div id="youtube-player" className="w-full h-full bg-black opacity-100"></div>
              {!isPlaying && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-10" onClick={handlePlay}>
                      <button className="bg-red-600/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center w-20 h-20 transition-transform hover:scale-110">
                          <Play className="h-10 w-10 translate-x-0.5" />
                      </button>
                  </div>
              )}
              <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
                <Link href="/" passHref>
                  <Button variant="ghost" size="icon" className="bg-black/50 hover:bg-black/75 text-white">
                    <X className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
          </div>
      </div>
      <div className="w-full py-8 px-4 flex-grow">
          {user && (
               <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                         <Gift className="text-primary"/>
                        Video Watch Reward
                    </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderRewardSection()}
              </CardContent>
              </Card>
          )}
      </div>
    </div>
  );
}
