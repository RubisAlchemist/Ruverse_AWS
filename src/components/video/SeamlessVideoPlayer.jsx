// import React, { useEffect, useRef, useState } from "react";

// const SeamlessVideoPlayer = ({
//   initialVideoUrl,
//   isVisible = true,
//   onEnded,
//   onStart,
//   onAllVideosEnded,
//   onLoadingChange, // AiConsultChannelPage에 알려주기
// }) => {
//   const videoRef = useRef(null);
//   const mediaSourceRef = useRef(null);
//   const sourceBufferRef = useRef(null);
//   const queuedVideos = useRef([]);
//   const [canPlay, setCanPlay] = useState(false);
//   const baseUrl = useRef("");
//   const initialUrlSet = useRef(false);
//   const isStopped = useRef(false);
//   const currentIndexRef = useRef(0);
//   const fetchInProgress = useRef({});
//   const retryCounts = useRef({});
//   // const MAX_RETRIES = 5;
//   const MAX_RETRIES = 7;
//   const RETRY_DELAY = 1000;
//   const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//   const [isInitialLoading, setIsInitialLoading] = useState(true); // 로딩 스피너 대신 디폴트 영상 보이게

// useEffect(() => {
//   if (!initialUrlSet.current && initialVideoUrl) {
//     console.log("initialVideoUrl: ", initialVideoUrl);
//     const urlPart = initialVideoUrl.videoPath
//       .split("/video/")[1]
//       .split(/(_\d+)?\.webm$/)[0];
//     baseUrl.current = `/video/${urlPart}`;
//     // baseUrl.current = urlPart;
//     // baseUrl.current = `/proxy/video/${urlPart}`;
//     initialUrlSet.current = true;
//   }
//   console.log("seamlessVideoPlayer: ", initialVideoUrl.videoPath);
// }, [initialVideoUrl]);

//   const getVideoUrl = (index) => {
//     if (index === "final") {
//       return `${baseUrl.current}_final.webm`;
//     } else {
//       return `${baseUrl.current}_${index}.webm`;
//     }
//   };

//   const fetchAndAppendVideo = async (index) => {
//     if (isStopped.current) return;
//     if (fetchInProgress.current[index]) return; // Avoid overlapping fetches
//     fetchInProgress.current[index] = true;

//     if (index == 0) {
//       console.log("sleeping...");
//       await sleep(6000);
//       console.log("sleep end");

//       setIsInitialLoading(false); // 로딩 스피너 대신 디폴트 영상 보이게
//     }

//     const url = getVideoUrl(index);
//     const mediaSource = mediaSourceRef.current;
//     try {
//       console.log("Fetching url: ", url);
//       console.log(`Attempting to fetch video ${index}`);
//       const response = await fetch(url, {
//         credentials: "include", // credentials 옵션
//       });
//       if (!response.ok) {
//         throw new Error(`Failed to fetch video: ${response.statusText}`);
//       }
//       const arrayBuffer = await response.arrayBuffer();
//       queuedVideos.current.push(arrayBuffer);
//       fetchInProgress.current[index] = false;
//       retryCounts.current[index] = 0; // Reset retry count on success
//       if (
//         mediaSource &&
//         mediaSource.readyState === "open" &&
//         sourceBufferRef.current &&
//         !sourceBufferRef.current.updating
//       ) {
//         appendNextVideo();
//       }
//       // Prefetch the next video in the background
//       if (index === 0) {
//         // Fetch the second video before starting playback
//         fetchAndAppendVideo(index + 1);
//       } else if (index > 0) {
//         // Continue fetching subsequent videos
//         currentIndexRef.current = index + 1;
//         fetchAndAppendVideo(currentIndexRef.current);
//       }
//     } catch (error) {
//       console.error(`Error fetching video ${index}:`, error);
//       fetchInProgress.current[index] = false;
//       retryCounts.current[index] = (retryCounts.current[index] || 0) + 1;
//       if (retryCounts.current[index] < MAX_RETRIES) {
//         setTimeout(() => fetchAndAppendVideo(index), RETRY_DELAY);
//       } else {
//         console.error(
//           `Max retries reached for video ${index}. Checking for final video.`
//         );
//         checkForFinalVideo(index);
//       }
//     }
//   };

