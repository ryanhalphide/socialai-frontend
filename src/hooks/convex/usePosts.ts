import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

export interface Post {
  _id: Id<'posts'>;
  _creationTime: number;
  userId: Id<'users'>;
  organizationId?: Id<'organizations'>;
  title?: string;
  content: string;
  mediaUrls?: string[];
  mediaType?: string;
  hashtags?: string[];
  mentions?: string[];
  platforms: string[];
  platformSpecificContent?: Record<string, unknown>;
  status: string;
  scheduledAt?: number;
  publishedAt?: number;
  wasAiGenerated: boolean;
  aiPromptUsed?: string;
  viralScore?: number;
  viralScoreBreakdown?: Record<string, unknown>;
  publishResults?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface PostFilters {
  status?: string;
  platform?: string;
  limit?: number;
}

export interface CreatePostInput {
  title?: string;
  content: string;
  mediaUrls?: string[];
  mediaType?: string;
  hashtags?: string[];
  mentions?: string[];
  platforms: string[];
  platformSpecificContent?: Record<string, unknown>;
  status: string;
  scheduledAt?: number;
  wasAiGenerated?: boolean;
  aiPromptUsed?: string;
  viralScore?: number;
  viralScoreBreakdown?: Record<string, unknown>;
}

export interface UpdatePostInput {
  postId: Id<'posts'>;
  title?: string;
  content?: string;
  mediaUrls?: string[];
  mediaType?: string;
  hashtags?: string[];
  mentions?: string[];
  platforms?: string[];
  platformSpecificContent?: Record<string, unknown>;
  status?: string;
  scheduledAt?: number;
  viralScore?: number;
  viralScoreBreakdown?: Record<string, unknown>;
}

export function usePosts(filters?: PostFilters) {
  return useQuery(api.posts.list, filters ?? {});
}

export function usePost(postId: Id<'posts'> | null) {
  return useQuery(
    api.posts.get,
    postId ? { postId } : 'skip'
  );
}

export function useScheduledPosts(limit?: number) {
  return useQuery(api.posts.getScheduled, { limit });
}

export function useDrafts(limit?: number) {
  return useQuery(api.posts.getDrafts, { limit });
}

export function usePostStats() {
  return useQuery(api.posts.getStats, {});
}

export function useCreatePost() {
  return useMutation(api.posts.create);
}

export function useUpdatePost() {
  return useMutation(api.posts.update);
}

export function useDeletePost() {
  return useMutation(api.posts.remove);
}

export function useDuplicatePost() {
  return useMutation(api.posts.duplicate);
}

export function useSchedulePost() {
  return useMutation(api.posts.schedule);
}

export function usePublishPost() {
  return useMutation(api.posts.publish);
}

// Convenience hook that returns all post mutations
export function usePostMutations() {
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const duplicatePost = useDuplicatePost();
  const schedulePost = useSchedulePost();
  const publishPost = usePublishPost();

  return {
    createPost,
    updatePost,
    deletePost,
    duplicatePost,
    schedulePost,
    publishPost,
  };
}
