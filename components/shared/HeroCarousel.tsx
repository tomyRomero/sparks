"use client"
import "react-responsive-carousel/lib/styles/carousel.min.css"; 
import { Carousel } from 'react-responsive-carousel';
import Image from "next/image";

const heroImages = [
  
  { imgUrl: '/assets/sparks-post.png', alt: 'Post'},
  { imgUrl: '/assets/sparks-studio.png', alt: 'Studio'},
  { imgUrl: '/assets/sparks-chats.png', alt: 'Chat'},
  { imgUrl: '/assets/sparks-search.png', alt: 'Search'},
  { imgUrl: '/assets/sparks-profile.png', alt: 'Profile'},
  { imgUrl: '/assets/sparks-noti.png', alt: 'Acitvity'},

]

const HeroCarousel = () => {
  return (
    <div>
      <Carousel
        showThumbs={false}
        autoPlay
        infiniteLoop
        interval={2000}
        showArrows={false}
        showStatus={false}
      >
        {heroImages.map((image) => (
          <Image 
            src={image.imgUrl}
            alt={image.alt}
            width={400}
            height={400}
            className="object-contain rounded-3xl"
            key={image.alt}
          />
        ))}
      </Carousel>
    </div>
  )
}

export default HeroCarousel