//   const fetchAndAppendVideoAfterFinal = async (index) => {
//     if (isStopped.current) return;
//     if (fetchInProgress.current[index]) return; // Avoid overlapping fetches
//     fetchInProgress.current[index] = true;

//     const url = getVideoUrl(index);
//     const mediaSource = mediaSourceRef.current;

//     try {
//       console.log(
//         `Attempting to fetch video fetchAndAppendVideoAfterFinal ${index}`
//       );

//       const response = await fetch(url, {
//         credentials: "include", // credentials 옵션
//       });

//       if (!response.ok) {
//         // If the final video does not exist, end the stream
//         console.log(`'_final' video does not exist. Ending stream.`);
//         fetchInProgress.current["final"] = false;
//         isStopped.current = true;

//         if (mediaSource && mediaSource.readyState === "open") {
//           mediaSource.endOfStream();
//         }

//         return;
//       }

//       const arrayBuffer = await response.arrayBuffer();
//       queuedVideos.current.push(arrayBuffer);

//       fetchInProgress.current[index] = false;
//       retryCounts.current[index] = 0; // Reset retry count on success

//       if (
//         mediaSource &&
//         mediaSource.readyState === "open" &&
//         sourceBufferRef.current &&
//         !sourceBufferRef.current.updating
//       ) {
//         appendNextVideo();
//       }
//       // Prefetch the next video in the background
//       if (index === 0) {
//         // Fetch the second video before starting playback
//         fetchAndAppendVideoAfterFinal(index + 1);
//       } else if (index > 0) {
//         // Continue fetching subsequent videos
//         currentIndexRef.current = index + 1;
//         fetchAndAppendVideoAfterFinal(currentIndexRef.current);
//       }
//     } catch (error) {
//       console.error(`Error fetching video ${index}:`, error);
//       fetchInProgress.current[index] = false;
//       retryCounts.current[index] = (retryCounts.current[index] || 0) + 1;
//       if (retryCounts.current[index] < 5) {
//         setTimeout(() => fetchAndAppendVideoAfterFinal(index), RETRY_DELAY);
//       } else {
//         console.error(`Max retries reached for video ${index}. Ending stream.`);
//         isStopped.current = true;
//         if (mediaSource && mediaSource.readyState === "open") {
//           mediaSource.endOfStream();
//         }
//       }
//     }
//   };

//   const checkForFinalVideo = async (index) => {
//     if (isStopped.current) return;
//     if (fetchInProgress.current["final"]) return; // Avoid overlapping fetches
//     fetchInProgress.current["final"] = true;
//     const finalUrl = getVideoUrl("final");
//     try {
//       const response = await fetch(finalUrl, {
//         credentials: "include", // credentials 옵션
//       });
//       if (response.ok) {
//         // '_final' video exists, proceed to fetch it
//         console.log(`'_final' video exists. Fetching final video.`);
//         fetchInProgress.current["final"] = false;
//         retryCounts.current["final"] = 0; // Reset retry count on success
//         fetchAndAppendVideoAfterFinal(index);
//       } else {
//         // '_final' video does not exist, end the stream
//         console.log(`'_final' video does not exist. Ending stream.`);
//         fetchInProgress.current["final"] = false;
//         isStopped.current = true;
//         if (mediaSource && mediaSource.readyState === "open") {
//           mediaSource.endOfStream();
//         }
//       }
//     } catch (error) {
//       console.error("Error checking for '_final' video:", error);
//       fetchInProgress.current["final"] = false;
//       retryCounts.current["final"] = (retryCounts.current["final"] || 0) + 1;
//       if (retryCounts.current["final"] < 5) {
//         setTimeout(() => checkForFinalVideo(index), RETRY_DELAY);
//       } else {
//         console.error(`Max retries reached for '_final' video. Ending stream.`);
//         isStopped.current = true;
//         if (mediaSource && mediaSource.readyState === "open") {
//           mediaSource.endOfStream();
//         }
//       }
//     }
//   };

