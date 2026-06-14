import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, Video, Upload, Shield, Globe, Trash2, Copy, Check, 
  MapPin, Compass, User, PlusCircle, Play, Pause, Volume2, 
  VolumeX, Heart, MessageCircle, Share2, Loader2, Sparkles, 
  Camera, Info, AlertCircle, CheckCircle2, ChevronRight, X, Edit, Users
} from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ShelbyService, type WalletState } from './services/shelby';
import { 
  type UploadedFile, type UserProfile, type VideoComment,
  saveProfile, getProfile, followCreator, unfollowCreator, getFollows,
  getFollowersCount, likeVideo, unlikeVideo, isVideoLiked, 
  getVideoLikesCount, addComment, getVideoComments,
  getAllPublicFiles
} from './services/db';



// Prepopulated profiles for demo creators
const DEMO_PROFILES: Record<string, UserProfile> = {
  '0x3a2c2864efab52b901bc74cd78a87612f00a876a3a2c2864efab52b901bc109f': {
    address: '0x3a2c2864efab52b901bc74cd78a87612f00a876a3a2c2864efab52b901bc109f',
    name: 'Hiroshi Sato 🗼',
    bio: 'Tokyo native documenting hidden gems, street food spots, and neon night vibes in Japan.',
    avatar: '🗼'
  },
  '0x991f8876efab52b901bc74cd78a87612f00a876a3a2c2864efab52b901bce304d': {
    address: '0x991f8876efab52b901bc74cd78a87612f00a876a3a2c2864efab52b901bce304d',
    name: 'Mai Nguyen 🌾',
    bio: 'Chasing sunsets, mountain treks, and rustic landscapes around Southeast Asia.',
    avatar: '🎒'
  },
  '0xbc128876efab52b901bc74cd78a87612f00a876a3a2c2864efab52b901bcfa88e': {
    address: '0xbc128876efab52b901bc74cd78a87612f00a876a3a2c2864efab52b901bcfa88e',
    name: 'Alex Wanderer 📸',
    bio: 'Professional filmmaker finding secret spots. Currently exploring islands in Indonesia.',
    avatar: '🌴'
  },
  '0x7b118876efab52b901bc74cd78a87612f00a876a3a2c2864efab52b901bc99eef': {
    address: '0x7b118876efab52b901bc74cd78a87612f00a876a3a2c2864efab52b901bc99eef',
    name: 'Sarah Sun 🌊',
    bio: 'Beach lover, scuba diver, and ocean protector. Paradise seeker.',
    avatar: '🌊'
  }
};

// Emojis for avatar selection
const AVATAR_OPTIONS = ['🧭', '🎒', '📸', '🌴', '✈️', '🏔️', '🌊', '🍜', '🗼', '🎪', '🦁', '🛹', '⛺', '⚓', '🏄'];



interface FeedVideoItem {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  videoUrl: string;
  ownerAddress: string;
  uploadedAt: string;
  likesCount: number;
  commentsCount: number;
  isDemo?: boolean;
  fileRecord?: UploadedFile;
}

