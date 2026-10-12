import about from './pages/about.yml'
import contact from './pages/contact.yml'
import gallery from './pages/gallery.yml'
import sponsors from './pages/sponsors.yml'
import auction from './pages/auction.yml'
import type {
  AboutPageContent,
  ContactPageContent,
  GalleryPageContent,
  SponsorsPageContent,
  AuctionPageContent,
} from './types'

export const aboutContent = about as unknown as AboutPageContent
export const contactContent = contact as unknown as ContactPageContent
export const galleryContent = gallery as unknown as GalleryPageContent
export const sponsorsContent = sponsors as unknown as SponsorsPageContent
export const auctionContent = auction as unknown as AuctionPageContent

export type {
  AboutPageContent,
  ContactPageContent,
  GalleryPageContent,
  SponsorsPageContent,
  AuctionPageContent,
}
