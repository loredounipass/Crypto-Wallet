import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import FeedService from '../services/feed'
import useFeed from '../hooks/useFeed'
import FeedItem from '../components/feed/FeedItem'
import LeftSidebar from '../components/feed/LeftSidebar'
import RightSidebar from '../components/feed/RightSidebar'
import '../components/feed/FeedStyles.css'

export default function PostPage() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const {
    likePost,
    unlikePost,
    addComment,
    joinPost,
    viewPost,
    getComments,
    likeComment,
    unlikeComment,
    sharePost
  } = useFeed()

  useEffect(() => {
    let mounted = true
    const fetchPost = async () => {
      try {
        setLoading(true)
        const res = await FeedService.getPost(id)
        if (mounted) {
          const postData = (res && res.data) ? res.data : res
          setPost(postData)
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching post:', err)
          setError(err)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    if (id) {
      fetchPost()
    }

    return () => {
      mounted = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="fb-loading">
        Cargando publicación...
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="fb-empty">
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
        Publicación no encontrada o eliminada
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '0 10px' }}>
      <div className="fb-left-sidebar-fixed">
        <LeftSidebar />
      </div>

      <div className="fb-list-wrapper">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FeedItem
            key={post._id}
            post={post}
            actions={{
              likePost,
              unlikePost,
              addComment,
              joinPost,
              viewPost,
              getComments,
              likeComment,
              unlikeComment,
              sharePost
            }}
          />
        </div>
      </div>

      <div className="fb-right-sidebar-fixed">
        <RightSidebar />
      </div>
    </div>
  )
}
