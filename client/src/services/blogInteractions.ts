import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { BlogComment, BlogReaction } from "@/types/blog";
import { NotificationService } from "./notificationService";

const serializeTimestamp = (timestamp: Timestamp | null): string | null => {
  return timestamp?.toDate?.()?.toISOString() || null;
};

/**
 * Add a comment to a blog post
 */
export const addComment = async (
  postId: string,
  userId: string,
  userName: string,
  userEmail: string,
  content: string
): Promise<string> => {
  try {
    const commentData = {
      postId,
      userId,
      userName,
      userEmail,
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "blogComments"), commentData);

    // Update comment count in the blog post
    const postRef = doc(db, "blogPosts", postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const currentComments = postSnap.data().commentCount || 0;
      const postData = postSnap.data();
      await updateDoc(postRef, {
        commentCount: currentComments + 1,
      });

      // Create notification for admin about new comment
      try {
        await NotificationService.createNotification({
          type: "blog",
          title: "New Blog Comment",
          body: `${userName} commented on "${postData.title || 'a blog post'}"`,
          data: {
            postId,
            commentId: docRef.id,
            userName,
            userEmail,
            postTitle: postData.title,
            commentPreview: content.substring(0, 100),
          },
          recipientRole: "admin",
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
        // Don't fail the comment creation if notification fails
      }
    }

    return docRef.id;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

/**
 * Get comments for a blog post
 */
export const getComments = async (postId: string): Promise<BlogComment[]> => {
  try {
    const q = query(
      collection(db, "blogComments"),
      where("postId", "==", postId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const comments: BlogComment[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        ...data,
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: serializeTimestamp(data.updatedAt),
      } as BlogComment);
    });

    return comments;
  } catch (error) {
    console.error("Error getting comments:", error);
    throw error;
  }
};

/**
 * Add a reaction to a blog post
 */
export const addReaction = async (
  postId: string,
  userId: string,
  userName: string,
  type: "like" | "love" | "celebrate"
): Promise<void> => {
  try {
    // Check if user already reacted
    const q = query(
      collection(db, "blogReactions"),
      where("postId", "==", postId),
      where("userId", "==", userId)
    );
    const existingReactions = await getDocs(q);

    if (!existingReactions.empty) {
      // User already reacted - update the reaction type
      const docRef = doc(db, "blogReactions", existingReactions.docs[0].id);
      await updateDoc(docRef, {
        type,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Add new reaction
      await addDoc(collection(db, "blogReactions"), {
        postId,
        userId,
        userName,
        type,
        createdAt: serverTimestamp(),
      });

      // Update reaction count in the blog post
      const postRef = doc(db, "blogPosts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const currentReactions = postSnap.data().reactionCount || 0;
        const postData = postSnap.data();
        await updateDoc(postRef, {
          reactionCount: currentReactions + 1,
        });

        // Create notification for admin about new reaction
        try {
          await NotificationService.createNotification({
            type: "blog",
            title: "New Blog Reaction",
            body: `${userName} reacted with ${type} to "${postData.title || 'a blog post'}"`,
            data: {
              postId,
              userName,
              reactionType: type,
              postTitle: postData.title,
            },
            recipientRole: "admin",
          });
        } catch (notifError) {
          console.error("Failed to create notification:", notifError);
          // Don't fail the reaction if notification fails
        }
      }
    }
  } catch (error) {
    console.error("Error adding reaction:", error);
    throw error;
  }
};

/**
 * Remove a reaction from a blog post
 */
export const removeReaction = async (
  postId: string,
  userId: string
): Promise<void> => {
  try {
    const q = query(
      collection(db, "blogReactions"),
      where("postId", "==", postId),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      await deleteDoc(doc(db, "blogReactions", querySnapshot.docs[0].id));

      // Update reaction count in the blog post
      const postRef = doc(db, "blogPosts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const currentReactions = postSnap.data().reactionCount || 0;
        await updateDoc(postRef, {
          reactionCount: Math.max(0, currentReactions - 1),
        });
      }
    }
  } catch (error) {
    console.error("Error removing reaction:", error);
    throw error;
  }
};

/**
 * Get reactions for a blog post
 */
export const getReactions = async (postId: string): Promise<BlogReaction[]> => {
  try {
    const q = query(
      collection(db, "blogReactions"),
      where("postId", "==", postId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const reactions: BlogReaction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reactions.push({
        ...data,
        createdAt: serializeTimestamp(data.createdAt),
      } as BlogReaction);
    });

    return reactions;
  } catch (error) {
    console.error("Error getting reactions:", error);
    throw error;
  }
};

/**
 * Check if user has reacted to a post
 */
export const getUserReaction = async (
  postId: string,
  userId: string
): Promise<BlogReaction | null> => {
  try {
    const q = query(
      collection(db, "blogReactions"),
      where("postId", "==", postId),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      return {
        ...data,
        createdAt: serializeTimestamp(data.createdAt),
      } as BlogReaction;
    }

    return null;
  } catch (error) {
    console.error("Error getting user reaction:", error);
    throw error;
  }
};
