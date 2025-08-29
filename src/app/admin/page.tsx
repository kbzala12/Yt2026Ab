
'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Loader2, Users, FileVideo, Check, X, Trash2, PlusCircle} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {Button} from '@/components/ui/button';
import {
  updateSubmissionStatus,
  deleteAllSubmissions,
  adminAddVideo,
  deleteApprovedVideo
} from '@/app/actions';
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
  } from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  username: string;
  coins: number;
}

interface Submission {
  id: string;
  videoUrl: string;
  title: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  botId?: string;
}

interface ApprovedVideo {
    id: string;
    title: string;
    submittedBy: string;
    botId?: string;
    videoUrl: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [approvedVideos, setApprovedVideos] = useState<ApprovedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoBotId, setNewVideoBotId] = useState('');

  const router = useRouter();
  const {toast} = useToast();

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, submissionsRes, approvedRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/submissions'),
        fetch('/api/approved-videos')
      ]);
      const usersData = await usersRes.json();
      const submissionsData = await submissionsRes.json();
      const approvedData = await approvedRes.json();

      setUsers(usersData);
      setSubmissions(submissionsData);
      setApprovedVideos(approvedData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch admin data.',
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.username !== 'zalakb0005') {
        toast({
          title: 'Access Denied',
          description: 'You are not authorized to view this page.',
          variant: 'destructive',
        });
        router.push('/');
      } else {
        fetchAdminData();
      }
    } else {
      toast({
        title: 'Login Required',
        description: 'Please log in to view this page.',
        variant: 'destructive',
      });
      router.push('/login');
    }
  }, [router, toast]);

  const handleStatusUpdate = async (
    id: string,
    status: 'approved' | 'rejected'
  ) => {
    setIsProcessing(id);
    const result = await updateSubmissionStatus(id, status);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Submission has been updated.',
      });
      await fetchAdminData();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update submission.',
        variant: 'destructive',
      });
    }
    setIsProcessing(null);
  };

  const handleDeleteAll = async () => {
    setIsProcessing('delete-all');
    const result = await deleteAllSubmissions();
    if(result.success) {
        toast({ title: 'Success', description: result.message });
        await fetchAdminData();
    } else {
        toast({ title: 'Error', description: 'Failed to delete submissions.', variant: 'destructive' });
    }
    setIsProcessing(null);
  }

  const handleAdminAddVideo = async () => {
    if(!newVideoUrl || !newVideoTitle) {
        toast({title: 'Error', description: 'URL and title are required.', variant: 'destructive'});
        return;
    }
    setIsProcessing('add-manual');
    const result = await adminAddVideo(newVideoUrl, newVideoTitle, user!.username, newVideoBotId);
    if(result.success) {
        toast({title: 'Success', description: 'Video added successfully.'});
        setNewVideoUrl('');
        setNewVideoTitle('');
        setNewVideoBotId('');
        await fetchAdminData();
    } else {
        toast({title: 'Error', description: result.error || 'Failed to add video.', variant: 'destructive'});
    }
    setIsProcessing(null);
  }

  const handleVideoDelete = async (videoId: string) => {
    setIsProcessing(videoId);
    const result = await deleteApprovedVideo(videoId);
    if (result.success) {
        toast({ title: 'Success', description: result.message });
        await fetchAdminData();
    } else {
        toast({ title: 'Error', description: result.error || 'Failed to delete video.', variant: "destructive" });
    }
    setIsProcessing(null);
  }

  if (isLoading || !user || user.username !== 'zalakb0005') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 max-w-6xl mx-auto space-y-8">
      {/* Manual Add Video */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <PlusCircle />
                Add Video Manually
            </CardTitle>
            <CardDescription>Add an approved video directly to the homepage.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                    <Label htmlFor='video-url'>YouTube Video URL</Label>
                    <Input id='video-url' value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} placeholder='https://youtube.com/watch?v=...' />
                </div>
                 <div>
                    <Label htmlFor='video-title'>Video Title</Label>
                    <Input id='video-title' value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} placeholder="Enter the video title" />
                </div>
                 <div>
                    <Label htmlFor='bot-id'>Bot ID (Optional)</Label>
                    <Input id='bot-id' value={newVideoBotId} onChange={(e) => setNewVideoBotId(e.target.value)} placeholder="Enter bot ID" />
                </div>
            </div>
            <Button onClick={handleAdminAddVideo} disabled={isProcessing === 'add-manual'}>
                {isProcessing === 'add-manual' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Video
            </Button>
        </CardContent>
      </Card>

      {/* Pending Submissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                <FileVideo />
                Pending Submissions ({submissions.length})
                </CardTitle>
                <CardDescription>
                Review and approve or reject user-submitted videos.
                </CardDescription>
            </div>
            {submissions.length > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isProcessing === 'delete-all'}>
                            {isProcessing === 'delete-all' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete All
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This action cannot be undone. This will permanently delete all pending submissions.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>YouTube Video URL</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Bot ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length > 0 ? (
                submissions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.title}</TableCell>
                    <TableCell>
                      <a href={s.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Watch Video
                      </a>
                    </TableCell>
                    <TableCell>{s.submittedBy}</TableCell>
                    <TableCell>{s.botId || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(s.id, 'approved')}
                        disabled={!!isProcessing}
                      >
                        {isProcessing === s.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStatusUpdate(s.id, 'rejected')}
                        disabled={!!isProcessing}
                      >
                        {isProcessing === s.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No pending submissions.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approved Videos */}
      <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Check />
                    Approved Videos ({approvedVideos.length})
                </CardTitle>
                <CardDescription>List of all live videos on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Bot ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {approvedVideos.length > 0 ? approvedVideos.map((v) => (
                            <TableRow key={v.id}>
                                <TableCell className="font-medium">
                                    <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                        {v.title}
                                    </a>
                                </TableCell>
                                <TableCell>{v.submittedBy}</TableCell>
                                <TableCell>{v.botId || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" disabled={!!isProcessing}>
                                                {isProcessing === v.id ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action will permanently delete the video from the live site. It cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleVideoDelete(v.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No approved videos yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users />
            All Users ({users.length})
          </CardTitle>
          <CardDescription>
            View all registered users and their coin balances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Coins</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell className="text-right">
                      {u.coins.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
