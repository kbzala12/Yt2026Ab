
'use server';

import {transcribeVideo} from '@/ai/flows/transcribe-video';
import {summarizeVideo, type SummarySize} from '@/ai/flows/summarize-video';
import {getVideoDetails} from '@/ai/flows/get-video-details';
import {promises as fs} from 'fs';
import path from 'path';
import {revalidatePath} from 'next/cache';
import {format} from 'date-fns';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
const submissionsFilePath = path.join(dataDir, 'submissions.json');
const approvedVideosFilePath = path.join(dataDir, 'approved_videos.json');
const usersFilePath = path.join(dataDir, 'users.json');

const DAILY_COIN_LIMIT = 1500;
const DAILY_BONUS_AMOUNT = 10;
const SUBMISSION_LIMIT = 3;
const SUBMISSION_COST = 1280;

async function ensureDataFilesExist() {
  try {
    await fs.mkdir(dataDir, {recursive: true});
     try {
      await fs.access(submissionsFilePath);
    } catch (error) {
      await fs.writeFile(
        submissionsFilePath,
        JSON.stringify([], null, 2),
        'utf-8'
      );
    }
    try {
      await fs.access(approvedVideosFilePath);
    } catch (error) {
      await fs.writeFile(
        approvedVideosFilePath,
        JSON.stringify([], null, 2),
        'utf-8'
      );
    }
    try {
      await fs.access(usersFilePath);
    } catch (error) {
      await fs.writeFile(usersFilePath, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Could not create data directory or files', error);
  }
}

ensureDataFilesExist();

interface Submission {
  id: string;
  videoUrl: string;
  title: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string; // username
  botId?: string;
}

interface ApprovedVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  dataAiHint: string;
  submittedBy: string;
  videoUrl: string;
  botId?: string;
}

interface User {
  id: string;
  username: string;
  password?: string;
  coins: number;
  dailyCoins?: number;
  lastClaimDate?: string;
  lastDailyBonusClaimDate?: string;
  submissionCount?: number;
}

// --- Data Read/Write Functions ---

async function readData<T>(filePath: string): Promise<T[]> {
  try {
    await fs.access(filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    return [];
  }
}

async function writeData<T>(filePath: string, data: T[]): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const readSubmissions = () => readData<Submission>(submissionsFilePath);
const writeSubmissions = (data: Submission[]) => writeData(submissionsFilePath, data);
const readApprovedVideos = () => readData<ApprovedVideo>(approvedVideosFilePath);
const writeApprovedVideos = (data: ApprovedVideo[]) => writeData(approvedVideosFilePath, data);
const readUsers = () => readData<User>(usersFilePath);
const writeUsers = (data: User[]) => writeData(usersFilePath, data);

// --- App-specific Actions ---

function getYouTubeVideoId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.split('/')[1]?.split('?')[0];
        }
        if (urlObj.hostname.includes('youtube.com')) {
            const videoId = urlObj.searchParams.get('v');
            if (videoId) return videoId;
            // Handle /embed/ URLs
            const pathParts = urlObj.pathname.split('/');
            if (pathParts.includes('embed')) {
                return pathParts[pathParts.indexOf('embed') + 1]?.split('?')[0];
            }
             // Handle /shorts/ URLs
            if (pathParts.includes('shorts')) {
                return pathParts[pathParts.indexOf('shorts') + 1]?.split('?')[0];
            }
        }
        return null;
    } catch (e) {
        console.error('Error parsing youtube url', e);
        return null;
    }
}


export async function loginUser({username}: {username: string}) {
  const users = await readUsers();
  let user = users.find(u => u.username === username);

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {password, ...userWithoutPassword} = user;
    return {success: true, user: userWithoutPassword};
  } else {
    const newUser: User = {
      id: new Date().getTime().toString(),
      username: username,
      coins: 0,
      dailyCoins: 0,
      lastClaimDate: format(new Date(), 'yyyy-MM-dd'),
      lastDailyBonusClaimDate: '',
      submissionCount: 0,
    };
    users.push(newUser);
    await writeUsers(users);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {password, ...userWithoutPassword} = newUser;
    return {success: true, user: userWithoutPassword};
  }
}

export async function getUserData(userId: string) {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {password, ...userWithoutPassword} = user;
    return {success: true, user: userWithoutPassword};
  }
  return {success: false, error: 'User not found.'};
}

export async function claimDailyBonus(userId: string) {
  if (!userId) return {success: false, error: 'User ID is required.'};

  const users = await readUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) return {success: false, error: 'User not found.'};

  const today = format(new Date(), 'yyyy-MM-dd');
  const user = users[userIndex];

  if (user.lastDailyBonusClaimDate === today) {
    return {
      success: false,
      error: 'You have already claimed your daily bonus today. Try again tomorrow.',
    };
  }

  user.coins += DAILY_BONUS_AMOUNT;
  user.lastDailyBonusClaimDate = today;

  users[userIndex] = user;
  await writeUsers(users);

  revalidatePath('/wallet');
  revalidatePath('/daily-claim');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {password, ...userWithoutPassword} = user;
  return {
    success: true,
    user: userWithoutPassword,
    message: `You've received ${DAILY_BONUS_AMOUNT} coins!`,
  };
}

