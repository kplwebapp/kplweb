import { usePageTitle } from '@/hooks/usePageTitle'
import BannerSection from './BannerSection'
import WhatAreYouLookingFor from './WhatAreYouLookingFor'
import MagicMoments from './MagicMoments'
import PointsTable from './PointsTable'
import TopPerformers from './TopPerformers'
import LatestVideos from './LatestVideos'
import Sponsors from './Sponsors'
import './Home.scss'

export default function Home() {
  usePageTitle()

  return (
    <main className="home-page">
      <BannerSection />
      <WhatAreYouLookingFor />
      <MagicMoments />
      <PointsTable />
      <TopPerformers />
      <LatestVideos />
      <Sponsors />
    </main>
  )
}
