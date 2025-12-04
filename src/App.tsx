import "./index.css";
import React, { useState, useEffect, useCallback } from "react";
import { AuthButton } from './components/AuthButton';
import { ShareButton } from './components/ShareButton';
import { useWebSocket } from './hooks/useWebSocket';
import { useRatios } from './hooks/useRatios';
import { useLeaderboards } from './hooks/useLeaderboards';
import { useAuth } from './hooks/useAuth';
import { formatRelativeTime, cleanContent } from './utils/formatting';
import { Post, VictimLeaderboardEntry, PerpetratorLeaderboardEntry, FeedType, SortType } from './types';

// Inline SVG components
const HeartIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g id="SVGRepo_bgCarrier" strokeWidth="0"/>
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"/>
    <g id="SVGRepo_iconCarrier">
      <path d="M4.03553 1C1.80677 1 0 2.80677 0 5.03553C0 6.10582 0.42517 7.13228 1.18198 7.88909L7.14645 13.8536C7.34171 14.0488 7.65829 14.0488 7.85355 13.8536L13.818 7.88909C14.5748 7.13228 15 6.10582 15 5.03553C15 2.80677 13.1932 1 10.9645 1C9.89418 1 8.86772 1.42517 8.11091 2.18198L7.5 2.79289L6.88909 2.18198C6.13228 1.42517 5.10582 1 4.03553 1Z" fill="#e13737"/>
    </g>
  </svg>
);

const PopoutIcon = ({ className }: { className?: string }) => (
  <svg fill="currentColor" width="16" height="16" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" className={className}>
    <g id="SVGRepo_bgCarrier" strokeWidth="0"/>
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"/>
    <g id="SVGRepo_iconCarrier">
      <title>popout</title>
      <path d="M15.694 13.541l2.666 2.665 5.016-5.017 2.59 2.59 0.004-7.734-7.785-0.046 2.526 2.525-5.017 5.017zM25.926 16.945l-1.92-1.947 0.035 9.007-16.015 0.009 0.016-15.973 8.958-0.040-2-2h-7c-1.104 0-2 0.896-2 2v16c0 1.104 0.896 2 2 2h16c1.104 0 2-0.896 2-2l-0.074-7.056z"/>
    </g>
  </svg>
);