//   const appendNextVideo = () => {
//     if (isStopped.current) return;
//     const mediaSource = mediaSourceRef.current;
//     console.log("appendNextVideo()");
//     console.log("queuedVideos.current.length:", queuedVideos.current.length);
//     if (
//       queuedVideos.current.length > 0 &&
//       mediaSource &&
//       mediaSource.readyState === "open" &&
//       sourceBufferRef.current &&
//       !sourceBufferRef.current.updating
//     ) {
//       const nextVideo = queuedVideos.current.shift();
//       console.log("Appending video segment, size:", nextVideo.byteLength);
//       try {
//         sourceBufferRef.current.appendBuffer(nextVideo);
//         console.log("Buffer appended successfully.");
//       } catch (error) {
//         console.error("Error appending buffer:", error);
//         // In case of error, re-queue the video and retry later
//         queuedVideos.current.unshift(nextVideo);
//       }
//     }
//   };

//   const onUpdateEnd = () => {
//     if (isStopped.current) return;
//     console.log("onUpdateEnd()");
//     appendNextVideo();
//     // Set canPlay to true after the first video is appended
//     if (!canPlay) {
//       setCanPlay(true);
//     }
//   };

//   const sourceOpen = (e) => {
//     console.log("sourceOpen()");
//     const mediaSource = e.target;
//     try {
//       const mimeType = 'video/webm; codecs="vp8, vorbis"';
//       sourceBufferRef.current = mediaSource.addSourceBuffer(mimeType);
//       sourceBufferRef.current.mode = "sequence";
//       sourceBufferRef.current.addEventListener("updateend", onUpdateEnd);
//       console.log(
//         "MediaSource readyState after sourceOpen:",
//         mediaSource.readyState
//       );
//       // Start by fetching the first two videos
//       fetchAndAppendVideo(0);
//     } catch (error) {
//       console.error("Error during sourceOpen:", error);
//     }
//   };

