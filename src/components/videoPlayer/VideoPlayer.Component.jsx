import React, {useEffect, useRef, useState} from 'react';
import usePictureInPicture from 'react-use-pip'
import HtmlRenderComponent from "./HtmlRender.Component";

export const NameContext = React.createContext(null);

const VideoPlayerComponent = () => {
    const [volumeLevel, setVolumeLevel] = useState("high");
    const [paused, setPaused] = useState("paused");
    const [theater, setTheater] = useState(false);
    const [theaterMod, setTheaterMod] = useState(false);

    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const volumeSliderRef = useRef(null);
    const videoContainerRef = useRef(null);
    const videoControlsRef = useRef(null);
    const totalTimeRef = useRef(null);
    const timelineRef = useRef(null);
    const currentTimeRef = useRef(null);
    const timelineContainerRef = useRef(null);

    const {
        isPictureInPictureActive,
        togglePictureInPicture
    } = usePictureInPicture(videoRef);

    useEffect(() => {
        const handleKeyDown = (e) => {
            let tagName = document.activeElement.tagName.toLowerCase();
            if (tagName === "input") return;
            switch (e.key.toLowerCase()) {
                case " ":
                case "k":
                    togglePlay();
                    break;
                case "f":
                    toggleFullScreenMode()
                    break;
                case "t":
                    toggleTheaterMod();
                    break;
                case "i":
                    toggleMiniPlayer();
                    break;
                case "m":
                    toggleMute();
                    break;
                case "arrowleft":
                case "j":
                    skip(-5);
                    break;
                case "arrowright":
                case "l":
                    skip(5);
                    break;
                case "c":
                    toggleCaptions();
                    break;
                default:
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    });

    const handleVideoFile = (file) => {
        setPaused("paused");
        audioRef.current.src = "";
        videoControlsRef.current.style.opacity = "0";
        videoControlsRef.current.style.opacity = "1";
        videoContainerRef.current.style.cursor = "default";
        const video = videoRef.current;
        const trackElement = document.querySelector('track');
        videoContainerRef.current.classList.remove('captions')
        videoContainerRef.current.classList.add("paused");
        if (trackElement) {
            video.removeChild(trackElement);
        }
        video.src = URL.createObjectURL(file);
        video.load();
    }

    const handleAudioFile = (file) => {
            const audio = audioRef.current;
            audio.src = URL.createObjectURL(file);
            audio.load();
    }

    const handleSubtitleFile = (file) => {
        const video = videoRef.current;
        const subtitleURL = URL.createObjectURL(file);
        const oldTrack = document.querySelector('track');
        if(oldTrack){ oldTrack.remove()}
        const newTrack = document.createElement('track');
        newTrack.src = subtitleURL;
        newTrack.kind = 'subtitles';
        newTrack.srclang = 'en';
        newTrack.label = 'English';
        newTrack.default = true;
        video.appendChild(newTrack);
        const captions = video.textTracks[0];
        captions.mode = "hidden";
    }

    const toggleCaptions = () => {
        let captions = videoRef.current.textTracks[0];
        if (captions) {
            let isHidden = captions.mode === "hidden";
            captions.mode = isHidden ? "showing" : "hidden";
            videoContainerRef.current.classList.toggle("captions", isHidden);
        }
    }

    const formatDuration = (time) =>{
        let seconds = Math.floor(time % 60);
        let minutes = Math.floor(time / 60) % 60;
        let hours = Math.floor(time / 3600);

        seconds = seconds < 10 ? `0${seconds}` : seconds;
        minutes = minutes < 10 ? `0${minutes}` : minutes;
        hours = hours < 10 ? `0${hours}` : hours;

        if (hours === 0){
            return `${minutes}:${seconds}`;
        } else{
            return `${hours}:${minutes}:${seconds}`
        }
    }

    const skip = (duration) => {
        videoRef.current.currentTime += duration;
        if (audioRef.current.src) {
            audioRef.current.currentTime += duration;
        }
    }

    const loadTime = () => {
        const duration = Math.ceil(videoRef.current.duration);
        totalTimeRef.current.textContent = formatDuration(duration);
    }

    const timeUpdate = () => {
        currentTimeRef.current.textContent = formatDuration(videoRef.current.currentTime);
        const percent = videoRef.current.currentTime / videoRef.current.duration
        timelineContainerRef.current.style.setProperty("--progress-position", percent)

    }

    const handleTimelineUpdate = (event) => {
        const rect = timelineContainerRef.current.getBoundingClientRect();
        const xDiff = event.clientX - rect.x;
        const width = rect.width;
        if (isNaN(xDiff) || isNaN(width) || width === 0) {
            return;
        }
        const percent = Math.min(Math.max(0, xDiff), width) / width;
        timelineContainerRef.current.style.setProperty("--preview-position", percent);
        console.log(percent);
    };


    const showControls = () => {
        videoControlsRef.current.style.opacity = "1";
        videoContainerRef.current.style.cursor = "default";
    }

    const timelineControl = (event) => {
        const timelineRect = timelineRef.current.getBoundingClientRect();
        const clickX = event.clientX - timelineRect.left;
        const timelineWidth = timelineRect.width;
        videoRef.current.currentTime = (clickX / timelineWidth) * videoRef.current.duration;
        if (audioRef.current.src) {
            audioRef.current.currentTime = (clickX / timelineWidth) * audioRef.current.duration;
        }
    }

    const handleVideoEnd = () => {
        videoRef.current.currentTime = 0;
        videoContainerRef.current.style.background="black";
        videoControlsRef.current.style.opacity = "0";
        videoControlsRef.current.style.opacity = "1";
        videoContainerRef.current.style.cursor = "default";
    }

    const toggleMute = () => {
        videoRef.current.muted = !videoRef.current.muted;
    }

    const handleSliderChange = (e) => {
        videoRef.current.volume = e.target.value;
        videoRef.current.muted = e.target.value === 0;
        if (audioRef.current.src) {
            audioRef.current.volume = e.target.value;
            audioRef.current.muted = e.target.value === 0;
        }
    }

    const handleVolumeChange = () => {
        volumeSliderRef.current.value = videoRef.current.volume;
        if (videoRef.current.muted || videoRef.current.volume === 0) {
            volumeSliderRef.current.value = 0;
            setVolumeLevel("muted");
        } else if (videoRef.current.volume >= .5) {
            setVolumeLevel("high");
        } else {
            setVolumeLevel("low");
        }
    }

    const toggleFullScreenMode = () => {
        if (!document.fullscreenElement){
            videoContainerRef.current.requestFullscreen().then(() =>{});
        } else{
            document.exitFullscreen().then(() => {});
        }
    }

    const toggleTheaterMod = () => {
        setTheater(!theater);
        setTheaterMod(!theaterMod);
    }

    const toggleMiniPlayer = () => {
            togglePictureInPicture(!isPictureInPictureActive);
    }

    const handlePlay = () => {
        timelineRef.current.style.visibility="visible";
        videoContainerRef.current.style.background="none";
        setPaused("");
    }

    const handlePause = () => {
        setPaused("paused");
    }

    let hideControlsTimeout;

    const hideControls = () => {
        clearTimeout(hideControlsTimeout);
        hideControlsTimeout = setTimeout(() => {
            videoControlsRef.current.style.opacity = "0";
            videoContainerRef.current.style.cursor = "none";
        }, 3000);
    }

    const togglePlay = () => {
        timelineContainerRef.current.style.visibility="showing";
        if (videoRef.current.paused) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    if (audioRef.current && audioRef.current.src) {
                        audioRef.current.play();
                    }
                }).catch(error => {
                    console.log(error);
                });
            }
        } else {
            videoRef.current.pause();
            if (audioRef.current && audioRef.current.src) {
                audioRef.current.pause();
            }
            clearTimeout(hideControlsTimeout);
        }
    };

    return (
        <>
            <NameContext.Provider
                value={{ volumeLevel, paused, theater, theaterMod, videoContainerRef, videoRef, audioRef, hideControls, showControls,
                         videoControlsRef, timelineRef, togglePlay, toggleMute, volumeSliderRef, handleSliderChange,
                         currentTimeRef, totalTimeRef, toggleMiniPlayer, toggleTheaterMod, toggleFullScreenMode, handleVolumeChange,
                         handlePlay, handlePause, toggleCaptions, handleVideoFile, handleSubtitleFile, handleAudioFile, handleTimelineUpdate,
                         timelineContainerRef, timelineControl, handleVideoEnd, loadTime, timeUpdate
                }}>
                <HtmlRenderComponent />
            </NameContext.Provider>
        </>
    );
}

export default VideoPlayerComponent;