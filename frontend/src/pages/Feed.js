import React from 'react'
import FeedList from '../components/feed/FeedList'

const Feed = () => {
  return (
    <div className="feed-layout-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '1rem', padding: '0 10px', width: '100%', containerType: 'inline-size' }}>
      <FeedList />
    </div>
  )
}

export default Feed
