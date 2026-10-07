import { Hero } from './components/Hero'
import {
  Atmosphere,
  DownloadBand,
  Experience,
  Features,
  Footer,
  ForYou,
  SyriaNote,
} from './components/Sections'

export default function App() {
  return (
    <div id="top" className="overflow-x-hidden bg-cream" dir="rtl">
      <Hero />
      <Experience />
      <Features />
      <ForYou />
      <Atmosphere />
      <SyriaNote />
      <DownloadBand />
      <Footer />
    </div>
  )
}
