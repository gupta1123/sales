import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

interface ImageGalleryProps {
    images: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
    return (
        <Carousel
            showThumbs={true}
            thumbWidth={80}
            renderThumbs={() =>
                images.map((image, index) => (
                    <div key={index}>
                        <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            style={{ objectFit: 'cover', height: '60px' }}
                        />
                    </div>
                ))
            }
        >
            {images.map((image, index) => (
                <div key={index}>
                    <img
                        src={image}
                        alt={`Image ${index + 1}`}
                        style={{ width: '300px', height: '200px', objectFit: 'cover' }}
                    />
                </div>
            ))}
        </Carousel>
    );
};

export default ImageGallery;