//   useEffect(() => {
//     const video = videoRef.current;
//     const mediaSource = new MediaSource();
//     mediaSourceRef.current = mediaSource;
//     video.src = URL.createObjectURL(mediaSource);
//     const handleSourceOpen = (e) => sourceOpen(e);
//     mediaSource.addEventListener("sourceopen", handleSourceOpen);
//     const handleEnded = () => {
//       console.log("Playback ended.");
//       onAllVideosEnded();
//     };
//     video.addEventListener("ended", handleEnded);
//     return () => {
//       mediaSource.removeEventListener("sourceopen", handleSourceOpen);
//       video.removeEventListener("ended", handleEnded);
//       if (sourceBufferRef.current) {
//         mediaSource.removeSourceBuffer(sourceBufferRef.current);
//       }
//       URL.revokeObjectURL(video.src);
//       // Cleanup function
//       if (video) {
//         video.pause();
//         video.src = "";
//         video.load();
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (isVisible && canPlay) {
//       const videoElement = videoRef.current;
//       if (videoElement) {
//         videoElement
//           .play()
//           .then(() => {
//             console.log("Video started playing.");
//           })
//           .catch((error) => {
//             console.error("Playback failed:", error);
//           });
//       }
//     } else {
//       videoRef.current?.pause();
//     }
//   }, [isVisible, canPlay]);

//   return (
//     // 로딩 스피너 대신 디폴트 영상 보이게 하려고 주석시킨 원래 코드
//     // <video
//     //   ref={videoRef}
//     //   style={{ width: "100%", height: "100%" }}
//     //   onPlay={onStart}
//     // />

//     // 로딩 스피너 대신 디폴트 영상 보이게
//     // <div style={{ position: "relative", width: "100%", height: "100%" }}>
//     <video
//       ref={videoRef}
//       style={{ width: "100%", height: "100%" }}
//       onPlay={onStart}
//     />
//     /* {isInitialLoading && (
//         <div
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             width: "100%",
//             height: "100%",
//             backgroundColor: "transparent",
//             zIndex: 1, // 비디오 위에 오버레이 표시 // 안되면 2로 바꿔보기
//           }}
//         />
//       )}
//     </div> */
//   );
// };

// export default SeamlessVideoPlayer;

// import React, { useEffect, useRef, useState } from "react";

// const SeamlessVideoPlayer = ({
//   initialVideoUrl,
//   isVisible = true,
//   onEnded,
//   onStart,
//   onAllVideosEnded,
//   onLoadingChange,
// }) => {
//   const videoRef = useRef(null);
//   const mediaSourceRef = useRef(null);
//   const sourceBufferRef = useRef(null);
//   const queuedVideos = useRef([]);
//   const [canPlay, setCanPlay] = useState(false);
//   const baseUrl = useRef("");
//   const initialUrlSet = useRef(false);
//   const isStopped = useRef(false);
//   const currentIndexRef = useRef(0);
//   const fetchInProgress = useRef(false);
//   const retryCounts = useRef({});
//   const MAX_RETRIES = 7; // Set to Infinity for unlimited retries
//   const RETRY_DELAY = 1000; // 1 second delay between retries
//   const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//   const [isInitialLoading, setIsInitialLoading] = useState(true);

//   useEffect(() => {
//     if (!initialUrlSet.current && initialVideoUrl) {
//       console.log("initialVideoUrl: ", initialVideoUrl);
//       const urlPart = initialVideoUrl.videoPath
//         .split("/video/")[1]
//         .split(/(_\d+)?\.webm$/)[0];
//       baseUrl.current = `/video/${urlPart}`;
//       // baseUrl.current = urlPart;
//       // baseUrl.current = `/proxy/video/${urlPart}`;
//       initialUrlSet.current = true;
//     }
//     console.log("seamlessVideoPlayer: ", initialVideoUrl.videoPath);
//   }, [initialVideoUrl]);

//   const getVideoUrl = (index) => {
//     if (index === "final") {
//       return `${baseUrl.current}_final.webm`;
//     } else {
//       return `${baseUrl.current}_${index}.webm`;
//     }
//   };

//   const fetchAndAppendVideo = async (index) => {
//     if (isStopped.current) return;
//     if (fetchInProgress.current) return; // Avoid overlapping fetches
//     fetchInProgress.current = true;

//     if (index === 0) {
//       console.log("sleeping...");
//       await sleep(6000);
//       console.log("sleep end");
//       setIsInitialLoading(false);
//     }

//     const url = getVideoUrl(index);
//     const mediaSource = mediaSourceRef.current;

//     try {
//       console.log(`Attempting to fetch video ${index}`);
//       const response = await fetch(url, {
//         credentials: "include",
//       });
//       if (!response.ok) {
//         throw new Error(`Failed to fetch video: ${response.statusText}`);
//       }
//       const arrayBuffer = await response.arrayBuffer();
//       fetchInProgress.current = false;
//       retryCounts.current[index] = 0;

//       queuedVideos.current.push(arrayBuffer);

//       if (
//         mediaSource &&
//         mediaSource.readyState === "open" &&
//         sourceBufferRef.current &&
//         !sourceBufferRef.current.updating
//       ) {
//         appendNextVideo();
//       }

//       // After successfully fetching and appending, proceed to the next segment
//       currentIndexRef.current = index + 1;
//       fetchAndAppendVideo(currentIndexRef.current);
//     } catch (error) {
//       console.error(`Error fetching video ${index}:`, error);
//       fetchInProgress.current = false;
//       retryCounts.current[index] = (retryCounts.current[index] || 0) + 1;
//       if (retryCounts.current[index] < MAX_RETRIES) {
//         console.log(
//           `Retrying to fetch video ${index}. Attempt ${retryCounts.current[index]}`
//         );
//         await sleep(RETRY_DELAY);
//         fetchAndAppendVideo(index);
//       } else {
//         console.error(
//           `Max retries reached for video ${index}. Checking for final video.`
//         );
//         // After max retries, check for final video
//         checkForFinalVideo();
//       }
//     }
//   };

//   const checkForFinalVideo = async () => {
//     if (isStopped.current) return;
//     const finalUrl = getVideoUrl("final");
//     const mediaSource = mediaSourceRef.current;
//     try {
//       console.log("Checking for '_final' video.");
//       const response = await fetch(finalUrl, {
//         credentials: "include",
//       });
//       if (response.ok) {
//         // '_final' video exists
//         console.log(
//           `'_final' video exists. Will end stream after buffered videos.`
//         );
//         // Set flag to stop fetching new videos
//         isStopped.current = true;
//         // If buffer is empty, end stream immediately
//         if (
//           queuedVideos.current.length === 0 &&
//           mediaSource &&
//           mediaSource.readyState === "open"
//         ) {
//           mediaSource.endOfStream();
//         }
//         // Else, allow buffered videos to play out
//       } else {
//         // '_final' video does not exist, and no more segments to fetch
//         console.log(`'_final' video does not exist. Ending stream.`);
//         isStopped.current = true;
//         if (mediaSource && mediaSource.readyState === "open") {
//           mediaSource.endOfStream();
//         }
//       }
//     } catch (error) {
//       console.error("Error checking for '_final' video:", error);
//       // If we cannot check for the final video, we can choose to end the stream or retry
//       isStopped.current = true;
//       if (mediaSource && mediaSource.readyState === "open") {
//         mediaSource.endOfStream();
//       }
//     }
//   };

//   const appendNextVideo = () => {
//     if (isStopped.current && queuedVideos.current.length === 0) {
//       const mediaSource = mediaSourceRef.current;
//       if (mediaSource && mediaSource.readyState === "open") {
//         console.log("No more videos to append. Ending stream.");
//         mediaSource.endOfStream();
//       }
//       return;
//     }

//     const mediaSource = mediaSourceRef.current;
//     if (
//       queuedVideos.current.length > 0 &&
//       mediaSource &&
//       mediaSource.readyState === "open" &&
//       sourceBufferRef.current &&
//       !sourceBufferRef.current.updating
//     ) {
//       const nextVideo = queuedVideos.current.shift();
//       console.log("Appending video segment, size:", nextVideo.byteLength);
//       try {
//         sourceBufferRef.current.appendBuffer(nextVideo);
//         console.log("Buffer appended successfully.");
//       } catch (error) {
//         console.error("Error appending buffer:", error);
//         // Re-queue the video and retry later
//         queuedVideos.current.unshift(nextVideo);
//       }
//     } else if (isStopped.current && queuedVideos.current.length === 0) {
//       // If we've been instructed to stop and the buffer is empty, end the stream
//       if (mediaSource && mediaSource.readyState === "open") {
//         console.log("Ending stream after all videos have been appended.");
//         mediaSource.endOfStream();
//       }
//     }
//   };

//   const onUpdateEnd = () => {
//     if (isStopped.current && queuedVideos.current.length === 0) {
//       const mediaSource = mediaSourceRef.current;
//       if (mediaSource && mediaSource.readyState === "open") {
//         console.log("Update ended and no more videos. Ending stream.");
//         mediaSource.endOfStream();
//       }
//       return;
//     }

//     appendNextVideo();

//     // Set canPlay to true after the first video is appended
//     if (!canPlay) {
//       setCanPlay(true);
//     }
//   };

//   const sourceOpen = (e) => {
//     console.log("sourceOpen()");
//     const mediaSource = e.target;
//     try {
//       const mimeType = 'video/webm; codecs="vp8, vorbis"';
//       sourceBufferRef.current = mediaSource.addSourceBuffer(mimeType);
//       sourceBufferRef.current.mode = "sequence";
//       sourceBufferRef.current.addEventListener("updateend", onUpdateEnd);
//       console.log(
//         "MediaSource readyState after sourceOpen:",
//         mediaSource.readyState
//       );
//       // Start by fetching the first video
//       currentIndexRef.current = 0;
//       fetchAndAppendVideo(currentIndexRef.current);
//     } catch (error) {
//       console.error("Error during sourceOpen:", error);
//     }
//   };

//   useEffect(() => {
//     const video = videoRef.current;
//     const mediaSource = new MediaSource();
//     mediaSourceRef.current = mediaSource;
//     video.src = URL.createObjectURL(mediaSource);
//     const handleSourceOpen = (e) => sourceOpen(e);
//     mediaSource.addEventListener("sourceopen", handleSourceOpen);
//     const handleEnded = () => {
//       console.log("Playback ended.");
//       onAllVideosEnded();
//     };
//     video.addEventListener("ended", handleEnded);
//     return () => {
//       mediaSource.removeEventListener("sourceopen", handleSourceOpen);
//       video.removeEventListener("ended", handleEnded);
//       if (sourceBufferRef.current) {
//         sourceBufferRef.current.removeEventListener("updateend", onUpdateEnd);
//         mediaSource.removeSourceBuffer(sourceBufferRef.current);
//       }
//       URL.revokeObjectURL(video.src);
//       if (video) {
//         video.pause();
//         video.src = "";
//         video.load();
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (isVisible && canPlay) {
//       const videoElement = videoRef.current;
//       if (videoElement) {
//         videoElement
//           .play()
//           .then(() => {
//             console.log("Video started playing.");
//           })
//           .catch((error) => {
//             console.error("Playback failed:", error);
//           });
//       }
//     } else {
//       videoRef.current?.pause();
//     }
//   }, [isVisible, canPlay]);

//   return (
//     <video
//       ref={videoRef}
//       style={{ width: "100%", height: "100%" }}
//       onPlay={onStart}
//     />
//   );
// };

// export default SeamlessVideoPlayer;

import React, { useEffect, useRef, useState } from "react";

const SeamlessVideoPlayer = ({
  initialVideoUrl,
  isVisible = true,
  onEnded,
  onStart,
  onAllVideosEnded,
  onLoadingChange,
}) => {
  const videoRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);
  const queuedVideos = useRef([]);
  const [canPlay, setCanPlay] = useState(false);
  const baseUrl = useRef("");
  const initialUrlSet = useRef(false);
  const isStopped = useRef(false);
  const currentIndexRef = useRef(0);
  const fetchInProgress = useRef({});
  const retryCounts = useRef({});
  const RETRY_DELAY = 1000; // 1 second delay between retries
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (!initialUrlSet.current && initialVideoUrl) {
      console.log("initialVideoUrl: ", initialVideoUrl);
      const urlPart = initialVideoUrl.videoPath
        .split("/video/")[1]
        .split(/(_\d+)?\.webm$/)[0];
      // baseUrl.current = `/video/${urlPart}`;
      baseUrl.current = `/proxy/video/${urlPart}`;
      initialUrlSet.current = true;
    }
    console.log("seamlessVideoPlayer: ", initialVideoUrl.videoPath);
  }, [initialVideoUrl]);

  const getVideoUrl = (index) => {
    if (index === "final") {
      return `${baseUrl.current}_final.webm`;
    } else {
      return `${baseUrl.current}_${index}.webm`;
    }
  };

  const fetchAndAppendVideo = async (index) => {
    if (isStopped.current) return;
    if (fetchInProgress.current[index]) return; // Avoid overlapping fetches
    fetchInProgress.current[index] = true;

    if (index === 0) {
      console.log("sleeping...");
      await sleep(6500);
      console.log("sleep end");
      setIsInitialLoading(false);
    }

    const url = getVideoUrl(index);
    const mediaSource = mediaSourceRef.current;
    retryCounts.current[index] = 0;

    const MAX_RETRIES_BEFORE_FINAL_CHECK = 5;

    while (!isStopped.current) {
      try {
        console.log(`Attempting to fetch video ${index}`);
        const response = await fetch(url, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        fetchInProgress.current[index] = false;
        retryCounts.current[index] = 0;

        // Add to queue
        queuedVideos.current.push(arrayBuffer);

        // Append if possible
        if (
          mediaSource &&
          mediaSource.readyState === "open" &&
          sourceBufferRef.current &&
          !sourceBufferRef.current.updating
        ) {
          appendNextVideo();
        }

        // Fetching successful, proceed to next index
        currentIndexRef.current = index + 1;
        // Proceed to fetch next segment
        fetchAndAppendVideo(currentIndexRef.current);
        return;
      } catch (error) {
        retryCounts.current[index] += 1;
        console.error(
          `Error fetching video ${index}, retry ${retryCounts.current[index]}:`,
          error
        );
        if (retryCounts.current[index] % MAX_RETRIES_BEFORE_FINAL_CHECK === 0) {
          console.log(
            `Reached ${retryCounts.current[index]} retries for video ${index}. Checking for final video.`
          );
          await checkForFinalVideo();
          if (isStopped.current) {
            fetchInProgress.current[index] = false;
            return;
          }
        }
        await sleep(RETRY_DELAY);
        // Continue loop to retry
      }
    }

    fetchInProgress.current[index] = false;
  };

  const checkForFinalVideo = async () => {
    if (isStopped.current) return;
    const finalUrl = getVideoUrl("final");
    const mediaSource = mediaSourceRef.current;
    try {
      console.log("Checking for '_final' video.");
      const response = await fetch(finalUrl, {
        credentials: "include",
      });
      if (response.ok) {
        // '_final' video exists
        console.log(
          `'_final' video exists. Will end stream after buffered videos.`
        );
        isStopped.current = true;
        // If buffer is empty, end stream immediately
        if (
          queuedVideos.current.length === 0 &&
          mediaSource &&
          mediaSource.readyState === "open"
        ) {
          mediaSource.endOfStream();
        }
        // Else, allow buffered videos to play out
      } else {
        // '_final' video does not exist, continue fetching
        console.log(`'_final' video does not exist. Continuing to retry.`);
      }
    } catch (error) {
      console.error("Error checking for '_final' video:", error);
      // Decide whether to stop or continue retrying
      // For now, we'll continue retrying
    }
  };

  const appendNextVideo = () => {
    const mediaSource = mediaSourceRef.current;
    if (
      queuedVideos.current.length > 0 &&
      mediaSource &&
      mediaSource.readyState === "open" &&
      sourceBufferRef.current &&
      !sourceBufferRef.current.updating
    ) {
      const nextVideo = queuedVideos.current.shift();
      console.log("Appending video segment, size:", nextVideo.byteLength);
      try {
        sourceBufferRef.current.appendBuffer(nextVideo);
        console.log("Buffer appended successfully.");
      } catch (error) {
        console.error("Error appending buffer:", error);
        // Re-queue the video and retry later
        queuedVideos.current.unshift(nextVideo);
      }
    } else if (isStopped.current && queuedVideos.current.length === 0) {
      // If we've been instructed to stop and the buffer is empty, end the stream
      if (mediaSource && mediaSource.readyState === "open") {
        console.log("Ending stream after all videos have been appended.");
        mediaSource.endOfStream();
      }
    }
  };

  const onUpdateEnd = () => {
    appendNextVideo();

    // Set canPlay to true after the first video is appended
    if (!canPlay) {
      setCanPlay(true);
    }
  };

  const sourceOpen = (e) => {
    console.log("sourceOpen()");
    const mediaSource = e.target;
    try {
      const mimeType = 'video/webm; codecs="vp8, vorbis"';
      sourceBufferRef.current = mediaSource.addSourceBuffer(mimeType);
      sourceBufferRef.current.mode = "sequence";
      sourceBufferRef.current.addEventListener("updateend", onUpdateEnd);
      console.log(
        "MediaSource readyState after sourceOpen:",
        mediaSource.readyState
      );
      // Start by fetching the first video
      currentIndexRef.current = 0;
      fetchAndAppendVideo(currentIndexRef.current);
    } catch (error) {
      console.error("Error during sourceOpen:", error);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    video.src = URL.createObjectURL(mediaSource);
    const handleSourceOpen = (e) => sourceOpen(e);
    mediaSource.addEventListener("sourceopen", handleSourceOpen);
    const handleEnded = () => {
      console.log("Playback ended.");
      onAllVideosEnded();
    };
    video.addEventListener("ended", handleEnded);
    return () => {
      mediaSource.removeEventListener("sourceopen", handleSourceOpen);
      video.removeEventListener("ended", handleEnded);
      if (sourceBufferRef.current) {
        sourceBufferRef.current.removeEventListener("updateend", onUpdateEnd);
        mediaSource.removeSourceBuffer(sourceBufferRef.current);
      }
      URL.revokeObjectURL(video.src);
      if (video) {
        video.pause();
        video.src = "";
        video.load();
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible && canPlay) {
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement
          .play()
          .then(() => {
            console.log("Video started playing.");
          })
          .catch((error) => {
            console.error("Playback failed:", error);
          });
      }
    } else {
      videoRef.current?.pause();
    }
  }, [isVisible, canPlay]);

  return (
    <video
      ref={videoRef}
      style={{ width: "100%", height: "100%" }}
      onPlay={onStart}
    />
  );
};

export default SeamlessVideoPlayer;
