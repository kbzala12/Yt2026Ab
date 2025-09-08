
"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Loader2, Play, Users, Target, Coins, Wallet, Star, Bot, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserData, deleteApprovedVideo } from "./actions";
import { SplashScreen } from "@/components/SplashScreen";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


interface ApprovedVideo {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    dataAiHint: string;
}

interface UserSession {
    id: string;
    username: string;
    coins: number;
    dailyCoins?: number;
}

interface StatCardProps {
    icon: React.ElementType;
    title: string;
    value: string | number;
    iconBgColor: string;
    iconColor: string;
    asLink?: boolean;
    href?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, iconBgColor, iconColor, asLink = false, href = '#' }) => {
    const CardBody = (
        <Card>
            <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-3 rounded-lg ${iconBgColor}`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );

    if (asLink) {
        return <Link href={href}>{CardBody}</Link>;
    }
    return CardBody;
};

export default function Home() {
  const [videos, setVideos] = useState<ApprovedVideo[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchVideos = async () => {
    try {
        const videoResponse = await fetch('/api/approved-videos');
        const videoData = await videoResponse.json();
        setVideos(videoData.reverse()); // Show newest first
    } catch (err) {
        console.error("Failed to fetch videos", err);
        toast({ title: "Error", description: "Failed to load videos.", variant: "destructive"});
    }
  }

  useEffect(() => {
    const fetchInitialData = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                const result = await getUserData(parsedUser.id);
                if (result.success && result.user) {
                    setUser(result.user);
                    localStorage.setItem('user', JSON.stringify(result.user));
                } else {
                    setUser(parsedUser);
                }
            } catch (e) {
                console.error("Failed to parse or fetch user data", e);
                localStorage.removeItem('user');
                router.push('/login');
                return;
            }
        } else {
            router.push('/login');
            return;
        }

        await fetchVideos();
        setIsDataLoaded(true);
    };
    
    fetchInitialData();
  }, [router, toast]);

  const handleDelete = async (videoId: string) => {
    setIsDeleting(videoId);
    const result = await deleteApprovedVideo(videoId);
    if (result.success) {
        toast({ title: "Success", description: "Video has been deleted."});
        // Refetch videos to update the list
        await fetchVideos();
    } else {
        toast({ title: "Error", description: result.error || "Failed to delete video.", variant: "destructive"});
    }
    setIsDeleting(null);
  }

  const isAdmin = user?.username === 'zalakb0005';

  return (
    <SplashScreen isLoaded={isDataLoaded}>
        <main className="w-full min-h-screen">
        {user && (
            <>
            <header className="sticky top-0 z-40 border-b bg-green-600 text-white">
                <div className="flex items-center justify-between h-16 px-4">
                <div>
                    <h1 className="text-xl font-bold">Hello, {user.username}</h1>
                    <p className="text-sm text-white/80">Watch videos and earn coins</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 font-bold text-green-800 bg-white rounded-full">
                        <Coins className="w-5 h-5 text-green-600" />
                        <span>{user.coins.toLocaleString()}</span>
                    </div>
                    <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/20 hover:text-white">
                        <Link href="/wallet">
                            <Wallet className="w-5 h-5" />
                        </Link>
                    </Button>
                </div>
                </div>
            </header>

            <div className="px-4 py-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
                    <StatCard icon={Play} title="Videos Watched" value={0} iconBgColor="bg-red-100" iconColor="text-red-600" />
                    <StatCard icon={Coins} title="Total Coins" value={user.coins.toLocaleString()} iconBgColor="bg-amber-100" iconColor="text-amber-600" />
                    <StatCard icon={Star} title="Daily Bonus" value="Claim" asLink href="/daily-claim" iconBgColor="bg-green-100" iconColor="text-green-600" />
                    <StatCard icon={Bot} title="Submit URL" value="New" asLink href="/submit" iconBgColor="bg-purple-100" iconColor="text-purple-600" />
                </div>

                {/* Video Grid */}
                <h2 className="mb-6 text-2xl font-bold">Watch Videos & Earn Coins</h2>
                {videos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {videos.map((video) => (
                            <Card key={video.id} className="group flex flex-col h-full overflow-hidden transition-shadow duration-300 hover:shadow-lg">
                                <Link href={`/watch/${video.id}`} className="relative">
                                    <Image
                                        src={video.thumbnail}
                                        alt={video.title}
                                        width={400}
                                        height={225}
                                        className="object-cover w-full aspect-video"
                                        data-ai-hint={video.dataAiHint}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black/20 opacity-0 group-hover:opacity-100">
                                        <Play className="w-12 h-12 text-white" />
                                    </div>
                                </Link>
                                <CardContent className="flex flex-col flex-grow p-4">
                                    <Link href={`/watch/${video.id}`} className="flex-grow">
                                        <h3 className="mb-1 text-base font-semibold leading-tight transition-colors group-hover:text-primary">
                                            {video.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">Channel: {video.channel}</p>
                                    </Link>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-2 font-semibold text-amber-600">
                                            <Coins className="w-4 h-4" />
                                            <span>30 Coin Reward</span>
                                        </div>
                                        {isAdmin && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" className="h-8 w-8" disabled={isDeleting === video.id}>
                                                        {isDeleting === video.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the video. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(video.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center rounded-lg bg-card">
                        <h3 className="text-xl font-semibold">No Videos Available</h3>
                        <p className="mt-2 text-muted-foreground">New videos will be added soon.</p>
                    </div>
                )}
            </div>
            </>
        )}
        </main>
    </SplashScreen>
  );
}
