"use client"
import "react-responsive-carousel/lib/styles/carousel.min.css"; 
import { Carousel } from 'react-responsive-carousel';
import Image from "next/image";

const heroImages = [
  
  { imgUrl: '/assets/movie.jpg', alt: 'Movie'},
  { imgUrl: '/assets/book.jpg', alt: 'Book'},
  { imgUrl: '/assets/poem.jpg', alt: 'Poem'},

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