export async function generateSummaryAndTranscript(
  userId: string,
  videoUrl: string,
  title: string,
  botId?: string
) {
  if (!userId)
    return {success: false, error: 'User not found. Please log in.'};

  const users = await readUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return {success: false, error: 'User not found.'};

  const user = users[userIndex];
  
  if (user.submissionCount === undefined) user.submissionCount = 0;

  if (user.submissionCount >= SUBMISSION_LIMIT) {
     return {
      success: false,
      error: `You have reached your submission limit of ${SUBMISSION_LIMIT}.`,
    };
  }
  
  if (user.coins < SUBMISSION_COST) {
    return {
        success: false,
        error: `You do not have enough coins to submit a video. It costs ${SUBMISSION_COST} coins.`,
    }
  }

  const videoId = getYouTubeVideoId(videoUrl);
  if (!videoId) {
    return {success: false, error: 'Invalid YouTube URL provided.'};
  }

  try {
    // Deduct coins for submission
    user.coins -= SUBMISSION_COST;
    user.submissionCount += 1;
    users[userIndex] = user;

    const newSubmission: Submission = {
      id: videoId,
      videoUrl,
      title,
      botId: botId || '',
      submittedBy: user.username,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    const submissions = await readSubmissions();
    submissions.push(newSubmission);
    await writeSubmissions(submissions);

    // Write updated user data after successful submission
    await writeUsers(users);

    revalidatePath('/admin');
    revalidatePath('/submit');
    revalidatePath('/wallet');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {password, ...userWithoutPassword} = user;

    return {
      success: true,
      user: userWithoutPassword,
    };
  } catch (e) {
    console.error('Error in handleSummarize:', e);
    return {
      success: false,
      error: 'An unexpected error occurred during submission.',
    };
  }
}

export async function awardVideoWatchCoins(userId: string) {
  if (!userId) return {success: false, error: 'User ID is required.'};

  const users = await readUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) return {success: false, error: 'User not found.'};

  const today = format(new Date(), 'yyyy-MM-dd');
  const user = users[userIndex];

  if (user.lastClaimDate !== today) {
    user.dailyCoins = 0;
    user.lastClaimDate = today;
  }

  if ((user.dailyCoins || 0) >= DAILY_COIN_LIMIT) {
    return {
      success: false,
      error: `You have reached the daily coin limit of ${DAILY_COIN_LIMIT}.`,
    };
  }

  const rewardAmount = 30;
  const potentialNewDailyTotal = (user.dailyCoins || 0) + rewardAmount;

  if (potentialNewDailyTotal > DAILY_COIN_LIMIT) {
    return {
      success: false,
      error: `This reward would exceed the daily limit of ${DAILY_COIN_LIMIT}.`,
    };
  }

  user.coins += rewardAmount;
  user.dailyCoins = potentialNewDailyTotal;
  users[userIndex] = user;
  await writeUsers(users);

  revalidatePath('/wallet');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {password, ...userWithoutPassword} = user;
  return {success: true, user: userWithoutPassword};
}

export async function updateSubmissionStatus(
  submissionId: string,
  newStatus: 'approved' | 'rejected'
) {
  const submissions = await readSubmissions();
  const submissionIndex = submissions.findIndex(s => s.id === submissionId);
  if (submissionIndex === -1) {
    return {success: false, error: 'Submission not found.'};
  }

  const submission = submissions[submissionIndex];
  
  if (newStatus === 'approved') {
    const videoId = getYouTubeVideoId(submission.videoUrl);
    if (!videoId) {
      return {success: false, error: 'Invalid YouTube URL in submission.'};
    }
    
    try {
      const details = await getVideoDetails({ videoUrl: submission.videoUrl, title: submission.title });
      const newVideo: ApprovedVideo = {
        id: videoId,
        title: submission.title,
        channel: details.channel || 'Unknown Channel',
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        dataAiHint: 'user submitted',
        submittedBy: submission.submittedBy,
        videoUrl: submission.videoUrl,
        botId: submission.botId
      };

      const approvedVideos = await readApprovedVideos();
      // Add to the end of the list
      approvedVideos.push(newVideo);
      await writeApprovedVideos(approvedVideos);
      
      // Remove from submissions
      submissions.splice(submissionIndex, 1);
      await writeSubmissions(submissions);

    } catch (e) {
      console.error('AI call failed during approval', e);
      return { success: false, error: 'Failed to get video details from AI.' };
    }

  } else { // Rejected
     submissions.splice(submissionIndex, 1);
     await writeSubmissions(submissions);
  }

  revalidatePath('/admin');
  revalidatePath('/');
  return {success: true};
}

export async function deleteAllSubmissions() {
    await writeSubmissions([]);
    revalidatePath('/admin');
    return { success: true, message: 'All submissions have been deleted.' };
}

export async function adminAddVideo(videoUrl: string, title: string, submittedBy: string, botId?: string) {
    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) {
        return { success: false, error: 'Invalid YouTube URL' };
    }

    try {
        const details = await getVideoDetails({ videoUrl, title });
        const newVideo: ApprovedVideo = {
            id: videoId,
            title,
            channel: details.channel || 'Unknown Channel',
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            dataAiHint: 'admin submitted',
            videoUrl,
            submittedBy,
            botId,
        };
        const approvedVideos = await readApprovedVideos();
        approvedVideos.push(newVideo);
        await writeApprovedVideos(approvedVideos);
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch(e) {
        console.error("Failed to add video via admin panel", e);
        return { success: false, error: 'Failed to get video details from AI.' };
    }
}

export async function deleteApprovedVideo(videoId: string) {
    let approvedVideos = await readApprovedVideos();
    const initialLength = approvedVideos.length;
    approvedVideos = approvedVideos.filter(v => v.id !== videoId);

    if (approvedVideos.length === initialLength) {
        return { success: false, error: 'Video not found.' };
    }

    await writeApprovedVideos(approvedVideos);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, message: 'Video successfully deleted.' };
}
