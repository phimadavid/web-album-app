'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

// Define types
interface PageContent {
    front: string;
    back: string;
}

const FlippingBook = () => {
    const [currentLocation, setCurrentLocation] = useState<number>(1);
    const numOfPapers = 3;
    const maxLocation = numOfPapers + 2; // +2 to account for front and back covers

    // Book state
    const [isBookOpen, setIsBookOpen] = useState<boolean>(false);
    const [isAtBeginning, setIsAtBeginning] = useState<boolean>(true);

    // Page content - you can customize this
    const pages: PageContent[] = [
        { front: "Front 1", back: "Back 1" },
        { front: "Front 2", back: "Back 2" },
        { front: "Front 3", back: "Back 3" },
    ];

    // Book title
    const bookTitle = "My Book";
    const bookAuthor = "Author Name";

    // Animation variants
    const bookVariants = {
        closed: (isAtBeginning: boolean) => ({
            x: isAtBeginning ? "0%" : "100%",
            transition: {
                duration: 0.5,
                ease: "easeInOut"
            }
        }),
        open: {
            x: "50%",
            transition: {
                duration: 0.5,
                ease: "easeInOut"
            }
        }
    };

    const buttonVariants = {
        hidden: {
            x: 0,
            transition: {
                duration: 0.5,
                ease: "easeInOut"
            }
        },
        visible: (isLeft: boolean) => ({
            x: isLeft ? -180 : 180,
            transition: {
                duration: 0.5,
                ease: "easeInOut"
            }
        })
    };

    const pageVariants = {
        unflipped: {
            rotateY: 0,
            transition: {
                duration: 0.7,
                ease: [0.4, 0.0, 0.2, 1] // Custom easing for paper flip feel
            }
        },
        flipped: {
            rotateY: -180,
            transition: {
                duration: 0.7,
                ease: [0.4, 0.0, 0.2, 1]
            }
        }
    };

    const openBook = () => {
        setIsBookOpen(true);
        setIsAtBeginning(false);
    };

    const closeBook = (atBeginning: boolean) => {
        setIsBookOpen(false);
        setIsAtBeginning(atBeginning);
    };

    const goNextPage = () => {
        if (currentLocation < maxLocation) {
            if (currentLocation === 1) {
                openBook();
            } else if (currentLocation === numOfPapers + 1) { // Account for front cover
                closeBook(false);
            }
            setCurrentLocation(currentLocation + 1);
        }
    };

    const goPrevPage = () => {
        if (currentLocation > 1) {
            if (currentLocation === 2) {
                closeBook(true);
            } else if (currentLocation === maxLocation) {
                openBook();
            }
            setCurrentLocation(currentLocation - 1);
        }
    };

    // Generate the papers dynamically with framer-motion
    const renderPapers = () => {
        // First, create the front cover
        const frontCover = (
            <div
                key="front-cover"
                id="front-cover"
                className="paper absolute w-full h-full top-0 left-0"
                style={{
                    zIndex: currentLocation > 1 ? 1 : numOfPapers + 2,
                    perspective: '1500px'
                }}
            >
                <motion.div
                    className="front absolute w-full h-full top-0 left-0 bg-blue-700 border-l-[3px] border-blue-800 z-[1] rounded-r-md"
                    style={{
                        transformOrigin: 'left',
                        backfaceVisibility: 'hidden',
                        boxShadow: '2px 2px 10px rgba(0,0,0,0.2)'
                    }}
                    initial="unflipped"
                    animate={currentLocation > 1 ? "flipped" : "unflipped"}
                    variants={pageVariants}
                >
                    <div
                        className="front-content w-full h-full flex flex-col justify-center items-center p-8 text-white"
                    >
                        <h1 className="text-4xl font-bold mb-4 text-center">{bookTitle}</h1>
                        <div className="w-16 h-1 bg-white my-4"></div>
                        <p className="text-xl mt-4">{bookAuthor}</p>
                        <BookOpen className="mt-8" size={64} />
                    </div>
                </motion.div>
                <motion.div
                    className="back absolute w-full h-full top-0 left-0 bg-white z-[0]"
                    style={{
                        transformOrigin: 'left',
                    }}
                    initial="unflipped"
                    animate={currentLocation > 1 ? "flipped" : "unflipped"}
                    variants={pageVariants}
                >
                    <div
                        className="back-content w-full h-full flex justify-center items-center"
                        style={{ transform: 'rotateY(180deg)' }}
                    >
                        <h1 className="text-xl text-gray-800">Book Information</h1>
                    </div>
                </motion.div>
            </div>
        );

        // Then generate the content pages
        const contentPages = Array.from({ length: numOfPapers }, (_, i) => {
            const paperIndex = i + 1;
            const isFlipped = currentLocation > paperIndex + 1; // +1 to account for front cover

            return (
                <div
                    key={`paper-${paperIndex}`}
                    id={`p${paperIndex}`}
                    className="paper absolute flex w-[400px] h-[400px]"
                    style={{
                        zIndex: isFlipped ? paperIndex + 1 : numOfPapers - i + 1,
                        perspective: '1500px'
                    }}
                >
                    {/* Content page - Front side */}
                    <motion.div
                        className="front absolute w-full h-full top-6 left-0 bg-slate-500 border-l-[3px] border-[powderblue] z-[1]"
                        style={{
                            transformOrigin: 'left',
                            backfaceVisibility: 'hidden'
                        }}
                        initial="unflipped"
                        animate={isFlipped ? "flipped" : "unflipped"}
                        variants={pageVariants}
                    >
                        {/* Content page container with padding */}
                        <div className="content-container w-full h-full flex justify-center items-center p-8">
                            {/* Centered content div */}
                            <div
                                id={`f${paperIndex}`}
                                className="front-content"
                            >
                                <h1>{pages[i]?.front || `Page ${paperIndex * 2 - 1}`}</h1>
                            </div>
                        </div>
                    </motion.div>

                    {/* Content page - Back side */}
                    <motion.div
                        className="back absolute w-full h-full top-6 left-0 bg-slate-500 z-[0]"
                        style={{
                            transformOrigin: 'left',
                        }}
                        initial="unflipped"
                        animate={isFlipped ? "flipped" : "unflipped"}
                        variants={pageVariants}
                    >
                        {/* Content page container with padding */}
                        <div
                            className="content-container w-full h-full flex justify-center items-center p-8"
                            style={{ transform: 'rotateY(180deg)' }}
                        >
                            {/* Centered content div */}
                            <div
                                id={`b${paperIndex}`}
                                className="back-content"
                            >
                                <h1>{pages[i]?.back || `Page ${paperIndex * 3}`}</h1>
                            </div>
                        </div>
                    </motion.div>
                </div>
            );
        });

        // Finally, add the back cover
        const backCover = (
            <div
                key="back-cover"
                id="back-cover"
                className="paper absolute w-full h-full top-0 left-0"
                style={{
                    zIndex: currentLocation > numOfPapers + 1 ? numOfPapers + 1 : 0,
                    perspective: '1500px'
                }}
            >
                <motion.div
                    className="front absolute w-full h-full top-0 left-0 bg-white border-l-[3px] border-[powderblue] z-[1]"
                    style={{
                        transformOrigin: 'left',
                        backfaceVisibility: 'hidden'
                    }}
                    initial="unflipped"
                    animate={currentLocation > numOfPapers + 1 ? "flipped" : "unflipped"}
                    variants={pageVariants}
                >
                    <div className="content-container w-full h-full flex justify-center items-center p-8">
                        <div className="front-content">
                            <h1>Thank you for reading!</h1>
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    className="back absolute w-full h-full top-0 left-0 bg-blue-700 z-[0] rounded-r-md"
                    style={{
                        transformOrigin: 'left',
                        boxShadow: '2px 2px 10px rgba(0,0,0,0.2)'
                    }}
                    initial="unflipped"
                    animate={currentLocation > numOfPapers + 1 ? "flipped" : "unflipped"}
                    variants={pageVariants}
                >
                    <div
                        className="back-content w-full h-full flex flex-col justify-center items-center p-8 text-white"
                        style={{ transform: 'rotateY(180deg)' }}
                    >
                        <h2 className="text-2xl font-bold">Back Cover</h2>
                        <p className="mt-4 text-center">
                            A brief description of the book would go here. This could include a synopsis,
                            reviews, or other information about the book.
                        </p>
                    </div>
                </motion.div>
            </div>
        );

        // Return all elements together
        return [frontCover, ...contentPages, backCover];
    };

    return (
        <div className="flex justify-center items-center bg-slate-600 min-h-screen">
            {/* Previous Button */}
            <motion.button
                onClick={goPrevPage}
                className="border-none bg-transparent cursor-pointer m-[10px] rounded-full"
                initial="hidden"
                animate={isBookOpen ? "visible" : "hidden"}
                variants={buttonVariants}
                custom={true} // true for left button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
                whileTap={{ scale: 0.95 }}
                disabled={currentLocation <= 1}
            >
                <ChevronLeft
                    size={48}
                    color={currentLocation <= 1 ? "#aaaaaa" : "#666666"}
                    strokeWidth={1.5}
                />
            </motion.button>

            {/* Book */}
            <div className='box p-10'>
                <motion.div
                    id="book"
                    className="book relative w-[425px] h-[450px]"
                    initial="closed"
                    animate={isBookOpen ? "open" : "closed"}
                    variants={bookVariants}
                    custom={isAtBeginning}
                >
                    <AnimatePresence>
                        {renderPapers()}
                    </AnimatePresence>
                </motion.div>
            </div>
            {/* Next Button */}
            <motion.button
                onClick={goNextPage}
                className="border-none bg-transparent cursor-pointer m-[10px] p-2 rounded-full"
                initial="hidden"
                animate={isBookOpen ? "visible" : "hidden"}
                variants={buttonVariants}
                custom={false} // false for right button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
                whileTap={{ scale: 0.95 }}
                disabled={currentLocation >= maxLocation}
            >
                <ChevronRight
                    size={48}
                    color={currentLocation >= maxLocation ? "#aaaaaa" : "#666666"}
                    strokeWidth={1.5}
                />
            </motion.button>
        </div>
    );
};

export default FlippingBook;