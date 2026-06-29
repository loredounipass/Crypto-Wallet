import React from 'react'
import FeedList from '../components/feed/FeedList'

const Feed = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '0 10px', flexWrap: 'wrap' }}>
      <FeedList />
    </div>
  )
}

export default Feed