// Powered by X SVG component
const PoweredByXIcon = ({ className }: { className?: string }) => (
  <svg width="115" height="20" viewBox="0 0 230 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M209.454 1H8.54585C4.37839 1 1 4.58172 1 9V32C1 36.4183 4.37839 40 8.54585 40H209.454C213.622 40 217 36.4183 217 32V9C217 4.58172 213.622 1 209.454 1Z" fill="transparent"/>
    <path d="M47 8V32" stroke="#333333"/>
    <path d="M65.1449 25V15.5455H68.3395C69.0812 15.5455 69.6875 15.6793 70.1584 15.9471C70.6323 16.2118 70.9832 16.5703 71.2109 17.0227C71.4387 17.4751 71.5526 17.9799 71.5526 18.5369C71.5526 19.094 71.4387 19.6003 71.2109 20.0558C70.9863 20.5112 70.6385 20.8744 70.1676 21.1452C69.6967 21.413 69.0935 21.5469 68.358 21.5469H66.0682V20.5312H68.321C68.8288 20.5312 69.2366 20.4435 69.5444 20.2681C69.8522 20.0927 70.0753 19.8557 70.2138 19.5572C70.3554 19.2556 70.4261 18.9155 70.4261 18.5369C70.4261 18.1584 70.3554 17.8198 70.2138 17.5213C70.0753 17.2228 69.8506 16.9889 69.5398 16.8196C69.2289 16.6473 68.8165 16.5611 68.3026 16.5611H66.2898V25H65.1449ZM76.0536 25.1477C75.4135 25.1477 74.8518 24.9954 74.3686 24.6907C73.8885 24.386 73.513 23.9598 73.2422 23.4119C72.9744 22.8641 72.8406 22.224 72.8406 21.4915C72.8406 20.7528 72.9744 20.1081 73.2422 19.5572C73.513 19.0063 73.8885 18.5785 74.3686 18.2738C74.8518 17.9691 75.4135 17.8168 76.0536 17.8168C76.6938 17.8168 77.2539 17.9691 77.734 18.2738C78.2172 18.5785 78.5927 19.0063 78.8604 19.5572C79.1313 20.1081 79.2667 20.7528 79.2667 21.4915C79.2667 22.224 79.1313 22.8641 78.8604 23.4119C78.5927 23.9598 78.2172 24.386 77.734 24.6907C77.2539 24.9954 76.6938 25.1477 76.0536 25.1477ZM76.0536 24.169C76.5399 24.169 76.94 24.0444 77.2539 23.7951C77.5678 23.5458 77.8002 23.218 77.951 22.8118C78.1018 22.4055 78.1772 21.9654 78.1772 21.4915C78.1772 21.0175 78.1018 20.5759 77.951 20.1665C77.8002 19.7572 77.5678 19.4264 77.2539 19.174C76.94 18.9216 76.5399 18.7955 76.0536 18.7955C75.5674 18.7955 75.1673 18.9216 74.8533 19.174C74.5394 19.4264 74.3071 19.7572 74.1562 20.1665C74.0054 20.5759 73.93 21.0175 73.93 21.4915C73.93 21.9654 74.0054 22.4055 74.1562 22.8118C74.3071 23.218 74.5394 23.5458 74.8533 23.7951C75.1673 24.0444 75.5674 24.169 76.0536 24.169ZM82.2951 25L80.1346 17.9091H81.2795L82.8121 23.3381H82.886L84.4002 17.9091H85.5636L87.0593 23.3196H87.1332L88.6658 17.9091H89.8107L87.6502 25H86.5792L85.0281 19.5526H84.9173L83.3661 25H82.2951ZM93.9829 25.1477C93.2996 25.1477 92.7103 24.9969 92.2148 24.6953C91.7223 24.3906 91.3422 23.9659 91.0745 23.4212C90.8098 22.8733 90.6775 22.2363 90.6775 21.5099C90.6775 20.7836 90.8098 20.1435 91.0745 19.5895C91.3422 19.0324 91.7146 18.5985 92.1917 18.2876C92.6718 17.9737 93.2319 17.8168 93.8721 17.8168C94.2414 17.8168 94.6061 17.8783 94.9662 18.0014C95.3263 18.1245 95.654 18.3246 95.9495 18.6016C96.2449 18.8755 96.4804 19.2386 96.6558 19.6911C96.8312 20.1435 96.9189 20.7005 96.9189 21.3622V21.8239H91.453V20.8821H95.811C95.811 20.482 95.731 20.125 95.5709 19.8111C95.414 19.4972 95.1893 19.2494 94.8969 19.0678C94.6076 18.8862 94.266 18.7955 93.8721 18.7955C93.4381 18.7955 93.0626 18.9032 92.7456 19.1186C92.4317 19.331 92.1901 19.608 92.0209 19.9496C91.8516 20.2912 91.767 20.6574 91.767 21.0483V21.6761C91.767 22.2116 91.8593 22.6656 92.0439 23.038C92.2317 23.4073 92.4917 23.6889 92.8241 23.8828C93.1565 24.0736 93.5428 24.169 93.9829 24.169C94.2691 24.169 94.5276 24.129 94.7584 24.049C94.9923 23.9659 95.1939 23.8428 95.3632 23.6797C95.5325 23.5135 95.6633 23.3073 95.7556 23.0611L96.8082 23.3565C96.6974 23.7135 96.5112 24.0275 96.2496 24.2983C95.988 24.5661 95.6648 24.7753 95.2801 24.9261C94.8954 25.0739 94.463 25.1477 93.9829 25.1477ZM98.5763 25V17.9091H99.6288V18.9801H99.7027C99.8319 18.6293 100.066 18.3446 100.404 18.1261C100.743 17.9076 101.125 17.7983 101.549 17.7983C101.629 17.7983 101.729 17.7998 101.849 17.8029C101.969 17.806 102.06 17.8106 102.122 17.8168V18.9247C102.085 18.9155 102 18.9016 101.868 18.8832C101.739 18.8616 101.602 18.8509 101.457 18.8509C101.112 18.8509 100.804 18.9232 100.534 19.0678C100.266 19.2094 100.054 19.4064 99.8966 19.6587C99.7427 19.908 99.6657 20.1927 99.6657 20.5128V25H98.5763ZM106.17 25.1477C105.487 25.1477 104.898 24.9969 104.402 24.6953C103.91 24.3906 103.53 23.9659 103.262 23.4212C102.997 22.8733 102.865 22.2363 102.865 21.5099C102.865 20.7836 102.997 20.1435 103.262 19.5895C103.53 19.0324 103.902 18.5985 104.379 18.2876C104.859 17.9737 105.419 17.8168 106.06 17.8168C106.429 17.8168 106.794 17.8783 107.154 18.0014C107.514 18.1245 107.842 18.3246 108.137 18.6016C108.432 18.8755 108.668 19.2386 108.843 19.6911C109.019 20.1435 109.106 20.7005 109.106 21.3622V21.8239H103.641V20.8821H107.998C107.998 20.482 107.918 20.125 107.758 19.8111C107.601 19.4972 107.377 19.2494 107.084 19.0678C106.795 18.8862 106.454 18.7955 106.06 18.7955C105.626 18.7955 105.25 18.9032 104.933 19.1186C104.619 19.331 104.378 19.608 104.208 19.9496C104.039 20.2912 103.954 20.6574 103.954 21.0483V21.6761C103.954 22.2116 104.047 22.6656 104.231 23.038C104.419 23.4073 104.679 23.6889 105.012 23.8828C105.344 24.0736 105.73 24.169 106.17 24.169C106.457 24.169 106.715 24.129 106.946 24.049C107.18 23.9659 107.381 23.8428 107.551 23.6797C107.72 23.5135 107.851 23.3073 107.943 23.0611L108.996 23.3565C108.885 23.7135 108.699 24.0275 108.437 24.2983C108.175 24.5661 107.852 24.7753 107.468 24.9261C107.083 25.0739 106.65 25.1477 106.17 25.1477ZM113.441 25.1477C112.85 25.1477 112.329 24.9985 111.876 24.6999C111.424 24.3983 111.07 23.9736 110.815 23.4258C110.559 22.8749 110.431 22.224 110.431 21.473C110.431 20.7282 110.559 20.0819 110.815 19.5341C111.07 18.9863 111.425 18.5631 111.881 18.2646C112.336 17.966 112.863 17.8168 113.46 17.8168C113.921 17.8168 114.286 17.8937 114.554 18.0476C114.825 18.1984 115.031 18.3707 115.172 18.5646C115.317 18.7554 115.429 18.9124 115.509 19.0355H115.602V15.5455H116.691V25H115.639V23.9105H115.509C115.429 24.0398 115.316 24.2029 115.168 24.3999C115.02 24.5937 114.809 24.7676 114.535 24.9215C114.262 25.0723 113.897 25.1477 113.441 25.1477ZM113.589 24.169C114.026 24.169 114.395 24.0552 114.697 23.8274C114.999 23.5966 115.228 23.2781 115.385 22.8718C115.542 22.4625 115.62 21.9901 115.62 21.4545C115.62 20.9252 115.543 20.462 115.389 20.065C115.236 19.6649 115.008 19.354 114.706 19.1325C114.405 18.9078 114.032 18.7955 113.589 18.7955C113.127 18.7955 112.743 18.9139 112.435 19.1509C112.13 19.3848 111.901 19.7034 111.747 20.1065C111.596 20.5066 111.521 20.956 111.521 21.4545C111.521 21.9593 111.598 22.4179 111.752 22.8303C111.909 23.2396 112.139 23.5658 112.444 23.8089C112.752 24.049 113.134 24.169 113.589 24.169ZM122.642 25V15.5455H123.731V19.0355H123.824C123.904 18.9124 124.015 18.7554 124.156 18.5646C124.301 18.3707 124.507 18.1984 124.775 18.0476C125.046 17.8937 125.412 17.8168 125.873 17.8168C126.471 17.8168 126.997 17.966 127.452 18.2646C127.908 18.5631 128.263 18.9863 128.519 19.5341C128.774 20.0819 128.902 20.7282 128.902 21.473C128.902 22.224 128.774 22.8749 128.519 23.4258C128.263 23.9736 127.909 24.3983 127.457 24.6999C127.005 24.9985 126.483 25.1477 125.892 25.1477C125.436 25.1477 125.072 25.0723 124.798 24.9215C124.524 24.7676 124.313 24.5937 124.165 24.3999C124.018 24.2029 123.904 24.0398 123.824 23.9105H123.695V25H122.642ZM123.713 21.4545C123.713 21.9901 123.791 22.4625 123.948 22.8718C124.105 23.2781 124.335 23.5966 124.636 23.8274C124.938 24.0552 125.307 24.169 125.744 24.169C126.2 24.169 126.58 24.049 126.884 23.8089C127.192 23.5658 127.423 23.2396 127.577 22.8303C127.734 22.4179 127.812 21.9593 127.812 21.4545C127.812 20.956 127.735 20.5066 127.582 20.1065C127.431 19.7034 127.201 19.3848 126.894 19.1509C126.589 18.9139 126.206 18.7955 125.744 18.7955C125.301 18.7955 124.929 18.9078 124.627 19.1325C124.325 19.354 124.098 19.6649 123.944 20.065C123.79 20.462 123.713 20.9252 123.713 21.4545ZM131.016 27.6591C130.832 27.6591 130.667 27.6437 130.522 27.6129C130.378 27.5852 130.278 27.5575 130.222 27.5298L130.499 26.5696C130.764 26.6373 130.998 26.6619 131.201 26.6435C131.404 26.625 131.584 26.5342 131.741 26.3711C131.901 26.2111 132.047 25.951 132.18 25.5909L132.383 25.0369L129.761 17.9091H130.942L132.9 23.5597H132.974L134.931 17.9091H136.113L133.103 26.0341C132.967 26.4003 132.8 26.7035 132.6 26.9435C132.4 27.1867 132.167 27.3667 131.903 27.4837C131.641 27.6006 131.346 27.6591 131.016 27.6591ZM144.291 17.9091V18.8324H140.616V17.9091H144.291ZM141.687 16.2102H142.777V22.9688C142.777 23.2765 142.821 23.5073 142.911 23.6612C143.003 23.812 143.12 23.9136 143.261 23.9659C143.406 24.0152 143.558 24.0398 143.718 24.0398C143.839 24.0398 143.937 24.0336 144.014 24.0213C144.091 24.0059 144.152 23.9936 144.199 23.9844L144.42 24.9631C144.346 24.9908 144.243 25.0185 144.111 25.0462C143.979 25.0769 143.811 25.0923 143.608 25.0923C143.3 25.0923 142.998 25.0262 142.703 24.8938C142.41 24.7615 142.167 24.5599 141.973 24.2891C141.783 24.0182 141.687 23.6766 141.687 23.2642V16.2102ZM147.172 20.7344V25H146.082V15.5455H147.172V19.017H147.264C147.43 18.6508 147.679 18.36 148.012 18.1445C148.347 17.926 148.794 17.8168 149.351 17.8168C149.834 17.8168 150.257 17.9137 150.62 18.1076C150.983 18.2984 151.265 18.5923 151.465 18.9893C151.668 19.3833 151.77 19.8849 151.77 20.4943V25H150.68V20.5682C150.68 20.005 150.534 19.5695 150.242 19.2617C149.952 18.9509 149.551 18.7955 149.037 18.7955C148.68 18.7955 148.36 18.8709 148.076 19.0217C147.796 19.1725 147.575 19.3925 147.412 19.6818C147.252 19.9711 147.172 20.322 147.172 20.7344ZM156.736 25.1477C156.053 25.1477 155.463 24.9969 154.968 24.6953C154.475 24.3906 154.095 23.9659 153.827 23.4212C153.563 22.8733 153.43 22.2363 153.43 21.5099C153.43 20.7836 153.563 20.1435 153.827 19.5895C154.095 19.0324 154.468 18.5985 154.945 18.2876C155.425 17.9737 155.985 17.8168 156.625 17.8168C156.994 17.8168 157.359 17.8783 157.719 18.0014C158.079 18.1245 158.407 18.3246 158.702 18.6016C158.998 18.8755 159.233 19.2386 159.409 19.6911C159.584 20.1435 159.672 20.7005 159.672 21.3622V21.8239H154.206V20.8821H158.564C158.564 20.482 158.484 20.125 158.324 19.8111C158.167 19.4972 157.942 19.2494 157.65 19.0678C157.361 18.8862 157.019 18.7955 156.625 18.7955C156.191 18.7955 155.816 18.9032 155.499 19.1186C155.185 19.331 154.943 19.608 154.774 19.9496C154.605 20.2912 154.52 20.6574 154.52 21.0483V21.6761C154.52 22.2116 154.612 22.6656 154.797 23.038C154.985 23.4073 155.245 23.6889 155.577 23.8828C155.909 24.0736 156.296 24.169 156.736 24.169C157.022 24.169 157.281 24.129 157.511 24.049C157.745 23.9659 157.947 23.8428 158.116 23.6797C158.285 23.5135 158.416 23.3073 158.509 23.0611L159.561 23.3565C159.45 23.7135 159.264 24.0275 159.002 24.2983C158.741 24.5661 158.418 24.7753 158.033 24.9261C157.648 25.0739 157.216 25.1477 156.736 25.1477ZM166.02 15.5455L168.282 19.2433H168.355L170.618 15.5455H172.27L169.325 20.2727L172.289 25H170.627L168.355 21.353H168.282L166.01 25H164.348L167.363 20.2727L164.367 15.5455H166.02ZM177.924 25H176.41L179.812 15.5455H181.46L184.863 25H183.349L180.676 17.2628H180.602L177.924 25ZM178.178 21.2976H183.09V22.4979H178.178V21.2976ZM186.228 25V15.5455H189.598C190.334 15.5455 190.943 15.6793 191.426 15.9471C191.91 16.2148 192.271 16.5811 192.511 17.0458C192.751 17.5075 192.871 18.0276 192.871 18.6062C192.871 19.1879 192.75 19.7111 192.507 20.1758C192.267 20.6374 191.903 21.0037 191.417 21.2745C190.934 21.5423 190.326 21.6761 189.594 21.6761H187.276V20.4666H189.464C189.929 20.4666 190.306 20.3866 190.595 20.2266C190.885 20.0634 191.097 19.8419 191.232 19.5618C191.368 19.2817 191.436 18.9632 191.436 18.6062C191.436 18.2492 191.368 17.9322 191.232 17.6552C191.097 17.3782 190.883 17.1612 190.591 17.0043C190.301 16.8473 189.92 16.7688 189.446 16.7688H187.655V25H186.228ZM195.97 15.5455V25H194.544V15.5455H195.97Z" fill="white"/>
    <path d="M32.9918 30L25.2349 18.5344L32.4718 10H29.9528L24.1159 16.8862L19.4595 10H13.1118L20.5887 21.0523L13 30H15.519L21.7087 22.6995L26.6503 30H33H32.9918ZM18.6297 11.6082L29.9846 28.3918H27.4749L16.1179 11.6082H18.6277H18.6297Z" fill="white"/>
  </svg>
);