const PETRA_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAZCAYAAABQDyyRAAACkElEQVR4AbxVO2wTQRB9rD/n2OAE4zghsRJ+iZQOiRaoQ8uno6AjBQUlBSX0QaKgRKJB4lOnoQm0SCAhIgVwEnBCfDGObWLnzr/LzPnOunPO8Tnxxdq3u7MzO29md7wnNKWsWfFn6Zv2dfGDJq+mtKKc6SuUwraNi3kFLL/0Sgr5f1lMTM0gFI5YNP2ZVtQKVFW1OWsFIG+sI7eVQfLiNHw+n82onwIHUa1UWi71AHZLO1j7sYyzE+c9JTdZFUVFo9HQRT2A9GoKifGkJ8euszh05lWIAt35bqmEWGLUwQyYu5M4Ehyd0mKtWkO9VoOQNzeIfISWjr9VqlWI4nYeg7H4odjjdGgzlwHGYRzwKYhT0SHae4Lgvl2fBeZfA88Ij+cBBsu37rn3YVqKcPSkOXc1Msn9R8AwZW/dwPJNCuDGbetq97mQQuHuVoYFZ84khug43H0ARHrISQSkkKMjp0Ur+dIX4N1LO8o7zV3XZpujm174fPpT0NV28hJsx/6dAnhPAZjgf3HYyJxtuzo0DNyxk7HpnKb72hzVhDXrrc19Jh0XRL3efBI7WhgKLjJjahvayVn5cYF7dxBVVXFn6WDFQV25aldwXfR0AqpStnvoQWKiJw8Bs/iYnGuiBxcQ5aJRul120QcTXHgmssY9r/0EOIhXz4FeyZlS/C/madQIB7fPn4CnlK2JRcs9cxALbw/e30kroqeHUMhlO+k9XfcH/BCJ0THk5IynRJ2cBwMBiMEzcQxEIhSEcalt1i/eyDgK2ty1RM7e56cT4JXkuQuQ19NQyiUWjwWSJOk8+ks4QF+Pyalp/P29gnq9riu87EIhCULo1Gj2xJYYG0dseATpX8ueBhGUgggEg8TYbHsAAAD//+keTVcAAAAGSURBVAMAFglcF1kczz0AAAAASUVORK5CYII=";
const METAMASK_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjU2IDI0MCI+PHBhdGggZmlsbD0iI0UxNzcyNiIgZD0iTTI1MC4wNjYgMEwxNDAuMjE5IDgxLjI3OWwyMC40MjctNDcuOXoiLz48cGF0aCBmaWxsPSIjRTI3NjI1IiBkPSJtNi4xOTEuMDk2bDg5LjE4MSAzMy4yODlsMTkuMzk2IDQ4LjUyOHpNMjA1Ljg2IDE3Mi44NThsNDguNTUxLjkyNGwtMTYuOTY4IDU3LjY0MmwtNTkuMjQzLTE2LjMxMXptLTE1NS43MjEgMGwyNy41NTcgNDIuMjU1bC01OS4xNDMgMTYuMzEybC0xNi44NjUtNTcuKE4zeiIvPjxwYXRoIGZpbGw9IiNFMjc2MjUiIGQ9Im0xMTIuMTMxIDY5LjU1MmwxLjk4NCA2NC4wODNsLTU5LjM3MS0yLjcwMWwxNi44ODgtMjUuNDc4bC4yMTQtLjI0NXptMzEuMTIzLS43MTVsNDAuOSAzNi4zNzZsLjIxMi4yNDRsMTYuODg4IDI1LjQ3OGwtNTkuMzU4IDIuN3pNNzkuNDM1IDE3My4wNDRsMzIuNDE4IDI1LjI1OWwtMzcuNjU4IDE4LjE4MXptOTcuMTM2LS4wMDRsNS4xMzEgNDMuNDQ1bC0zNy41NTMtMTguMTg0eiIvPjxwYXRoIGZpbGw9IiNENUJGQjIiIGQ9Im0xNDQuOTc4IDE5NS45MjJsMzguMTA3IDE4LjQ1MmwtMzUuNDQ3IDE2Ljg0NmwuMzY4LTExLjEzNHptLTMzLjk2Ny4wMDhsLTIuOTA5IDIzLjk3NGwuMjM5IDExLjMwM2wtMzUuNTMtMTYuODMzeiIvPjxwYXRoIGZpbGw9IiMyMzM0NDciIGQ9Im0xMDAuMDA3IDE0MS45OTlsOS45NTggMjAuOTI4bC0zMy45MDMtOS45MzJ6bTU1Ljk4NS4wMDJsMjQuMDU4IDEwLjk5NGwtMzQuMDE0IDkuOTI5eiIvPjxwYXRoIGZpbGw9IiNDQzYyMjgiIGQ9Im04Mi4wMjYgMTcyLjgzbC01LjQ4IDQ1LjA0bC0yOS4zNzMtNDQuMDU1em05MS45NS4wMDFsMzQuODU0Ljk4NGwtMjkuNDgzIDQ0LjA1N3ptMjguMTM2LTQ0LjQ0NGwtMjUuMzY1IDI1Ljg1MWwtMTkuNTU3LTguOTM3bC05LjM2MyAxOS42ODRsLTYuMTM4LTMzLjg0OXptLTE0OC4yMzcgMGw2MC40MzUgMi43NDlsLTYuMTM5IDMzLjg0OWwtOS4zNjUtMTkuNjgxbC0xOS40NTMgOC45MzV6Ii8+PHBhdGggZmlsbD0iI0UyNzUyNSIgZD0ibTUyLjE2NiAxMjMuMDgybDI4LjY5OCAyOS4xMjFsLjk5NCAyOC43NDl6bTE1MS42OTctLjA1MmwtMjkuNzQ2IDU3Ljk3M2wxLjEyLTI4Ljh6bS05MC45NTYgMS44MjZsMS4xNTUgNy4yN2wyLjg1NCAxOC4xMTFsLTEuODM1IDU1LjYyNWwtOC42NzUtNDQuNjg1bC0uMDAzLS40NjJ6bTMwLjE3MS0uMTAxbDYuNTIxIDM1Ljk2bC0uMDAzLjQ6bWwtOC42OTcgNDQuNzk7bC0uMzQ0LTExLjIwNWwtMS4zNTctNDQuODYyeiIvPjxwYXRoIGZpbGw9IiNGNTg0MUYiIGQ9Im0xNzcuNzg4IDE1MS4wNDZsLS45NzEgMjQuOTc4bC0zMC4yNzQgMjMuNTg3bC02LjEyLTQuMzI0bDYuODYtMzUuMzM1em0tOTkuNDcxIDBsMzAuMzk5IDguOTA2bDYuODYgMzUuMzM1bC02LjEyIDQuMzI0bC0zMC4yNzUtMjMuNTg5eiIvPjxwYXRoIGZpbGw9IiNDMEFDOUQiIGQ9Im02Ny4wMTggMjA4Ljg1OGwzOC43MzIgMTguMzUybC0uMTY0LTcuODM3bDMuMjQxLTIuODQ1aDM4LjMzNGwzLjM1OCAyLjgzNWwtLjI0OCA3LjgzMWwzOC40ODctMTguMjlsLTE4LjcyOCAxNS40NzZsLTIyLjY0NSAxNS41NTNoLTM4Ljg2OWwtMjIuNjMtMTUuNjE3eiIvPjxwYXRoIGZpbGw9IiMxNjE2MTYiIGQ9Im0xNDIuMjA0IDE5My40NzlsNS40NzYgMy44NjlsMy4yMDkgMjUuNjA0bC00LjY0NC0zLjkyMWgtMzYuNDc2bC00LjU1NiA0bDMuMTA0LTI1LjY4MWw1LjQ3OC0zLjg3MXoiLz48cGF0aCBmaWxsPSIjNzYzRTFBIiBkPSJNMjQyLjgxNCAyLjI1TDI1NiA0MS44MDdsLTguMjM1IDM5Ljk5N2w1Ljg2NCA0LjkyM2wtNy45MzUgNi4wNTRsNS45NjQgNC42MDZsLTcuODk3IDcuMTkxbDQuODQ4IDMuNTExbC0xMi44NjYgMTUuMDI2bC01Mi43Ny0xNS4zNjVsLS40NTctLjI0NWwtMzguMDI3LTMyLjA3OHptLTIyOS42MjggMGw5OC4zMjYgNzIuNzc3bC0zOC4wMjggMzIuMDc4bC0uNDU3LjI0NWwtNTIuNzcgMTUuMzY1bC0xMi44NjYtMTUuMDI2bDQuODQ0LTMuNTA4bC03Ljg5Mi03LjE5NGw1Ljk1Mi00LjYwMWwtOC4wNTQtNi4wNzFsNi4wODUtNC41MjZMMCA0MS44MDl6Ii8+PHBhdGggZmlsbD0iI0Y1ODQxRiIgZD0ibTE4MC4zOTIgMTAzLjk5bDU1LjkxMyAxNi4yNzlsMTguMTY1IDU1Ljk4NmgtNDtwY2U5MThsLTMzLjAyLmdxMTggMjQuMDU5MSAyMS43MDA1IDI0LjA1OTEgMjEuNzIyNiAyNC4wN20tMTA0Ljc4NCAwbC0xNy4xNTEgMjUuODczbDI0LjAxNyA0Ni44MDhsLTMzLjAwNS0uNDE2SDEuNjMxbDE4LjA2My01NS45ODV6bTguNzc2LTcwLjg3OGwtMTUuNjM5IDQyLjIzOWwtMy4zMTkgNU8uMDZsLTEuMjcgMTcuODg1bC0uMTAxIDQ1LjY4OGgtMzAuMTExbC0uMDk4LTQ5LjYwMmwtMS4yNzQtMTcuOTg2bC0zLjMyLTU3LjA0NWwtMTUuNjM3LTg0LjIzOXoiLz48L3N2Zz4=";
const OKX_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJDSURBVHgB7Zq9jtpAEMfHlhEgQLiioXEkoAGECwoKxMcTRHmC5E3IoyRPkPAEkI7unJYmTgEFTYwA8a3NTKScLnCHN6c9r1e3P2llWQy7M/s1Gv1twCP0ej37dDq9x+Zut1t3t9vZjDEHIiSRSPg4ZpDL5fxkMvn1cDh8m0wmfugfO53OoFQq/crn8wxfY9EymQyrVCqMfHvScZx1p9ls3pFxXBy/bKlUipGPrVbLuQqAfsCliq3zl0H84zwtjQrOw4Mt1W63P5LvBm2d+Xz+YzqdgkqUy+WgWCy+Mc/nc282m4FqLBYL+3g8fjDxenq72WxANZbLJeA13zDX67UDioL5ybXwafMYu64Ltn3bdDweQ5R97fd7GyhBQMipx4POeEDHIu2LfDdBIGGz+hJ9CQ1ABjoA2egAZPM6AgiCAEQhsi/C4jHyPA/6/f5NG3Ks2+3CYDC4aTccDrn6ojG54MnEvG00GoVmWLIRNZ7wTCwDHYBsdACy0QHIhiuRETxlICWpMMhGZHmqS8qH6JLyGegAZKMDkI0uKf8X4SWlaZo+Pp1bRrwlJU8ZKLIvUjKh0WiQ3sRUbNVq9c5Ebew7KEo2m/1p4jJ4qAmDaqDQBzj5XyiAT4VCQezJigAU+IDU+z8vJFnGWeC+bKQV/5VZ71FV6L7PA3gg3tXrdQ+DgLhC+75Wq3no69P3MC0NFQpx2lL04Ql9gHK1bRDjsSBIvScBnDTk1WxlGIZBorIDEYJj+rhdgnQ67VmWRe0zlplXl81vcyEt0rSoYDUAAAAASUVORK5CYII=";

let isGloballyMuted = false;

