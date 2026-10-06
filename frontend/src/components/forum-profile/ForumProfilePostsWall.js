import React from 'react';
import FeedItem from '../feed/FeedItem';
import useFeed from '../../hooks/useFeed';

// WALL OF POSTS AUTHORED BY THE PROFILE OWNER (REUSES THE FEED ITEM + CAROUSEL)
export default function ForumProfilePostsWall({ posts, isFollowing }) {
  const feed = useFeed();
  const actions = {
    likePost: feed.likePost,
    unlikePost: feed.unlikePost,
    deletePost: feed.deletePost,
    updatePost: feed.updatePost,
    addComment: feed.addComment,
    joinPost: feed.joinPost,
    viewPost: feed.viewPost,
    getComments: feed.getComments,
    likeComment: feed.likeComment,
    unlikeComment: feed.unlikeComment,
    sharePost: feed.sharePost,
  };

  if (!posts || posts.length === 0) {
    return (
      <div className="fb-empty">
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
        Aún no hay publicaciones.
      </div>
    );
  }

  return (
    <div className="fp-wall">
      {posts.map((p) => (
        <FeedItem key={p._id} post={p} actions={actions} initialFollowing={isFollowing} />
      ))}
    </div>
  );
}
