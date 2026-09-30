import React from 'react'
import FeedList from '../components/feed/FeedList'

const Feed = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '1rem', padding: '0 10px', flexWrap: 'nowrap', width: '100%' }}>
      <FeedList />
    </div>
  )
}

export default Feed