// Type for our post data structure
interface Post {
  id: string;
  author: string;
  authorProfileImage?: string;
  content: string;
  likes: number;
  timestamp: string;
  replies: Reply[];
  images?: string[];
}

interface Reply {
  id: string;
  author: string;
  authorProfileImage?: string;
  content: string;
  likes: number;
  isRatio: boolean;
  isBrutalRatio: boolean;
  isLethalRatio: boolean;
  images?: string[];
}

// Helper function to format relative time
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffMs = now.getTime() - postTime.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return postTime.toLocaleDateString();
  }
};

// Helper function to clean content by removing t.co links
const cleanContent = (content: string): string => {
  // Remove https://t.co links (Twitter's URL shortener)
  return content.replace(/https:\/\/t\.co\/\w+/g, '').trim();
};

// Mock data for demonstration - used as fallback
const mockPosts: Post[] = [
  {
    id: "1",
    author: "techguru",
    content: "Just launched my new AI startup! 🚀 Can't wait to see what the future holds.",
    likes: 750,
    timestamp: "2024-11-07T14:30:00Z",
    replies: [
      {
        id: "101",
        author: "skeptic_dev",
        content: "AI startups are so 2023. What's your unique value prop?",
        likes: 156,
        isRatio: false,
        isBrutalRatio: false,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "2",
    author: "design_master",
    content: "Flat design is dead. Time for brutalism in UI! 💀",
    likes: 1200,
    timestamp: "2024-11-07T13:15:00Z",
    replies: [
      {
        id: "201",
        author: "ux_lover",
        content: "Actually, brutalism has been around forever. It's not new.",
        likes: 2800,
        isRatio: true,
        isBrutalRatio: true,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "3",
    author: "ceo_startup",
    content: "Our team just hit unicorn status! 🦄 Time to celebrate!",
    likes: 2500,
    timestamp: "2024-11-07T12:45:00Z",
    replies: [
      {
        id: "301",
        author: "finance_guru",
        content: "Unicorn? More like a donkey. Your valuation is inflated garbage.",
        likes: 150,
        isRatio: false,
        isBrutalRatio: false,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "4",
    author: "influencer_pro",
    content: "Just dropped my new single! Stream it now 🎵 #NewMusic",
    likes: 3800,
    timestamp: "2024-11-07T11:20:00Z",
    replies: [
      {
        id: "401",
        author: "music_critic",
        content: "This is absolutely terrible. How do you even call yourself a musician?",
        likes: 42000,
        isRatio: true,
        isBrutalRatio: true,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "5",
    author: "fitness_guru",
    content: "Lost 50lbs in 3 months with this ONE weird trick! 💪",
    likes: 5200,
    timestamp: "2024-11-07T10:10:00Z",
    replies: [
      {
        id: "501",
        author: "science_fan",
        content: "Please stop spreading misinformation. Weight loss requires diet + exercise.",
        likes: 58000,
        isRatio: true,
        isBrutalRatio: true,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "6",
    author: "crypto_trader",
    content: "This coin is going to 1000x! Buy now before it's too late! 📈",
    likes: 6800,
    timestamp: "2024-11-07T09:30:00Z",
    replies: [
      {
        id: "601",
        author: "bear_market",
        content: "This is a rug pull waiting to happen. DYOR people.",
        likes: 1200,
        isRatio: false,
        isBrutalRatio: false,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "7",
    author: "celebrity_news",
    content: "BREAKING: Major celebrity scandal drops! 🍿",
    likes: 8500,
    timestamp: "2024-11-07T08:45:00Z",
    replies: [
      {
        id: "701",
        author: "gossip_expert",
        content: "Old news. This was leaked weeks ago.",
        likes: 3400,
        isRatio: false,
        isBrutalRatio: false,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "8",
    author: "politician_pro",
    content: "My new policy will change everything! Vote for change! 🗳️",
    likes: 9200,
    timestamp: "2024-11-07T07:15:00Z",
    replies: [
      {
        id: "801",
        author: "fact_checker",
        content: "Your facts are wrong. Here's the actual data...",
        likes: 5600,
        isRatio: false,
        isLethalRatio: false,
        isBrutalRatio: false
      }
    ]
  }
];

const PostCard = ({ post, onUsernameClick }: { post: Post; onUsernameClick?: (username: string) => void }) => {
  const hasRatio = post.replies.some(reply => reply.likes > post.likes);
  const hasBrutalRatio = post.replies.some(reply => reply.likes >= post.likes * 10);
  const hasLethalRatio = post.replies.some(reply => reply.likes >= post.likes * 100);

  return (
    <div className={`group relative rounded-xl border transition-all duration-300 ${
      hasLethalRatio
        ? 'border-purple-500/50 bg-purple-900/10 shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-[0_0_40px_rgba(168,85,247,0.25)]'
        : hasBrutalRatio
        ? 'border-orange-500/50 bg-orange-900/10 shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:shadow-[0_0_40px_rgba(249,115,22,0.25)]'
        : hasRatio
        ? 'border-red-500/40 bg-red-900/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
    } p-5`}>
      
      {/* Original Post */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <a
              href={`https://x.com/${post.author}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full overflow-hidden border border-white/10 transition-transform hover:scale-105"
              title={`@${post.author}'s profile`}
            >
              {post.authorProfileImage ? (
                <img 
                  src={post.authorProfileImage} 
                  alt={`@${post.author}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-white font-medium">
                  {post.author[0].toUpperCase()}
                </div>
              )}
            </a>
            <div className="flex flex-col leading-tight">
              <button
                onClick={() => onUsernameClick?.(post.author)}
                className="font-medium text-white hover:underline text-left"
              >
                @{post.author}
              </button>
              <span className="text-xs text-white/40">{formatRelativeTime(post.timestamp)}</span>
            </div>
          </div>
          
          <a
            href={`https://x.com/${post.author}/status/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="View post on X"
          >
            <PopoutIcon className="w-4 h-4" />
          </a>
        </div>

        <p className="text-white/90 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap">{cleanContent(post.content)}</p>

        {/* Display images if available */}
        {post.images && post.images.length > 0 && (
          <div className="mb-4">
            <div className={`grid gap-2 ${
              post.images.length === 1 ? 'grid-cols-1' :
              post.images.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {post.images.slice(0, 4).map((imageUrl, index) => (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-lg border border-white/10 ${
                    post.images!.length === 3 && index === 0 ? 'row-span-2' : ''
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                    onClick={() => window.open(imageUrl, '_blank')}
                    style={{
                      aspectRatio: post.images!.length === 1 ? '16/9' :
                                   post.images!.length === 2 ? '1/1' :
                                   post.images!.length === 3 && index === 0 ? '1/2' :
                                   '1/1'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-white/40 font-mono">
          <div className="flex items-center gap-1.5">
            <HeartIcon className="w-3.5 h-3.5" />
            <span>{post.likes.toLocaleString()} likes</span>
          </div>
          {hasRatio && (
            <div className="flex items-center gap-1.5 text-red-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span>Ratio detected</span>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {post.replies.length > 0 && (
        <div className="space-y-3 pl-4 sm:pl-8 border-l border-white/10 relative before:absolute before:left-0 before:top-0 before:w-px before:h-full before:bg-gradient-to-b before:from-white/20 before:to-transparent">
          {post.replies.map(reply => (
            <div key={reply.id} className={`relative rounded-lg p-4 border backdrop-blur-sm transition-all ${
              reply.isLethalRatio
                ? 'border-purple-500/40 bg-purple-500/10'
                : reply.isBrutalRatio
                ? 'border-orange-500/40 bg-orange-500/10'
                : reply.isRatio
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-white/10 bg-white/5'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://x.com/${reply.author}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 rounded-full overflow-hidden border border-white/10"
                  >
                    {reply.authorProfileImage ? (
                      <img 
                        src={reply.authorProfileImage} 
                        alt={`@${reply.author}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-[10px]">
                        {reply.author[0].toUpperCase()}
                      </div>
                    )}
                  </a>
                  <button
                    onClick={() => onUsernameClick?.(reply.author)}
                    className="font-medium text-white/90 text-sm hover:text-white"
                  >
                    @{reply.author}
                  </button>
                  
                  {reply.isLethalRatio && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Lethal
                    </span>
                  )}
                  {reply.isBrutalRatio && !reply.isLethalRatio && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      Brutal
                    </span>
                  )}
                </div>
                
                <a
                  href={`https://x.com/${reply.author}/status/${reply.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-white transition-colors"
                >
                  <PopoutIcon className="w-3 h-3" />
                </a>
              </div>

              <p className="text-white/80 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{cleanContent(reply.content)}</p>

              {/* Reply Images */}
              {reply.images && reply.images.length > 0 && (
                <div className="mb-3">
                  <div className={`grid gap-1 ${
                    reply.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                  }`}>
                    {reply.images.slice(0, 2).map((imageUrl, index) => (
                      <div key={index} className="relative overflow-hidden rounded border border-white/10 h-24">
                        <img
                          src={imageUrl}
                          alt={`Reply image ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5 text-white/40">
                  <HeartIcon className="w-3 h-3" />
                  <span className="text-white/60">{reply.likes.toLocaleString()} likes</span>
                </div>
                
                {reply.likes > post.likes && (
                  <div className={`font-bold ${
                    reply.isLethalRatio ? 'text-purple-400' :
                    reply.isBrutalRatio ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {(reply.likes / Math.max(1, post.likes)).toFixed(1)}x ratio
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Action */}
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
        <ShareButton
          ratio={post.replies[0]?.isRatio ? (post.replies[0].likes / post.likes) : 0}
          parentAuthor={post.author}
          replyAuthor={post.replies[0]?.author || ''}
          parentTweetId={post.id}
          replyTweetId={post.replies[0]?.id || ''}
        />
      </div>
    </div>
  );
};

export function App() {
  const [activeFeed, setActiveFeed] = useState<'recents' | 'victims' | 'perpetrators'>('recents');
  const [minLikes, setMinLikes] = useState(1000);
  const [sortBy, setSortBy] = useState<'recency' | 'brutality'>('recency');
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyBrutal, setShowOnlyBrutal] = useState(false);
  const [showOnlyLethal, setShowOnlyLethal] = useState(false);
  const [filterUsername, setFilterUsername] = useState('');

  // Authentication hook
  const { user: currentUser, isAuthenticated } = useAuth();

  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [victimsLeaderboard, setVictimsLeaderboard] = useState<VictimLeaderboardEntry[]>([]);
  const [perpetratorsLeaderboard, setPerpetratorsLeaderboard] = useState<PerpetratorLeaderboardEntry[]>([]);
  const [totalRatios, setTotalRatios] = useState<number>(0);

  // Convert stored ratio to Post format
  const convertRatioToPost = (ratio: any): Post => {
    return {
      id: ratio.parent.id,
      author: ratio.parent.author,
      authorProfileImage: ratio.parent.authorProfileImage,
      content: ratio.parent.content,
      likes: ratio.parent.likes,
      timestamp: ratio.parent.timestamp,
      images: ratio.parent.images,
      replies: [{
        id: ratio.reply.id,
        author: ratio.reply.author,
        authorProfileImage: ratio.reply.authorProfileImage,
        content: ratio.reply.content,
        likes: ratio.reply.likes,
        images: ratio.reply.images,
        isRatio: ratio.isRatio,
        isBrutalRatio: ratio.isBrutalRatio,
        isLethalRatio: ratio.isLethalRatio || false
      }]
    };
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      console.log("📡 Connected to backend");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "connected":
            // Initial connection - load data with current filters
            console.log(`📡 WebSocket connected, loading initial data`);
            loadPosts(filterUsername || undefined);
            break;

          case "ratios_updated":
            // Data updated on server - refresh with current filters
            console.log(`📊 Server data updated, refreshing view`);
            loadPosts(filterUsername || undefined);
            break;

          case "pong":
            // Heartbeat response
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    ws.onclose = () => {
      console.log("📡 Disconnected from backend");
      setWsConnected(false);
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Connection to backend failed");
    };

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      ws.close();
    };
  }, []);

  // Manual refresh - fetches current data from server without triggering new API poll
  const loadPosts = useCallback(async (usernameFilter?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters using current state values
      const params = new URLSearchParams({
        limit: '100',
        sortBy: sortBy,
        showOnlyBrutal: showOnlyBrutal.toString(),
        showOnlyLethal: showOnlyLethal.toString(),
        minLikes: minLikes.toString(),
      });

      // Add username filter if provided
      if (usernameFilter && usernameFilter.trim()) {
        params.append('username', usernameFilter.trim().toLowerCase().replace(/^@/, ''));
      }

      const response = await fetch(`/api/ratios?${params}`, { method: "GET" });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load ratios");
      }

      // Convert and set the posts
      const convertedPosts = result.data.map(convertRatioToPost);
      setPosts(convertedPosts);
      setLastUpdate(Date.now());
      
      // Update total ratios count from stats
      if (result.stats && result.stats.total) {
        setTotalRatios(result.stats.total);
      }

      console.log(`✅ Refreshed view: ${result.data.length} ratios loaded (${result.stats?.total || 0} total)`);
    } catch (err) {
      console.error("Error loading ratios:", err);
      setError(err instanceof Error ? err.message : "Failed to load ratios");
    } finally {
      setLoading(false);
    }
  }, [sortBy, showOnlyBrutal, showOnlyLethal, minLikes]); // Dependencies ensure fresh state values

  // Auto-refresh when filter states change (checkboxes and min likes)
  useEffect(() => {
    if (wsConnected) { // Only auto-refresh if WebSocket is connected
      console.log(`🔄 Filter state changed, auto-refreshing with current filters`);
      loadPosts(filterUsername || undefined);
    }
  }, [sortBy, showOnlyBrutal, showOnlyLethal, minLikes, loadPosts, wsConnected]); // Added minLikes to dependencies

  // Load leaderboards from backend
  const loadLeaderboards = async () => {
    try {
      const response = await fetch("/api/leaderboards", { method: "GET" });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load leaderboards");
      }

      setVictimsLeaderboard(result.data.victims);
      setPerpetratorsLeaderboard(result.data.perpetrators);

      console.log(`✅ Leaderboards loaded: ${result.data.victims.length} victims, ${result.data.perpetrators.length} perpetrators`);
    } catch (err) {
      console.error("Error loading leaderboards:", err);
    }
  };

  // Enrich a user when they filter by username
  const enrichUser = async (username: string) => {
    if (!username.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const cleanUsername = username.trim().replace(/^@/, '');

      console.log(`🔍 Enriching user: ${cleanUsername}`);

      const response = await fetch("/api/enrich-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: cleanUsername }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to enrich user");
      }

      console.log(`✅ Enriched ${cleanUsername}: ${result.enrichedRatios} new ratios, ${result.totalTrackedUsers} total tracked users`);

      // WebSocket will automatically update the posts when enrichment completes

    } catch (err) {
      console.error("Error enriching user:", err);
      setError(err instanceof Error ? err.message : "Failed to enrich user");
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking on usernames to filter by that user
  const handleUsernameClick = async (username: string) => {
    const cleanUsername = username.trim().replace(/^@/, '');
    setFilterUsername(cleanUsername);

    // First enrich the user to ensure we have their data
    await enrichUser(cleanUsername);
    // Then load posts filtered by that user
    loadPosts(cleanUsername);
  };

  // Posts are now filtered by backend, so use them directly
  const filteredByLikes = posts;

  // Sort the filtered posts
  const sortedPosts = [...filteredByLikes].sort((a, b) => {
    if (sortBy === 'recency') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else { // brutality
      const aMaxRatio = Math.max(...a.replies.map(reply => reply.likes / a.likes), 0);
      const bMaxRatio = Math.max(...b.replies.map(reply => reply.likes / b.likes), 0);
      return bMaxRatio - aMaxRatio;
    }
  });

  const filteredPosts = sortedPosts;

  // Calculate leaderboards
  interface VictimLeaderboardEntry {
    username: string;
    profileImage?: string;
    ratioCount: number;
    totalLikes: number;
    worstRatio: {
      ratio: number;
      postId: string;
      postContent: string;
      postLikes: number;
      postImages?: string[];
      replyId: string;
      replyContent: string;
      replyLikes: number;
      replyAuthor: string;
      replyImages?: string[];
    };
  }

  interface PerpetratorLeaderboardEntry {
    username: string;
    profileImage?: string;
    ratioCount: number;
    totalLikes: number;
    bestRatio: {
      ratio: number;
      postId: string;
      postContent: string;
      postLikes: number;
      postAuthor: string;
      postImages?: string[];
      replyId: string;
      replyContent: string;
      replyLikes: number;
      replyImages?: string[];
    };
  }

  // Load leaderboards when switching to leaderboard feeds
  useEffect(() => {
    if (activeFeed === 'victims' || activeFeed === 'perpetrators') {
      loadLeaderboards();
    }
  }, [activeFeed]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans antialiased selection:bg-white/20 overflow-x-hidden">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 [background:radial-gradient(100%_120%_at_50%_0%,rgba(0,0,0,0.6),transparent_60%)]"></div>
        <div className="absolute inset-0 [mask-image:radial-gradient(75%_75%_at_50%_45%,black,transparent)] [background:radial-gradient(65%_60%_at_50%_40%,rgba(255,255,255,0.02),rgba(255,255,255,0)_70%)]"></div>
      </div>

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md transition-all duration-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.href = '/'}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-white">
                <g><path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z"></path></g>
              </svg>
              <span className="font-mono text-sm tracking-widest uppercase text-white/90 hidden sm:block group-hover:text-white transition-colors">Ratio Finder</span>
            </div>
            
            <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>
            
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500'} transition-colors`}></div>
              <span className="font-mono text-[10px] tracking-wider uppercase text-white/40 hidden sm:inline-block">
                {wsConnected ? 'System Online' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Mobile Filters - Show only on mobile */}
      <div className="md:hidden border-b border-white/10 bg-[#0A0A0A] px-4 py-4 relative z-10">
        <div className="flex flex-col gap-4">
          {/* Mobile Refresh Button */}
          <button
            onClick={() => loadPosts(filterUsername || undefined)}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-3 sm:py-3 rounded-lg text-sm font-semibold transition-colors min-h-[44px]"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh View'}
          </button>

          {/* Mobile Sort and Filters */}
          <div className="grid grid-cols-2 gap-4">
            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recency' | 'brutality')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recency">🕒 Recent</option>
                <option value="brutality">💀 Brutal</option>
              </select>
            </div>

            {/* Min Likes Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min Likes: {minLikes.toLocaleString()}
              </label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="100"
                value={minLikes}
                onChange={(e) => setMinLikes(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1k</span>
                <span>10k</span>
              </div>
            </div>
          </div>

          {/* Mobile Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={showOnlyBrutal}
                onChange={(e) => setShowOnlyBrutal(e.target.checked)}
                className="mr-3 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm">Show only brutal ratios (10x+)</span>
            </label>

            <label className="flex items-center cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={showOnlyLethal}
                onChange={(e) => setShowOnlyLethal(e.target.checked)}
                className="mr-3 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm">Show only lethal ratios (100x+)</span>
            </label>
          </div>

          {/* Mobile User Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by User
            </label>
            <input
              type="text"
              value={filterUsername}
              onChange={(e) => setFilterUsername(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && filterUsername.trim()) {
                  // First enrich the user to ensure we have their data
                  await enrichUser(filterUsername);
                  // Then load posts filtered by that user
                  loadPosts(filterUsername);
                }
              }}
              placeholder="@username (press Enter)"
              className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[44px]"
              disabled={loading}
            />
            {filterUsername && (
              <button
                onClick={() => {
                  setFilterUsername('');
                  loadPosts(); // Reload without filter
                }}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors min-h-[44px] py-2"
                disabled={loading}
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex max-w-[1400px] mx-auto relative z-10">
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden md:block w-80 border-r border-white/10 p-6 min-h-[calc(100vh-4rem)] sticky top-16">
          {/* Refresh Button */}
          <button
            onClick={() => loadPosts(filterUsername || undefined)}
            disabled={loading}
            className="w-full group relative inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed mb-8 shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking X...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Refresh Feed
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw transition-transform group-hover:rotate-180"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
              </span>
            )}
          </button>

          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase mb-4 flex items-center gap-2">
                [<span>Sort Order</span>]
              </h3>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recency' | 'brutality')}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all hover:border-white/20 cursor-pointer"
                >
                  <option value="recency" className="bg-[#161616]">Most Recent First</option>
                  <option value="brutality" className="bg-[#161616]">Highest Ratio Impact</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase mb-4 flex items-center gap-2">
                [<span>Filters</span>]
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm text-white/80">Min. Reply Likes</label>
                    <span className="font-mono text-xs text-[#00BA7C]">{minLikes.toLocaleString()}</span>
                  </div>
                  
                  <div className="relative py-2">
                    <input
                      type="range"
                      min="1000"
                      max="10000"
                      step="100"
                      value={minLikes}
                      onChange={(e) => setMinLikes(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider accent-white"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-white/30 mt-2">
                      <span>1K</span>
                      <span>10K</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showOnlyLethal ? 'bg-white border-white' : 'bg-transparent border-white/30 group-hover:border-white/50'}`}>
                      {showOnlyLethal && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={showOnlyLethal}
                      onChange={(e) => {
                        setShowOnlyLethal(e.target.checked);
                        if (e.target.checked) setShowOnlyBrutal(false);
                      }}
                    />
                    <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Lethal ratios only (100x+)</span>
                  </label>
                  
                  <label className="flex items-center cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showOnlyBrutal ? 'bg-white border-white' : 'bg-transparent border-white/30 group-hover:border-white/50'}`}>
                      {showOnlyBrutal && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={showOnlyBrutal}
                      onChange={(e) => {
                        setShowOnlyBrutal(e.target.checked);
                        if (e.target.checked) setShowOnlyLethal(false);
                      }}
                    />
                    <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Brutal ratios only (10x+)</span>
                  </label>
                </div>

                {/* User Filter */}
                <div className="pt-2 border-t border-white/5 mt-4">
                  <label className="block text-sm text-white/80 mb-3">
                    Track Specific User
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-white/30">@</span>
                    </div>
                    <input
                      type="text"
                      value={filterUsername}
                      onChange={(e) => setFilterUsername(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && filterUsername.trim()) {
                          await enrichUser(filterUsername);
                          loadPosts(filterUsername);
                        }
                      }}
                      placeholder="username"
                      className="w-full pl-8 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                      disabled={loading}
                    />
                  </div>
                  {filterUsername && (
                    <button
                      onClick={() => {
                        setFilterUsername('');
                        loadPosts(); 
                      }}
                      className="mt-2 text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1"
                      disabled={loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      Clear filter
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/10">
              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Total Ratios</span>
                  <span className="text-xs text-[#00BA7C] flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00BA7C] animate-pulse"></div>
                    Live
                  </span>
                </div>
                <div className="text-2xl font-mono font-medium text-white">
                  {totalRatios.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 pb-20">
          <div className="max-w-3xl mx-auto">
            {/* Feed Tabs */}
            <div className="mb-8">
              <div className="flex items-center gap-6 mb-6 border-b border-white/10">
                <button
                  onClick={() => setActiveFeed('recents')}
                  className={`pb-3 font-mono text-sm tracking-wide uppercase transition-all relative cursor-pointer ${
                    activeFeed === 'recents'
                      ? 'text-white font-medium'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Recent Discoveries
                  {activeFeed === 'recents' && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveFeed('victims')}
                  className={`pb-3 font-mono text-sm tracking-wide uppercase transition-all relative cursor-pointer ${
                    activeFeed === 'victims'
                      ? 'text-white font-medium'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Top Victims
                  {activeFeed === 'victims' && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveFeed('perpetrators')}
                  className={`pb-3 font-mono text-sm tracking-wide uppercase transition-all relative cursor-pointer ${
                    activeFeed === 'perpetrators'
                      ? 'text-white font-medium'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Top Ratio-ers
                  {activeFeed === 'perpetrators' && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                  )}
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-medium tracking-tight text-white">
                  {activeFeed === 'recents'
                    ? 'Live Feed'
                    : activeFeed === 'victims'
                    ? 'Hall of Shame'
                    : 'Hall of Fame'}
                </h2>
                <p className="text-white/50 text-sm max-w-xl">
                  {activeFeed === 'recents'
                    ? 'Real-time detection of ratio events across X. Auto-updating as new ratios are discovered.'
                    : activeFeed === 'victims'
                    ? 'Users who have suffered the most devastating ratios in the past 7 days.'
                    : 'The most ruthless ratio-ers on the platform in the past 7 days.'}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="text-red-500 mt-0.5">⚠️</div>
                  <div>
                    <p className="text-white font-medium mb-1">System Error</p>
                    <p className="text-white/60 text-sm mb-2">{error}</p>
                    <p className="text-white/40 text-xs font-mono">
                      Check BEARER_TOKEN configuration
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeFeed === 'recents' ? (
              // Recents Feed
              loading && posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative w-12 h-12 mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-white/60 font-mono text-sm animate-pulse">Scanning network for ratios...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                      <PostCard key={post.id} post={post} onUsernameClick={handleUsernameClick} />
                    ))
                  ) : (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                      <p className="text-white/40 font-mono text-sm">No ratios detected with current filters.</p>
                    </div>
                  )}
                </div>
              )
            ) : activeFeed === 'victims' ? (
              // Victims Leaderboard Feed
              <div className="space-y-4">
                {victimsLeaderboard.length > 0 ? (
                  <>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 flex items-center justify-between text-sm text-white/60 font-mono">
                      <span>Top {victimsLeaderboard.length} Victims</span>
                      <span>Based on {totalRatios} total ratios</span>
                    </div>
                    
                    {victimsLeaderboard.map((entry, index) => (
                      <div
                        key={entry.username}
                        className={`group relative rounded-xl border transition-all p-6 ${
                          index === 0
                            ? 'border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.1)]'
                            : index === 1
                            ? 'border-slate-400/50 bg-slate-400/10 shadow-[0_0_20px_rgba(148,163,184,0.1)]'
                            : index === 2
                            ? 'border-orange-700/50 bg-orange-700/10 shadow-[0_0_20px_rgba(194,65,12,0.1)]'
                            : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`font-mono font-bold text-2xl w-8 text-center ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-slate-400' :
                              index === 2 ? 'text-orange-700' :
                              'text-white/20'
                            }`}>
                              {index + 1}
                            </div>

                            <a
                              href={`https://x.com/${entry.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative"
                              title={`@${entry.username}'s profile`}
                            >
                              <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
                                index === 0 ? 'border-yellow-500' :
                                index === 1 ? 'border-slate-400' :
                                index === 2 ? 'border-orange-700' :
                                'border-white/10'
                              }`}>
                                {entry.profileImage ? (
                                  <img 
                                    src={entry.profileImage} 
                                    alt={`@${entry.username}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white font-bold">
                                    {entry.username[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                              {index < 3 && (
                                <div className="absolute -top-1 -right-1 text-lg">
                                  {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                                </div>
                              )}
                            </a>
                            
                            <div>
                              <a
                                href={`https://x.com/${entry.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-white text-lg hover:underline"
                              >
                                @{entry.username}
                              </a>
                              <div className="text-sm text-white/40 mt-0.5">
                                Ratio'd <span className="text-red-400 font-bold">{entry.ratioCount}x</span> this week
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right hidden sm:block">
                            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Damage</div>
                            <div className="text-xl font-mono font-medium text-red-400">
                              {entry.totalLikes.toLocaleString()} <span className="text-xs text-white/40">likes against</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-white/10 pt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Worst Defeat</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono border border-red-500/20">
                              {entry.worstRatio.ratio.toFixed(1)}x Ratio
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-4">
                            {/* Victim's Post */}
                            <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                              <p className="text-white/60 text-sm mb-3 line-clamp-2">{cleanContent(entry.worstRatio.postContent)}</p>
                              <div className="flex items-center justify-between text-xs text-white/30">
                                <span className="flex items-center gap-1.5">
                                  <HeartIcon className="w-3 h-3" />
                                  {entry.worstRatio.postLikes.toLocaleString()}
                                </span>
                                <a href={`https://x.com/${entry.username}/status/${entry.worstRatio.postId}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">View →</a>
                              </div>
                            </div>
                            
                            {/* The Ratio Reply with connecting line */}
                            <div className="relative sm:ml-12">
                              {/* Connection Line - positioned to connect from above */}
                              <div className="absolute left-[-1.5rem] top-[-0.5rem] bottom-0 w-0.5 bg-gradient-to-b from-white/10 to-red-500/20 hidden sm:block"></div>
                              
                              <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/10 relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-red-400 font-medium">@{entry.worstRatio.replyAuthor} replied:</span>
                                </div>
                                <p className="text-white/90 text-sm mb-3 line-clamp-3">{cleanContent(entry.worstRatio.replyContent)}</p>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1.5 text-red-400">
                                    <HeartIcon className="w-3 h-3" />
                                    {entry.worstRatio.replyLikes.toLocaleString()}
                                  </span>
                                  <a href={`https://x.com/${entry.worstRatio.replyAuthor}/status/${entry.worstRatio.replyId}`} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">View →</a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <div className="text-4xl mb-4 opacity-50">📊</div>
                    <h3 className="text-lg font-medium text-white mb-2">No Data Available</h3>
                    <p className="text-white/40 max-w-md mx-auto">
                      The leaderboard is currently empty. Wait for ratio events to be detected.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Perpetrators Leaderboard Feed
              <div className="space-y-4">
                {perpetratorsLeaderboard.length > 0 ? (
                  <>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 flex items-center justify-between text-sm text-white/60 font-mono">
                      <span>Top {perpetratorsLeaderboard.length} Ratio Assassins</span>
                      <span>From {totalRatios} total ratios</span>
                    </div>
                    
                    {perpetratorsLeaderboard.map((entry, index) => (
                      <div
                        key={entry.username}
                        className={`group relative rounded-xl border transition-all p-6 ${
                          index === 0
                            ? 'border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.1)]'
                            : index === 1
                            ? 'border-slate-400/50 bg-slate-400/10 shadow-[0_0_20px_rgba(148,163,184,0.1)]'
                            : index === 2
                            ? 'border-orange-700/50 bg-orange-700/10 shadow-[0_0_20px_rgba(194,65,12,0.1)]'
                            : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`font-mono font-bold text-2xl w-8 text-center ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-slate-400' :
                              index === 2 ? 'text-orange-700' :
                              'text-white/20'
                            }`}>
                              {index + 1}
                            </div>

                            <a
                              href={`https://x.com/${entry.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative"
                              title={`@${entry.username}'s profile`}
                            >
                              <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
                                index === 0 ? 'border-yellow-500' :
                                index === 1 ? 'border-slate-400' :
                                index === 2 ? 'border-orange-700' :
                                'border-white/10'
                              }`}>
                                {entry.profileImage ? (
                                  <img 
                                    src={entry.profileImage} 
                                    alt={`@${entry.username}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white font-bold">
                                    {entry.username[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                              {index < 3 && (
                                <div className="absolute -top-1 -right-1 text-lg">
                                  {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                                </div>
                              )}
                            </a>
                            
                            <div>
                              <a
                                href={`https://x.com/${entry.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-white text-lg hover:underline"
                              >
                                @{entry.username}
                              </a>
                              <div className="text-sm text-white/40 mt-0.5">
                                Ratio'd <span className="text-purple-400 font-bold">{entry.ratioCount}</span> user{entry.ratioCount !== 1 ? 's' : ''} this week
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right hidden sm:block">
                            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Likes Earned</div>
                            <div className="text-xl font-mono font-medium text-purple-400">
                              {entry.totalLikes.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-white/10 pt-4">
                          {entry.bestRatio && entry.bestRatio.ratio > 0 ? (
                            <>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Best Ratio</span>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono border border-purple-500/20">
                                  {entry.bestRatio.ratio.toFixed(1)}x
                                </span>
                              </div>
                              
                              <div className="flex flex-col gap-4">
                                {/* Victim's Post */}
                                <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-white/40">Original post by @{entry.bestRatio.postAuthor}:</span>
                                  </div>
                                  <p className="text-white/60 text-sm mb-3 line-clamp-2">{cleanContent(entry.bestRatio.postContent)}</p>
                                  <div className="flex items-center justify-between text-xs text-white/30">
                                    <span className="flex items-center gap-1.5">
                                      <HeartIcon className="w-3 h-3" />
                                      {entry.bestRatio.postLikes.toLocaleString()}
                                    </span>
                                    <a href={`https://x.com/${entry.bestRatio.postAuthor}/status/${entry.bestRatio.postId}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">View →</a>
                                  </div>
                                </div>

                                {/* The Killer Ratio with connecting line */}
                                <div className="relative sm:ml-12">
                                  {/* Connection Line - positioned to connect from above */}
                                  <div className="absolute left-[-1.5rem] top-[-0.5rem] bottom-0 w-0.5 bg-gradient-to-b from-white/10 to-purple-500/20 hidden sm:block"></div>
                                  
                                  <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/10 relative z-10">
                                    <p className="text-white/90 text-sm mb-3 line-clamp-3">{cleanContent(entry.bestRatio.replyContent)}</p>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="flex items-center gap-1.5 text-purple-400">
                                        <HeartIcon className="w-3 h-3" />
                                        {entry.bestRatio.replyLikes.toLocaleString()}
                                      </span>
                                      <a href={`https://x.com/${entry.username}/status/${entry.bestRatio.replyId}`} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">View →</a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-xs font-mono text-white/30 text-center py-4">
                              No ratios detected yet
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <div className="text-4xl mb-4 opacity-50">📊</div>
                    <h3 className="text-lg font-medium text-white mb-2">No Data Available</h3>
                    <p className="text-white/40 max-w-md mx-auto">
                      The leaderboard is currently empty. Wait for ratio events to be detected.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