function App() {
  const { 
    connected: aptosConnected, 
    account: aptosAccount, 
    wallet: aptosWallet,
    wallets,
    connect: aptosConnect, 
    disconnect: aptosDisconnect,
    signMessage: aptosSignMessage,
    signAndSubmitTransaction: aptosSignAndSubmitTransaction
  } = useWallet();

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'feed' | 'record' | 'profile'>('feed');
  const [feedFilter, setFeedFilter] = useState<'all' | 'following'>('all');

  // Wallet
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: '',
    walletType: null,
    network: 'simulated',
    balanceAPT: 0,
    balanceSHELBYUSD: 0,
    isMock: false,
  });

  // User Self-Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('🧭');

  // Follow states
  const [followingList, setFollowingList] = useState<string[]>([]);
  
  // Creator Profile Modal Overlay
  const [selectedCreatorAddress, setSelectedCreatorAddress] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<UserProfile | null>(null);
  const [creatorFollowers, setCreatorFollowers] = useState(0);
  const [creatorVideos, setCreatorVideos] = useState<FeedVideoItem[]>([]);

  // Comments State
  const [activeCommentVideoId, setActiveCommentVideoId] = useState<string | null>(null);
  const [activeCommentsList, setActiveCommentsList] = useState<VideoComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Likes Local States Sync
  const [likedVideoIds, setLikedVideoIds] = useState<Record<string, boolean>>({});

  // DB files
  const [dbFiles, setDbFiles] = useState<UploadedFile[]>([]);
  const [publicFeedFiles, setPublicFeedFiles] = useState<UploadedFile[]>([]);
  const [feedItems, setFeedItems] = useState<FeedVideoItem[]>([]);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  // Sound
  const [muted, setMuted] = useState(isGloballyMuted);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string>('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  
  // Form Upload Metadata
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadLoc, setUploadLoc] = useState('');
  const [uploadCat, setUploadCat] = useState('Nature');
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Upload status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<any>(null);

  // Toast / Modals
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Sync wallet adapter state to wallet state
  useEffect(() => {
    if (aptosConnected && aptosAccount) {
      const rawAddress = aptosAccount.address.toString();
      let hex = rawAddress.startsWith('0x') ? rawAddress.substring(2) : rawAddress;
      while (hex.length < 64) hex = '0' + hex;
      const address = '0x' + hex;
      
      const walletName = aptosWallet?.name || 'wallet';
      const walletType = (walletName.toLowerCase().includes('petra') ? 'petra' : 'okx') as any;

      const fetchBalance = async () => {
        let actualBalance = 0.0;
        let activeNetwork = 'shelbynet';
        
        for (const net of ['devnet', 'testnet', 'mainnet']) {
          try {
            const res = await fetch(`https://api.${net}.aptoslabs.com/v1/accounts/${address}/resources`);
            if (res.ok) {
              const resources = await res.json();
              const store = resources.find((r: any) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
              if (store && store.data && store.data.coin) {
                actualBalance = parseInt(store.data.coin.value) / 100000000;
                activeNetwork = net === 'mainnet' ? 'Aptos Mainnet' : net === 'testnet' ? 'Aptos Testnet' : 'Aptos Devnet';
                break;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        setWallet(prev => ({
          ...prev,
          connected: true,
          address,
          walletType,
          network: activeNetwork as any,
          balanceAPT: actualBalance,
          balanceSHELBYUSD: actualBalance * 15.4,
          isMock: false,
        }));
      };

      fetchBalance();
      showToast(`Connected to ${walletName}!`, 'success');
    } else if (!aptosConnected && wallet.connected && !wallet.isMock) {
      setWallet({
        connected: false,
        address: '',
        walletType: null,
        network: 'simulated',
        balanceAPT: 0,
        balanceSHELBYUSD: 0,
        isMock: false,
      });
    }
  }, [aptosConnected, aptosAccount, aptosWallet]);

  // Load profile, files, follows, likes initially
  useEffect(() => {
    console.log("EFFECT: Load initial files & social data. Wallet status:", wallet.connected, wallet.address);
    loadUserFiles();
    loadFeedFiles();
    loadProfileAndSocial();
  }, [wallet.connected, wallet.address]);

  // Re-build feed whenever files or social states changes
  useEffect(() => {
    console.log("EFFECT: Trigger buildFeed. publicFeedFiles length:", publicFeedFiles.length);
    buildFeed();
  }, [publicFeedFiles, wallet.connected, wallet.address]);

  const loadFeedFiles = async () => {
    console.log("loadFeedFiles called");
    try {
      const publicFiles = await getAllPublicFiles();
      console.log("loadFeedFiles fetched public files count:", publicFiles.length);
      setPublicFeedFiles(publicFiles);
    } catch (err) {
      console.error('Failed to load public feed files:', err);
    }
  };

  const loadUserFiles = async () => {
    console.log("loadUserFiles called");
    if (wallet.connected) {
      try {
        const userFiles = await ShelbyService.getFiles(wallet.address);
        console.log("loadUserFiles fetched owner files count:", userFiles.length);
        setDbFiles(userFiles);
      } catch (err) {
        console.error('Failed to load user files:', err);
      }
    } else {
      console.log("loadUserFiles wallet disconnected, clearing dbFiles");
      setDbFiles([]);
    }
  };

  const loadProfileAndSocial = async () => {
    if (!wallet.connected) {
      setUserProfile(null);
      setFollowingList([]);
      return;
    }

    try {
      // 1. Fetch user's profile
      let prof = await getProfile(wallet.address);
      if (!prof) {
        // Create a default initial profile
        prof = {
          address: wallet.address,
          name: `Explorer_${wallet.address.slice(2, 6)}`,
          bio: 'Wanderer seeking new destinations! 🧭',
          avatar: '🧭'
        };
        await saveProfile(prof);
      }
      setUserProfile(prof);
      setEditName(prof.name);
      setEditBio(prof.bio);
      setEditAvatar(prof.avatar);

      // 2. Fetch following list
      const following = await getFollows(wallet.address);
      setFollowingList(following);

      // 3. Prepopulate demo profiles in DB if they aren't there
      for (const addr of Object.keys(DEMO_PROFILES)) {
        const p = await getProfile(addr);
        if (!p) {
          await saveProfile(DEMO_PROFILES[addr]);
        }
      }
    } catch (e) {
      console.error('Error loading profiles or social data:', e);
    }
  };

  // Build feed combining demo content and DB uploads
  const buildFeed = async () => {
    console.log("buildFeed starting...");
    const localVideos: FeedVideoItem[] = publicFeedFiles
      .filter(f => !f.isPrivate && (f.type.startsWith('video/') || f.name.endsWith('.mp4') || f.name.endsWith('.webm') || f.name.endsWith('.mov')))
      .map(f => {
        let vUrl = f.shareableUrl || '';
        if (!vUrl || vUrl.includes('/#/share/')) {
          const blob = new Blob([f.data as any], { type: f.type });
          vUrl = URL.createObjectURL(blob);
        }

        let title = f.name.replace(/\.[^/.]+$/, ""); 
        let desc = 'Travel diary shared securely on Shelby Protocol!';
        let loc = 'GoodTrip Location';
        let cat = 'Nature';

        if (f.name.includes('|')) {
          const parts = f.name.split('|');
          title = parts[0] || title;
          desc = parts[1] || desc;
          loc = parts[2] || loc;
          cat = parts[3] || cat;
        }

        return {
          id: f.id,
          title,
          description: desc,
          location: loc,
          category: cat,
          videoUrl: vUrl,
          ownerAddress: f.ownerAddress,
          uploadedAt: f.uploadedAt,
          likesCount: 0,
          commentsCount: 0,
          isDemo: false,
          fileRecord: f
        };
      });

    // Merge uploads
    const allClips = [...localVideos];

    // Read likes and comments counts from IndexedDB asynchronously
    const loadedLikesMap: Record<string, boolean> = {};
    const likesCountMap: Record<string, number> = {};
    const commentsCountMap: Record<string, number> = {};

    for (const item of allClips) {
      // Likes
      if (wallet.connected) {
        loadedLikesMap[item.id] = await isVideoLiked(wallet.address, item.id);
      } else {
        loadedLikesMap[item.id] = false;
      }
      
      const dbLikes = await getVideoLikesCount(item.id);
      // Give demo videos a baseline set of likes
      const baselineLikes = item.isDemo ? (item.id === 'demo-1' ? 342 : item.id === 'demo-2' ? 512 : item.id === 'demo-3' ? 819 : 245) : 0;
      likesCountMap[item.id] = baselineLikes + dbLikes;

      // Comments
      const comments = await getVideoComments(item.id);
      const baselineComments = item.isDemo ? (item.id === 'demo-1' ? 24 : item.id === 'demo-2' ? 47 : item.id === 'demo-3' ? 53 : 18) : 0;
      commentsCountMap[item.id] = baselineComments + comments.length;
    }

    setLikedVideoIds(loadedLikesMap);

    const sortedFeed = allClips.map(clip => ({
      ...clip,
      likesCount: likesCountMap[clip.id] || 0,
      commentsCount: commentsCountMap[clip.id] || 0
    }));

    // Sort by upload date descending
    sortedFeed.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    setFeedItems(sortedFeed);
    setHasMoreFeed(sortedFeed.length > visibleCount);
  };

  // Toggle Like Interaction
  const handleToggleLike = async (videoId: string) => {
    if (!wallet.connected) {
      setIsWalletModalOpen(true);
      showToast('Connect your wallet to like posts!', 'info');
      return;
    }

    const currentLiked = !!likedVideoIds[videoId];
    try {
      if (currentLiked) {
        await unlikeVideo(wallet.address, videoId);
        setLikedVideoIds(prev => ({ ...prev, [videoId]: false }));
        setFeedItems(prev => prev.map(item => item.id === videoId ? { ...item, likesCount: Math.max(0, item.likesCount - 1) } : item));
        showToast('Post unliked');
      } else {
        await likeVideo(wallet.address, videoId);
        setLikedVideoIds(prev => ({ ...prev, [videoId]: true }));
        setFeedItems(prev => prev.map(item => item.id === videoId ? { ...item, likesCount: item.likesCount + 1 } : item));
        showToast('Added to liked trips!', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Comments Drawer
  const handleOpenComments = async (videoId: string) => {
    try {
      setActiveCommentVideoId(videoId);
      const list = await getVideoComments(videoId);
      setActiveCommentsList(list);
    } catch (err) {
      console.error(err);
    }
  };

  // Post Comment Handler
  const handlePostComment = async () => {
    if (!wallet.connected) {
      setIsWalletModalOpen(true);
      showToast('Connect wallet to post comments!', 'info');
      return;
    }
    if (!activeCommentVideoId || !newCommentText.trim()) return;

    try {
      const added = await addComment(activeCommentVideoId, wallet.address, newCommentText.trim());
      setActiveCommentsList(prev => [...prev, added]);
      setFeedItems(prev => prev.map(item => item.id === activeCommentVideoId ? { ...item, commentsCount: item.commentsCount + 1 } : item));
      setNewCommentText('');
      showToast('Comment posted successfully!', 'success');
    } catch (err) {
      showToast('Could not post comment.', 'error');
    }
  };

  // Save Self Profile edits
  const handleSaveProfile = async () => {
    if (!wallet.connected || !editName.trim()) return;

    try {
      const updated: UserProfile = {
        address: wallet.address,
        name: editName.trim(),
        bio: editBio.trim(),
        avatar: editAvatar
      };
      await saveProfile(updated);
      setUserProfile(updated);
      setIsProfileModalOpen(false);
      showToast('Profile updated successfully!', 'success');
      await buildFeed(); // Reload cards to reflect your profile update
    } catch (err) {
      showToast('Failed to save profile.', 'error');
    }
  };

  // Follow / Unfollow Creator
  const handleToggleFollowCreator = async (creatorAddr: string) => {
    if (!wallet.connected) {
      setIsWalletModalOpen(true);
      showToast('Connect your wallet to follow creators!', 'info');
      return;
    }

    if (creatorAddr === wallet.address) {
      showToast('You cannot follow yourself!', 'error');
      return;
    }

    const isFollowing = followingList.includes(creatorAddr);
    try {
      if (isFollowing) {
        await unfollowCreator(wallet.address, creatorAddr);
        setFollowingList(prev => prev.filter(a => a !== creatorAddr));
        setCreatorFollowers(prev => Math.max(0, prev - 1));
        showToast('Creator unfollowed.');
      } else {
        await followCreator(wallet.address, creatorAddr);
        setFollowingList(prev => [...prev, creatorAddr]);
        setCreatorFollowers(prev => prev + 1);
        showToast('Following creator!', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Creator Profile Modal overlay
  const handleOpenCreatorProfile = async (creatorAddr: string) => {
    setSelectedCreatorAddress(creatorAddr);
    try {
      let prof = await getProfile(creatorAddr);
      if (!prof) {
        // Setup mock fallback profiles if not found
        prof = {
          address: creatorAddr,
          name: `Explorer_${creatorAddr.slice(2, 6)}`,
          bio: 'Wanderer seeking new destinations! 🧭',
          avatar: '🧭'
        };
      }
      setCreatorProfile(prof);

      // Fetch followers count
      const followers = await getFollowersCount(creatorAddr);
      // Baseline baseline followers for demo profiles
      const baseline = DEMO_PROFILES[creatorAddr] ? (creatorAddr.includes('3a2c') ? 1205 : creatorAddr.includes('991f') ? 840 : creatorAddr.includes('bc12') ? 1930 : 640) : 0;
      setCreatorFollowers(baseline + followers);

      // Filter videos by this owner
      const posts = feedItems.filter(item => item.ownerAddress === creatorAddr);
      setCreatorVideos(posts);
    } catch (err) {
      console.error(err);
    }
  };

  // Connect wallet
  const handleConnect = async (walletType: 'petra' | 'metamask' | 'okx', useMock: boolean) => {
    if (useMock) {
      try {
        const state = await ShelbyService.connect(walletType, true);
        setWallet(state);
        setIsWalletModalOpen(false);
        showToast(`Connected to ${walletType.toUpperCase()} (Demo Mode)`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Demo connection failed.', 'error');
      }
      return;
    }

    try {
      if (walletType === 'petra') {
        const petra = wallets.find((w: any) => w.name.toLowerCase().includes('petra') || w.name === 'Petra');
        if (petra) {
          await aptosConnect(petra.name);
          setIsWalletModalOpen(false);
        } else {
          throw new Error('Petra Wallet not found. Please install the Petra browser extension.');
        }
      } else if (walletType === 'okx') {
        const okx = wallets.find((w: any) => w.name.toLowerCase().includes('okx') || w.name === 'OKX Wallet');
        if (okx) {
          await aptosConnect(okx.name);
          setIsWalletModalOpen(false);
        } else {
          throw new Error('OKX Wallet not found. Please install the OKX browser extension.');
        }
      } else if (walletType === 'metamask') {
        const state = await ShelbyService.connect('metamask', false);
        setWallet(state);
        setIsWalletModalOpen(false);
        showToast('Connected to MetaMask!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Wallet connection failed. Try Demo Mode!', 'error');
    }
  };

  const handleDisconnect = async () => {
    if (aptosConnected) {
      try {
        await aptosDisconnect();
      } catch (e) {
        console.error(e);
      }
    }
    setWallet({
      connected: false,
      address: '',
      walletType: null,
      network: 'simulated',
      balanceAPT: 0,
      balanceSHELBYUSD: 0,
      isMock: false,
    });
    showToast('Wallet disconnected', 'info');
  };

  const toggleMuted = () => {
    isGloballyMuted = !isGloballyMuted;
    setMuted(isGloballyMuted);
    const videos = document.querySelectorAll('video');
    videos.forEach(v => { v.muted = isGloballyMuted; });
  };

  // Load more posts (infinite scroll using client-side pagination of user uploads)
  const loadMoreVideos = () => {
    if (isFeedLoading || !hasMoreFeed) return;
    setIsFeedLoading(true);

    setTimeout(() => {
      setVisibleCount(prev => {
        const next = prev + 5;
        if (next >= filteredFeedItems.length) {
          setHasMoreFeed(false);
        }
        return next;
      });
      setIsFeedLoading(false);
      showToast('Loaded more travel videos!', 'success');
    }, 1000);
  };

  // Reset pagination when filter, tab, or items change
  useEffect(() => {
    setVisibleCount(5);
    setHasMoreFeed(filteredFeedItems.length > 5);
  }, [feedFilter, activeTab, feedItems.length]);

  // Camera record setups
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });
      setCameraStream(stream);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.play().catch(e => console.error(e));
      }
    } catch (err: any) {
      console.error(err);
      setCameraError('Could not access your camera or microphone. Please grant permission or use our simulated recorder!');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  };

  const startRecording = () => {
    if (!cameraStream) return;
    setRecordedBlob(null);
    setRecordedUrl('');
    setRecordingTime(0);
    setIsRecording(true);
    setIsRecordingPaused(false);

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm;codecs=vp9,opus' });
    } catch (e) {
      try {
        recorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm' });
      } catch (err) {
        recorder = new MediaRecorder(cameraStream);
      }
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const videoBlob = new Blob(chunks, { type: 'video/webm' });
      setRecordedBlob(videoBlob);
      setRecordedUrl(URL.createObjectURL(videoBlob));
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };

    mediaRecorderRef.current = recorder;
    recorder.start(10);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsRecordingPaused(true);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.resume();
      setIsRecordingPaused(false);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingPaused(false);
    }
  };

  const generateMockVideo = async () => {
    setRecordedBlob(null);
    setRecordedUrl('');
    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatus('Generating high quality mock travel video...');

    setTimeout(async () => {
      try {
        const demoVideoUrl = 'https://player.vimeo.com/external/434045526.sd.mp4?s=c27d2ad4bfe6e161a4c3093b5b18aa6065e8947b&profile_id=165&oauth2_token_id=57447761';
        const response = await fetch(demoVideoUrl);
        const videoBlob = await response.blob();
        setRecordedBlob(videoBlob);
        setRecordedUrl(URL.createObjectURL(videoBlob));
        setIsUploading(false);
        showToast('Simulated travel video recorded successfully!', 'success');
      } catch (err) {
        const dummyBlob = new Blob([new Uint8Array(1000)], { type: 'video/mp4' });
        setRecordedBlob(dummyBlob);
        setRecordedUrl('');
        setIsUploading(false);
        showToast('Simulated travel clip created!', 'success');
      }
    }, 1200);
  };

  const handleLocalVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      if (!file.type.startsWith('video/')) {
        showToast('Please select a valid video file!', 'error');
        return;
      }
      setRecordedBlob(file);
      setRecordedUrl(URL.createObjectURL(file));
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadPost = async () => {
    if (!wallet.connected) {
      setIsWalletModalOpen(true);
      showToast('Please connect your wallet first!', 'info');
      return;
    }
    if (!recordedBlob) {
      showToast('Please record a video or select a file first!', 'error');
      return;
    }
    if (!uploadTitle.trim()) {
      showToast('Please enter a title for your trip!', 'error');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus('Packing video chunks...');

      const serializedName = `${uploadTitle.trim()}|${uploadDesc.trim()}|${uploadLoc.trim()}|${uploadCat}.mp4`;
      const fileObject = new File([recordedBlob], serializedName, { type: recordedBlob.type || 'video/mp4' });

      await ShelbyService.uploadFile(
        fileObject,
        isPrivate,
        wallet,
        (progress) => {
          setUploadProgress(progress);
          if (progress < 40) {
            setUploadStatus('Encrypting travel bytes locally...');
          } else if (progress < 80) {
            setUploadStatus('Streaming chunks to Shelby storage...');
          } else {
            setUploadStatus('Syncing on-chain transaction details...');
          }
        },
        aptosSignMessage,
        aptosSignAndSubmitTransaction
      );

      showToast(`Trip "${uploadTitle}" shared on Shelby!`, 'success');
      setUploadTitle('');
      setUploadDesc('');
      setUploadLoc('');
      setRecordedBlob(null);
      setRecordedUrl('');
      
      await loadUserFiles();
      await loadFeedFiles();
      setActiveTab('feed');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to share trip video.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleDeletePost = async (fileId: string, name: string) => {
    const title = name.split('|')[0] || name;
    if (window.confirm(`Are you sure you want to delete your trip post "${title}"?`)) {
      try {
        await ShelbyService.deleteFile(fileId);
        showToast('Trip video deleted from Shelby.', 'success');
        await loadUserFiles();
        await loadFeedFiles();
      } catch (err) {
        showToast('Could not delete post.', 'error');
      }
    }
  };

  const copyShareLink = (id: string, shareUrl?: string) => {
    const link = shareUrl || `${window.location.origin}/#/share/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    showToast('Copied public share link!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  useEffect(() => {
    if (activeTab === 'record') startCamera();
    else stopCamera();
  }, [activeTab]);

  // Feed items filtering logic: "all" vs "following"
  // Under "all", we show all public items.
  // Under "following", we filter items to show only those uploaded by addresses in followingList.
  const filteredFeedItems = feedItems.filter(item => {
    if (feedFilter === 'following') {
      return followingList.includes(item.ownerAddress);
    }
    return true;
  });

  return (
    <div style={{ position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 2000,
          padding: '12px 24px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: notification.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : notification.type === 'error' ? 'rgba(251, 113, 133, 0.95)' : 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(8px)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '14px',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {notification.type === 'success' && <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} />}
          {notification.type === 'error' && <AlertCircle size={20} style={{ color: 'var(--accent-rose)' }} />}
          {notification.type === 'info' && <Info size={20} style={{ color: 'var(--accent-cyan)' }} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('feed')}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
          }}>
            <img src="/logo.png" alt="GoodTrip Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <span className="logo-text">GoodTrip</span>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', marginTop: '-2px' }}>
              ON SHELBY PROTOCOL
            </div>
          </div>
        </div>

        {/* Global Sound Toggler & Wallet Panel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <button 
            className="video-action-button" 
            onClick={toggleMuted}
            title={muted ? "Unmute feed" : "Mute feed"}
            style={{ width: '36px', height: '36px' }}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {wallet.connected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right', display: 'none' }} className="md-flex-only">
                <div style={{ fontSize: '12px', fontWeight: 700 }}>
                  {wallet.balanceAPT.toFixed(4)} APT
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {wallet.network === 'shelbynet' ? 'Shelbynet Testnet' : 'Simulated Node'}
                </div>
              </div>

              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleDisconnect}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: wallet.network === 'shelbynet' ? 'var(--accent-emerald)' : 'gold',
                }}></div>
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setIsWalletModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Wallet size={14} />
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main Layout Navigation */}
      <div className="nav-tabs">
        <div 
          className={`nav-tab ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <Compass size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          Discover Feed
        </div>
        <div 
          className={`nav-tab ${activeTab === 'record' ? 'active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          <PlusCircle size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          Share a Trip
        </div>
        <div 
          className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          My Trips
        </div>
      </div>

      {/* Primary Panels */}
      <main style={{ flex: 1, paddingBottom: '60px' }}>
        
        {/* DISCOVER FEED TAB */}
        {activeTab === 'feed' && (
          <div className="feed-container">
            {/* Feed priority filter bar */}
            <div className="feed-filter-bar">
              <button 
                className={`feed-filter-btn ${feedFilter === 'all' ? 'active' : ''}`}
                onClick={() => setFeedFilter('all')}
              >
                All Explorers
              </button>
              <button 
                className={`feed-filter-btn ${feedFilter === 'following' ? 'active' : ''}`}
                onClick={() => {
                  if (!wallet.connected) {
                    setIsWalletModalOpen(true);
                    showToast('Connect wallet to filter by following!', 'info');
                    return;
                  }
                  setFeedFilter('following');
                }}
              >
                Following
              </button>
            </div>

            {filteredFeedItems.length === 0 ? (
              <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <Sparkles size={48} style={{ color: 'var(--accent-emerald)', opacity: 0.8 }} />
                <h3>
                  {feedFilter === 'following' ? 'No posts from people you follow' : 'No Trips Shared Yet'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '14px' }}>
                  {feedFilter === 'following' 
                    ? 'Explore the "All Explorers" tab and click on creator names to follow them and build your personalized feed!'
                    : 'Be the first traveler to share your journey! Click the button below to record or upload a video.'
                  }
                </p>
                {feedFilter === 'following' ? (
                  <button className="btn btn-secondary" onClick={() => setFeedFilter('all')}>
                    Show All Explorers
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => setActiveTab('record')}>
                    Share Your First Trip
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredFeedItems.slice(0, visibleCount).map((item) => (
                  <FeedVideoCard 
                    key={item.id} 
                    item={item} 
                    muted={muted} 
                    liked={!!likedVideoIds[item.id]}
                    copied={copiedId === item.id}
                    onLike={() => handleToggleLike(item.id)}
                    onCopy={() => copyShareLink(item.id, item.videoUrl)}
                    onOpenComments={() => handleOpenComments(item.id)}
                    onOpenCreator={() => handleOpenCreatorProfile(item.ownerAddress)}
                  />
                ))}

                {/* Infinite Scroll Trigger Section */}
                {feedFilter === 'all' && (
                  <div style={{ textAlign: 'center', padding: '24px 0', marginTop: '12px' }}>
                    {hasMoreFeed ? (
                      <button 
                        className="btn btn-secondary" 
                        onClick={loadMoreVideos} 
                        disabled={isFeedLoading}
                        style={{ minWidth: '180px' }}
                      >
                        {isFeedLoading ? (
                          <>
                            <Loader2 size={16} className="spinner" style={{ marginRight: '8px' }} />
                            Chasing stories...
                          </>
                        ) : (
                          'Scroll / Load More Stories'
                        )}
                      </button>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        ✨ You have reached the end of the world. Time for a new trip!
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* RECORD & POST TAB */}
        {activeTab === 'record' && (
          <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={20} style={{ color: 'var(--accent-emerald)' }} />
                Travel Studio
              </h2>
              
              {!recordedUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="camera-preview-container">
                    {cameraStream ? (
                      <video 
                        ref={cameraVideoRef} 
                        className="camera-stream" 
                        muted 
                        playsInline
                      />
                    ) : (
                      <div style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '24px',
                        textAlign: 'center',
                        color: 'var(--text-muted)'
                      }}>
                        <Camera size={40} style={{ opacity: 0.5 }} />
                        {cameraError ? (
                          <span style={{ fontSize: '13px', color: 'var(--accent-rose)' }}>{cameraError}</span>
                        ) : (
                          <span style={{ fontSize: '13px' }}>Initializing camera preview stream...</span>
                        )}
                      </div>
                    )}

                    {isRecording && (
                      <div className="recording-indicator">
                        <div className="recording-dot"></div>
                        <span>REC • {recordingTime}s</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                    {!isRecording ? (
                      <>
                        <button 
                          className="btn btn-primary" 
                          onClick={startRecording}
                          disabled={!cameraStream}
                          style={{ minWidth: '150px' }}
                        >
                          <Video size={16} />
                          Start Recording
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={generateMockVideo}
                          disabled={isUploading}
                        >
                          <Sparkles size={16} style={{ color: 'gold' }} />
                          Simulate Capture
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload size={16} />
                          Upload File
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          style={{ display: 'none' }} 
                          accept="video/*" 
                          onChange={handleLocalVideoSelect} 
                        />
                      </>
                    ) : (
                      <>
                        {isRecordingPaused ? (
                          <button className="btn btn-secondary" onClick={resumeRecording}>
                            Resume
                          </button>
                        ) : (
                          <button className="btn btn-secondary" onClick={pauseRecording}>
                            Pause
                          </button>
                        )}
                        <button className="btn btn-danger" onClick={stopRecording} style={{ minWidth: '130px' }}>
                          Stop Recording
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="camera-preview-container" style={{ aspectRatio: '16/9' }}>
                    <video 
                      ref={videoPreviewRef} 
                      src={recordedUrl} 
                      className="camera-stream" 
                      controls 
                      playsInline
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setRecordedBlob(null);
                        setRecordedUrl('');
                        startCamera();
                      }}
                      disabled={isUploading}
                    >
                      <Trash2 size={14} />
                      Discard & Retake
                    </button>
                  </div>
                </div>
              )}
            </div>

            {recordedBlob && (
              <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} style={{ color: 'var(--accent-cyan)' }} />
                  Describe Your Trip
                </h3>
                
                <div className="form-group">
                  <label className="form-label">Trip Title *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Hiking the Ha Giang Loop!"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    disabled={isUploading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Tell other travelers about the route, the atmosphere, or tips..."
                    rows={3}
                    style={{ resize: 'vertical' }}
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    disabled={isUploading}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Ha Giang, Vietnam"
                      value={uploadLoc}
                      onChange={(e) => setUploadLoc(e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select 
                      className="form-input"
                      value={uploadCat}
                      onChange={(e) => setUploadCat(e.target.value)}
                      disabled={isUploading}
                      style={{ background: 'var(--bg-input)' }}
                    >
                      <option value="Nature">Nature</option>
                      <option value="City">City</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Beach">Beach</option>
                      <option value="Food">Food</option>
                    </select>
                  </div>
                </div>

                <div 
                  className={`switch-container ${isPrivate ? 'active' : ''}`}
                  onClick={() => !isUploading && setIsPrivate(!isPrivate)}
                  style={{ marginTop: '6px' }}
                >
                  <div className="switch"></div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Private Travel Vault</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Encrypt video locally. Only your connected wallet can play it back.
                    </div>
                  </div>
                </div>

                {isUploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{uploadStatus}</span>
                      <span style={{ fontWeight: 600 }}>{uploadProgress}%</span>
                    </div>
                    <div className="progress-container">
                      <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    onClick={handleUploadPost}
                    style={{ marginTop: '12px' }}
                  >
                    <Upload size={16} />
                    Post Trip to Shelby
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Wallet details */}
            <div className="glass glow-card" style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="avatar-frame" style={{ cursor: 'default' }}>
                  <div className="avatar-image" style={{
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px'
                  }}>
                    {userProfile ? userProfile.avatar : '🧭'}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {userProfile ? userProfile.name : 'Guest Explorer'}
                    {wallet.connected && (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => setIsProfileModalOpen(true)}
                        style={{ padding: '4px', borderRadius: '6px' }}
                        title="Edit profile"
                      >
                        <Edit size={12} />
                      </button>
                    )}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 4px' }}>
                    {userProfile ? userProfile.bio : 'Connect wallet to set up bio details.'}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    {wallet.connected ? wallet.address : 'Wallet not connected'}
                  </p>
                </div>
              </div>

              {wallet.connected && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    {wallet.balanceAPT.toFixed(4)} APT
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    ~ ${wallet.balanceSHELBYUSD.toFixed(2)} ShelbyUSD
                  </div>
                </div>
              )}
            </div>

            {/* My Uploads */}
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--accent-emerald)' }} />
                My Shared Trips
              </h3>

              {!wallet.connected ? (
                <div className="glass" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  <Wallet size={36} style={{ color: 'var(--text-muted)', opacity: 0.8 }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Connect your wallet to review trips you have shared on the Shelby network.</p>
                  <button className="btn btn-primary" onClick={() => setIsWalletModalOpen(true)}>
                    Connect Wallet
                  </button>
                </div>
              ) : dbFiles.length === 0 ? (
                <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  You haven't uploaded any trips yet. Record a trip to begin!
                </div>
              ) : (
                <div className="profile-video-grid">
                  {dbFiles.map((file) => {
                    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.mov');
                    let title = file.name;
                    let desc = '';
                    let loc = 'Secret Location';
                    
                    if (file.name.includes('|')) {
                      const parts = file.name.split('|');
                      title = parts[0] || title;
                      desc = parts[1] || desc;
                      loc = parts[2] || loc;
                    }

                    const blob = new Blob([file.data as any], { type: file.type });
                    const fileUrl = URL.createObjectURL(blob);

                    return (
                      <div key={file.id} className="profile-video-card">
                        {isVideo ? (
                          <video 
                            src={fileUrl} 
                            className="profile-video-preview" 
                            muted={muted} 
                            playsInline
                            onMouseOver={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                            onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                          />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b' }}>
                            <Upload size={32} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        )}

                        <div className="profile-video-meta">
                          <div className="profile-video-title">{title}</div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                            <MapPin size={8} style={{ color: 'var(--accent-cyan)' }} />
                            {loc}
                          </div>
                        </div>

                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <button 
                            className="video-action-button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyShareLink(file.id, file.shareableUrl);
                            }}
                            title="Copy link"
                            style={{ width: '28px', height: '28px' }}
                          >
                            <Copy size={12} />
                          </button>
                          
                          <button 
                            className="video-action-button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(file.id, file.name);
                            }}
                            title="Delete"
                            style={{ width: '28px', height: '28px', backgroundColor: 'rgba(251, 113, 133, 0.8)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          zIndex: 3
                        }}>
                          {file.isPrivate ? (
                            <div className="badge badge-private" style={{ padding: '2px 6px', fontSize: '9px' }}>
                              <Shield size={8} /> Private
                            </div>
                          ) : (
                            <div className="badge badge-public" style={{ padding: '2px 6px', fontSize: '9px' }}>
                              <Globe size={8} /> Public
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* WALLET SELECTION MODAL */}
      {isWalletModalOpen && (
        <div className="modal-overlay" onClick={() => setIsWalletModalOpen(false)}>
          <div className="modal-content glass glow-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} style={{ color: 'var(--accent-emerald)' }} />
                Select Explorer Wallet
              </h3>
              <button 
                className="video-action-button" 
                onClick={() => setIsWalletModalOpen(false)}
                style={{ width: '28px', height: '28px' }}
              >
                <X size={14} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '-8px' }}>
              Connect a real Web3 wallet extension or use our Simulated Demo Wallets to test out Shelby storage immediately!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="wallet-option" onClick={() => handleConnect('petra', false)}>
                <div className="wallet-option-details">
                  <div className="wallet-logo" style={{ background: '#1A1D26', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '4px' }}>
                    <img src={PETRA_LOGO} alt="Petra" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Petra Wallet</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aptos Extension</div>
                  </div>
                </div>
                <ChevronRight size={16} />
              </div>

              <div className="wallet-option" onClick={() => handleConnect('metamask', false)}>
                <div className="wallet-option-details">
                  <div className="wallet-logo" style={{ background: '#1A1D26', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2px' }}>
                    <img src={METAMASK_LOGO} alt="MetaMask" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>MetaMask</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>EVM Extension</div>
                  </div>
                </div>
                <ChevronRight size={16} />
              </div>

              <div className="wallet-option" onClick={() => handleConnect('okx', false)}>
                <div className="wallet-option-details">
                  <div className="wallet-logo" style={{ background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '4px' }}>
                    <img src={OKX_LOGO} alt="OKX" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>OKX Wallet</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Universal Extension</div>
                  </div>
                </div>
                <ChevronRight size={16} />
              </div>

              <div style={{ margin: '12px 0 4px', height: '1px', background: 'var(--border-color)' }}></div>

              <div 
                className="wallet-option" 
                onClick={() => handleConnect('petra', true)}
                style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.02)' }}
              >
                <div className="wallet-option-details">
                  <div className="wallet-logo" style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-emerald)' }}>
                      Quick Simulated Wallet
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      No extension required • instant play
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--accent-emerald)' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
          <div className="modal-content glass glow-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={18} style={{ color: 'var(--accent-emerald)' }} />
                Edit Profile
              </h3>
              <button 
                className="video-action-button" 
                onClick={() => setIsProfileModalOpen(false)}
                style={{ width: '28px', height: '28px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Explorer Avatar</label>
              <div className="avatar-selector-grid">
                {AVATAR_OPTIONS.map((emoji) => (
                  <div 
                    key={emoji} 
                    className={`avatar-select-option ${editAvatar === emoji ? 'selected' : ''}`}
                    onClick={() => setEditAvatar(emoji)}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Explorer Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bio (Wanderlust motto)</label>
              <textarea 
                className="form-input" 
                placeholder="Tell other explorers about your trips..."
                rows={3}
                style={{ resize: 'vertical' }}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setIsProfileModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={!editName.trim()}>
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATOR PROFILE DETAIL MODAL */}
      {selectedCreatorAddress && creatorProfile && (
        <div className="modal-overlay" onClick={() => setSelectedCreatorAddress(null)}>
          <div className="modal-content glass glow-card" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} style={{ color: 'var(--accent-cyan)' }} />
                Traveler Channel
              </h3>
              <button 
                className="video-action-button" 
                onClick={() => setSelectedCreatorAddress(null)}
                style={{ width: '28px', height: '28px' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Profile Overview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
              <div className="avatar-frame" style={{ cursor: 'default' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '50%'
                }}>
                  {creatorProfile.avatar}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '18px' }}>{creatorProfile.name}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0', maxWidth: '380px' }}>
                  {creatorProfile.bio}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  {creatorProfile.address}
                </p>
              </div>

              {/* Stats & Follow Action */}
              <div style={{ display: 'flex', width: '100%', gap: '12px', margin: '8px 0' }}>
                <div className="profile-modal-stat">
                  <div className="profile-modal-stat-value">{creatorVideos.length}</div>
                  <div className="profile-modal-stat-label">Trips Shared</div>
                </div>
                <div className="profile-modal-stat">
                  <div className="profile-modal-stat-value">{creatorFollowers}</div>
                  <div className="profile-modal-stat-label">Followers</div>
                </div>
              </div>

              {wallet.connected && wallet.address !== creatorProfile.address && (
                <button 
                  className={`btn ${followingList.includes(creatorProfile.address) ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => handleToggleFollowCreator(creatorProfile.address)}
                  style={{ width: '100%', padding: '10px' }}
                >
                  {followingList.includes(creatorProfile.address) ? (
                    <>Unfollow Traveler</>
                  ) : (
                    <>
                      <Users size={16} /> Follow Traveler
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Video List Preview */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', maxHeight: '200px', overflowY: 'auto' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Trips Posted
              </div>
              {creatorVideos.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  No public trips posted yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {creatorVideos.map(v => (
                    <div 
                      key={v.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <Play size={10} style={{ color: 'var(--accent-emerald)' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {v.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {v.location}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS DRAWER SLIDE OUT */}
      {activeCommentVideoId && (
        <div className="comments-drawer-overlay" onClick={() => setActiveCommentVideoId(null)}>
          <div className="comments-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="comments-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                <MessageCircle size={18} style={{ color: 'var(--accent-emerald)' }} />
                Travel Discussion
              </h3>
              <button 
                className="video-action-button" 
                onClick={() => setActiveCommentVideoId(null)}
                style={{ width: '28px', height: '28px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="comments-list">
              {activeCommentsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No comments yet. Start the conversation!
                </div>
              ) : (
                activeCommentsList.map((c) => (
                  <div key={c.id} className="comment-item">
                    <div className="avatar-frame" style={{ padding: '1px', cursor: 'default' }}>
                      <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyItems: 'center', fontSize: '14px', background: 'var(--bg-secondary)', borderRadius: '50%', paddingLeft: '6px' }}>
                        {DEMO_PROFILES[c.authorAddress]?.avatar || '🧭'}
                      </div>
                    </div>
                    
                    <div className="comment-bubble">
                      <div className="comment-author">
                        {DEMO_PROFILES[c.authorAddress]?.name || `Explorer_${c.authorAddress.slice(2, 6)}`}
                      </div>
                      <div className="comment-text">{c.content}</div>
                      <div className="comment-time">
                        {new Date(c.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {wallet.connected ? (
              <div className="comment-input-area">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Share your thoughts..." 
                  style={{ flex: 1 }}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                />
                <button 
                  className="btn btn-primary"
                  onClick={handlePostComment}
                  disabled={!newCommentText.trim()}
                  style={{ padding: '10px 16px' }}
                >
                  Post
                </button>
              </div>
            ) : (
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsWalletModalOpen(true)}
                  style={{ width: '100%' }}
                >
                  Connect Wallet to Comment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// FEED VIDEO CARD COMPONENT
interface FeedVideoCardProps {
  item: FeedVideoItem;
  muted: boolean;
  liked: boolean;
  copied: boolean;
  onLike: () => void;
  onCopy: () => void;
  onOpenComments: () => void;
  onOpenCreator: () => void;
}

function FeedVideoCard({ item, muted, liked, copied, onLike, onCopy, onOpenComments, onOpenCreator }: FeedVideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playPulse, setPlayPulse] = useState<'play' | 'pause' | null>(null);

  // Resolution for creator display information
  const [creatorProfileLocal, setCreatorProfileLocal] = useState<UserProfile | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);

  // Fetch creator profile locally to display name and avatar on the feed card
  useEffect(() => {
    const fetchLocalProfile = async () => {
      // Check hardcoded demo profiles first
      if (DEMO_PROFILES[item.ownerAddress]) {
        setCreatorProfileLocal(DEMO_PROFILES[item.ownerAddress]);
        return;
      }
      
      try {
        const p = await getProfile(item.ownerAddress);
        if (p) {
          setCreatorProfileLocal(p);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLocalProfile();
  }, [item.ownerAddress]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setPlayPulse('pause');
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setPlayPulse('play');
      }).catch(err => console.error("Video play aborted:", err));
    }

    setTimeout(() => setPlayPulse(null), 600);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            video.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {
              setIsPlaying(false);
            });
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => {
      observer.unobserve(video);
    };
  }, [item.videoUrl]); // rebind on video source change

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressContainerRef.current || duration === 0) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    videoRef.current.currentTime = percentage * duration;
    setCurrentTime(percentage * duration);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="feed-item">
      <div className="video-player-container">
        
        <video 
          ref={videoRef}
          src={item.videoUrl} 
          className="feed-video"
          loop
          muted={muted}
          playsInline
          onClick={handlePlayPause}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />

        {playPulse && (
          <div className="video-center-play-btn animate-ping-once">
            {playPulse === 'play' ? <Play size={36} fill="white" /> : <Pause size={36} fill="white" />}
          </div>
        )}

        {!isPlaying && (
          <div className="video-center-play-btn paused" onClick={handlePlayPause}>
            <Play size={28} fill="white" style={{ marginLeft: '4px' }} />
          </div>
        )}

        {/* Sidebar Controls */}
        <div style={{
          position: 'absolute',
          right: '16px',
          bottom: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          zIndex: 4
        }}>
          {/* Like */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <button 
              className="video-action-button" 
              onClick={onLike}
              style={{ 
                color: liked ? 'var(--accent-rose)' : 'white',
                borderColor: liked ? 'var(--accent-rose)' : 'rgba(255,255,255,0.1)'
              }}
            >
              <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              {item.likesCount}
            </span>
          </div>

          {/* Comment */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <button className="video-action-button" onClick={onOpenComments}>
              <MessageCircle size={20} />
            </button>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              {item.commentsCount}
            </span>
          </div>

          {/* Share */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <button 
              className="video-action-button" 
              onClick={onCopy}
              style={{ color: copied ? 'var(--accent-cyan)' : 'white' }}
              title="Copy share link"
            >
              {copied ? <Check size={20} /> : <Share2 size={20} />}
            </button>
          </div>
        </div>

        {/* HUD Overlay details */}
        <div className="video-overlay-ui">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span 
              className="badge" 
              style={{ 
                background: 'rgba(0,0,0,0.6)', 
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.15)',
                fontSize: '11px'
              }}
            >
              {item.category}
            </span>

            {item.isDemo && (
              <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.25)', color: 'var(--accent-cyan)', fontSize: '10px' }}>
                Featured Trip
              </span>
            )}
          </div>

          <div className="video-details-card">
            <div className="video-title">{item.title}</div>
            
            <div className="video-location">
              <MapPin size={14} />
              {item.location}
            </div>

            <div className="video-description">{item.description}</div>
            
            {/* Creator Information Row */}
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}
              onClick={onOpenCreator}
              title="View channel profile"
            >
              <div className="avatar-frame" style={{ padding: '1px', boxShadow: 'none' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '50%'
                }}>
                  {creatorProfileLocal ? creatorProfileLocal.avatar : '🧭'}
                </div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'white', textDecoration: 'underline' }}>
                {creatorProfileLocal ? creatorProfileLocal.name : `Explorer_${item.ownerAddress.slice(2, 6)}`}
              </div>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                ({item.ownerAddress.slice(0, 6)}...{item.ownerAddress.slice(-4)})
              </span>
            </div>
          </div>
        </div>

        {/* Progress seek timeline */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 6 }}>
          <div 
            ref={progressContainerRef}
            className="video-progress-container"
            onClick={handleSeek}
          >
            <div className="video-progress-bar" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
