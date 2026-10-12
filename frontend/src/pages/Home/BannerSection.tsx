import SlickCarousel from 'react-slick'
import type { CustomArrowProps, Settings } from 'react-slick'
import { Badge, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import heroImage from '@/assets/hero.png'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import './BannerSection.scss'

const Slider =
  typeof SlickCarousel === 'function'
    ? SlickCarousel
    : (SlickCarousel as { default: typeof SlickCarousel }).default

const slides = [
  {
    id: 1,
    title: 'Welcome to KPL',
    description: 'Catch the latest action, stats, and highlights from the league.',
    accent: 'Live Matches',
    imageUrl: heroImage,
    ctaText: 'View Live Scores',
    ctaHref: '/live-scores',
  },
  {
    id: 2,
    title: 'Match Day Preview',
    description: 'All the fixtures, squads, and match predictions in one place.',
    accent: 'Upcoming Clash',
    imageUrl: 'https://placehold.co/1920x600/1e3a8a/ffffff?text=Match+Day+Preview',
    ctaText: 'See Fixtures',
    ctaHref: '/fixtures',
  },
  {
    id: 3,
    title: 'Top Performers',
    description: 'Track the best runs, wickets, and star players from the season.',
    accent: 'Player Spotlight',
    imageUrl: 'https://placehold.co/1920x600/2563eb/ffffff?text=Top+Performers',
    ctaText: 'View Statistics',
    ctaHref: '/statistics',
  },
]

function PrevArrow({ className, style, onClick }: CustomArrowProps) {
  return (
    <button
      type="button"
      className={`${className ?? ''} banner-arrow`.trim()}
      style={style}
      onClick={onClick}
      aria-label="Previous slide"
    >
      <FontAwesomeIcon icon={faChevronLeft} />
    </button>
  )
}

function NextArrow({ className, style, onClick }: CustomArrowProps) {
  return (
    <button
      type="button"
      className={`${className ?? ''} banner-arrow`.trim()}
      style={style}
      onClick={onClick}
      aria-label="Next slide"
    >
      <FontAwesomeIcon icon={faChevronRight} />
    </button>
  )
}

const sliderSettings: Settings = {
  dots: true,
  infinite: true,
  speed: 600,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 5000,
  fade: true,
  cssEase: 'ease-in-out',
  arrows: true,
  pauseOnHover: true,
  prevArrow: <PrevArrow />,
  nextArrow: <NextArrow />,
  responsive: [
    {
      breakpoint: 768,
      settings: {
        arrows: false,
      },
    },
  ],
}

const BannerSection = () => {
  return (
    <section className="banner-section">
      <Slider {...sliderSettings} className="banner-slider">
        {slides.map((slide) => (
          <div key={slide.id}>
            <div className="hero-slide">
              <img
                src={slide.imageUrl}
                alt=""
                className="hero-slide-image"
                aria-hidden="true"
              />
              <div className="hero-slide-overlay" aria-hidden="true" />
              <div className="hero-slide-content">
                <Badge bg="light" text="dark" className="hero-badge mb-3">
                  {slide.accent}
                </Badge>
                <h1>{slide.title}</h1>
                <p>{slide.description}</p>
                <Link to={slide.ctaHref} className="hero-cta-link">
                  <Button variant="light" size="lg" className="hero-cta">
                    {slide.ctaText}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  )
}

export default BannerSection
