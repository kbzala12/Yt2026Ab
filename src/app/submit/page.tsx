
'use client';

import {useState, useEffect} from 'react';
import {useForm, SubmitHandler} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {useToast} from '@/hooks/use-toast';
import {Loader2, Wand2, Send, BadgeCheck, Coins, AlertTriangle} from 'lucide-react';
import {generateSummaryAndTranscript, getUserData} from '@/app/actions';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  videoUrl: z
    .string()
    .regex(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/, {
      message: 'Please enter a valid YouTube link.',
    }),
  title: z
    .string()
    .min(5, {message: 'Title must be at least 5 characters.'}),
  botId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface User {
  id: string;
  username: string;
  coins: number;
  submissionCount?: number;
}

const SUBMISSION_LIMIT = 3;
const SUBMISSION_COST = 1280;

export default function SubmitPage() {
  const {toast} = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const router = useRouter();

  const submissionsLeft = user?.submissionCount !== undefined ? SUBMISSION_LIMIT - user.submissionCount : SUBMISSION_LIMIT;
  const hasEnoughCoins = user ? user.coins >= SUBMISSION_COST : false;

  useEffect(() => {
    const fetchUserData = async () => {
        const storedUserString = localStorage.getItem('user');
        if (storedUserString) {
            try {
                const storedUser = JSON.parse(storedUserString);
                const result = await getUserData(storedUser.id);
                if (result.success && result.user) {
                    setUser(result.user);
                } else {
                    setUser(storedUser); // fallback to local
                }
            } catch (e) {
                 router.push('/login');
            }
        } else {
             router.push('/login');
        }
        setIsLoadingUser(false);
    };
    fetchUserData();
  }, [router]);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoUrl: '',
      title: '',
      botId: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async data => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit.',
        variant: 'destructive',
      });
      return;
    }
     if (submissionsLeft <= 0) {
      toast({
        title: 'Limit Reached',
        description: 'You have reached your submission limit.',
        variant: 'destructive',
      });
      return;
    }
     if (!hasEnoughCoins) {
        toast({
            title: 'Insufficient Coins',
            description: `You need ${SUBMISSION_COST} coins to submit a video.`,
            variant: 'destructive'
        });
        return;
    }


    setIsProcessing(true);

    try {
      const result = await generateSummaryAndTranscript(
        user.id,
        data.videoUrl,
        data.title,
        data.botId
      );

      if (result.success && result.user) {
        toast({
          title: 'Submitted! ✓',
          description: `Video has been sent for review. ${SUBMISSION_COST} coins have been deducted.`,
        });
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        form.reset(); // Reset form on success
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit video.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send />
            Submit Video
          </CardTitle>
          <CardDescription>
            Submit a YouTube URL. It will be processed and sent for review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="videoUrl"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>YouTube URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="title"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Video Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the video title here"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="botId"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Bot ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter bot ID if available" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="p-4 text-center bg-blue-100 text-blue-800 rounded-lg space-y-2">
                <p>You have <span className='font-bold'>{submissionsLeft}</span> submissions left.</p>
                <div className='flex items-center justify-center gap-2'>
                    <Coins className='h-4 w-4'/>
                    <span>Submission Cost: <span className='font-bold'>{SUBMISSION_COST} coins</span></span>
                </div>
              </div>

             {!hasEnoughCoins && user && (
                 <div className="p-4 text-center bg-destructive/10 text-destructive rounded-lg flex items-center justify-center gap-2">
                    <AlertTriangle className='h-5 w-5'/>
                    <p className='font-semibold'>You do not have enough coins to submit a video.</p>
                </div>
             )}

              <Button
                type="submit"
                disabled={isProcessing || !user || submissionsLeft <= 0 || !hasEnoughCoins}
                className="w-full"
              >
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isProcessing ? 'Processing...' : 'Submit for 1280 Coins'}
              </Button>

               {submissionsLeft <= 0 && user && (
                 <div className="p-4 text-center bg-green-100 text-green-800 rounded-lg flex items-center justify-center gap-2">
                    <BadgeCheck />
                    <p>You have successfully submitted all your URLs!</p>
                </div>
               )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
