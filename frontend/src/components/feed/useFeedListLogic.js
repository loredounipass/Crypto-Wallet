import { useRef, useCallback } from 'react';
import useFeed from '../../hooks/useFeed';



// CUSTOM HOOK THAT MANAGES THE STATE AND LOGIC FOR THE FEED LIST
export default function useFeedListLogic() {
  const {
    posts, loading, error,
    loadMore, hasMore, loadingMore,
    likePost, unlikePost, deletePost,
    addComment, joinPost, viewPost,
    getComments, likeComment, unlikeComment,
    sharePost
  } = useFeed();
  const observer = useRef(null);



  // CALLBACK REF THAT TRIGGERS LOADING MORE POSTS WHEN THE LAST ITEM IS VISIBLE
  const lastPostRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        if (loadMore) loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMore]);



  // GROUPS ALL ACTIONS TO BE PASSED DOWN TO THE FEED ITEMS
  const actions = {
    likePost, unlikePost, deletePost, addComment, joinPost, viewPost, getComments, likeComment, unlikeComment, sharePost
  };


  return {
    posts, loading, error, hasMore, loadingMore, actions, lastPostRef
  };
}
